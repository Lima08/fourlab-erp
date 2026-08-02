# Estratégia de Sincronização (Offline-First)

Este documento detalha o funcionamento da sincronização de dados entre a aplicação de campo (PWA/Tablet) baseada em Dexie (IndexedDB) e o banco de dados remoto (Supabase PostgreSQL).

## 1. Fonte da Verdade e Persistência

Seguindo o paradigma _offline-first_, o banco de dados local (`VistoriaDB` via Dexie) dita a **fonte da verdade do que foi executado em campo**.

- Nenhuma escrita é feita diretamente no Supabase.
- Todas as ações do técnico (status, evidências, deleções) alteram o IndexedDB imediatamente e são enfileiradas (`syncQueue`) para processamento em background.

## 2. Estados de Sincronização (Projeto)

O estado geral do projeto é verificado cruzando informações da _view_ `project_sync_state` no Supabase com as filas locais:

- **`synced`**: O dispositivo e a nuvem estão com a mesma base de dados.
- **`pending`**: Existem mutações de itens/evidências do projeto aguardando conexão na `syncQueue`.
- **`update_available`**: A nuvem possui informações mais recentes (o campo `last_modified_at` remoto é maior que o `syncedAt` local).

## 3. O Fluxo da syncQueue

A fila (`syncQueue`) opera em formato FIFO (First-In, First-Out), de forma paralela à UI principal.

1. **Enqueue:** Modificações criam um registro na fila contendo o `type`, `payload` (JSON) e a data de criação.
2. **Drain:** Processada pelo `queueProcessor`, chamando APIs do Supabase (limitada a lotes de 10).
3. **Resiliência:** Em caso de erro na requisição remota, o contador de _attempts_ sobe. Após 3 falhas críticas contínuas, o evento move-se para a `deadLetterQueue`, impedindo bloqueio dos envios subsequentes.

## 4. Regras Exatas de Resolução de Conflitos

Devido a natureza offline, quando o técnico decidir puxar dados da nuvem (`pullUpdates`), o sistema avalia as seguintes restrições para proteção da vistoria:

1. **Edições Locais Não Sincronizadas Têm Prioridade**
   Se um item sofreu alteração local pendente (identificável se `syncedAt` é nulo ou anterior à alteração), a modificação do tablet não pode ser sobrescrita em hipótese alguma pelo download da nuvem. Ele substituirá a nuvem assim que a fila drenar.
2. **Atualização Remota Silenciosa**
   Se o Supabase possuir um `updated_at` mais atual e **não houver edição local** pendente para aquele item específico, a atualização desce para o Dexie de forma silenciosa e substitui a visualização do técnico.

3. **Conflito Direto de Status**
   Se um mesmo item for modificado paralelamente na nuvem (Plataforma Web) e no dispositivo local de maneiras divergentes (ex.: status divergentes), o sistema trava o fluxo ativando a flag `conflictStatus = true`. Nenhuma das fontes prevalece, e a UI do aplicativo obriga o técnico a escolher ativamente: "Manter local" ou "Baixar do servidor" através de um diálogo explícito de reconciliação.
