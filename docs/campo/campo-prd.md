# PRD — Épico 1: Campo e Vistoria Offline (PWA)

| Campo         | Valor                      |
| ------------- | -------------------------- |
| Status        | Aguardando revisão do time |
| Autor         | Lima                       |
| Última update | 12/06/2026                 |

---

## Contexto e Problema

### Situação Atual

Técnicos conduzem vistorias presenciais com base em PTs aprovados ou IPTU + normas. Hoje: anotações manuais (papel, planilhas impressas, WhatsApp), sem roteiro sequencial, sem padrão para associar foto/comentário/status a cada item.

Pós-campo, evidências são reorganizadas manualmente para montar o relatório — reintroduz erros, consome horas, impede rastreabilidade.

App de campo — acessado no tablet — digitaliza esse processo: guia item a item sem internet, coleta foto/vídeo/comentário vinculado a cada item, impede encerramento com pendências.

### Dores Mapeadas

| #   | Dor                                                                                      | Impacto Operacional                                                               |
| --- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | Sem roteiro — técnico depende da memória para não esquecer itens                         | Itens críticos sem verificação; retrabalho com nova visita                        |
| 2   | Fotos desassociadas dos itens — ficam soltas na galeria                                  | Montagem do relatório consome horas; risco de associar foto errada ao item errado |
| 3   | Sem controle de progresso — técnico não sabe quanto falta                                | Vistorias encerradas prematuramente; itens sem resolução                          |
| 4   | Dependência de conexão — locais comerciais/industriais frequentemente têm sinal instável | Paralisia quando não há internet                                                  |
| 5   | Sem registro de itens encontrados fora do PT original                                    | Irregularidades in loco fora da documentação oficial                              |
| 6   | Sem rastreabilidade de quem verificou o quê e quando                                     | Impossível auditar; dados históricos inexistentes                                 |

### Por Que Agora

Volume crescente de vistorias; gargalo manual limita escala. MVP formalizado em escopo e orçamento. Campo é núcleo do produto — todos os épicos seguintes (sync, plataforma, relatório) dependem da qualidade dos dados capturados aqui.

---

## Personas

| Persona     | Perfil                                                                    | Contexto de uso                                                                                         |
| ----------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Técnico** | Profissional que executa vistorias, prepara projetos e acompanha entregas | Perfil único com acesso a todas as ações — usa em campo (tablet, sem internet) e no escritório (online) |

---

## Objetivos

### Objetivo Principal

Substituir processo manual de vistoria por fluxo guiado offline, onde técnico registra status, foto e comentário item a item — garantindo cobertura total do checklist.

### Objetivos Específicos

- **OBJ-01:** Técnico executa vistoria completa — todos os itens com status e ao menos uma evidência por item irregular — sem conexão.
- **OBJ-02:** Cada item tem status, foto/vídeo e comentário com carimbo de data/hora, rastreável por técnico.
- **OBJ-03:** App bloqueia encerramento enquanto houver itens sem decisão.
- **OBJ-04:** Técnico registra itens não previstos no checklist diretamente em campo, sem conexão.
- **OBJ-05:** App instalável no tablet como app nativo — sem browser — e funciona offline após instalação e primeiro acesso.
- **OBJ-06:** Técnico carrega projetos do banco para o dispositivo com conexão, para executar vistoria offline.

---

## Requisitos Funcionais

### RF-01 — Autenticação

**Descrição:** Técnico acessa com e-mail e senha. Após primeiro login com conexão, sessão é mantida no dispositivo — app funciona offline sem novo login.

**Regras de negócio:**

- Sessão mantida entre acessos.
- Ao expirar, app exibe aviso sem bloquear vistoria em andamento.
- Sincronização bloqueada até sessão ser renovada com conexão.

**User Stories:**

> `US-01:` Como **técnico**, quero fazer login uma única vez no dispositivo, para o app funcionar em campo sem pedir senha novamente.

> `US-02:` Como **técnico**, quero ser direcionado automaticamente para a lista de projetos após entrar.

> `US-03:` Como **técnico**, quero receber aviso quando minha sessão expirar offline, sem bloquear a vistoria em andamento.

---

### RF-02 — Painel de Projetos

**Descrição:** Tela inicial com projetos carregados no dispositivo. Exibe nome do imóvel, endereço e status. Permite iniciar nova vistoria ou retomar uma em andamento.

**Regras de negócio:**

- Projeto só aparece após carregado via sincronização (RF-10).
- Status reflete andamento real: Não iniciado, Em andamento ou Concluído.
- Projetos concluídos visíveis, mas sem novas edições.

**User Stories:**

> `US-04:` Como **técnico**, quero ver projetos disponíveis no dispositivo, para saber quais vistorias estão prontas.

> `US-05:` Como **técnico**, quero ver o status de cada projeto (Não iniciado / Em andamento / Concluído), para priorizar agenda sem abrir cada projeto.

> `US-06:` Como **técnico**, quero retomar vistoria iniciada sem perder dados já registrados.

> `US-07:` Como **técnico**, quero ver quando projeto não está disponível offline, para saber que preciso conectar antes de ir ao campo.

---

### RF-03 — Disponibilidade Offline do Projeto

**Descrição:** Projeto carregado fica disponível sem internet. Registros salvos localmente em tempo real — não se perdem com fechamento do app ou reinicialização do tablet.

**Regras de negócio:**

- Nenhuma ação da vistoria depende de conexão após carregamento.
- Dados locais mantidos até sincronização com servidor (Épico 2).
- Técnico vê claramente quando está offline.

**User Stories:**

> `US-08:` Como **técnico**, quero acessar todos os itens do checklist sem internet.

> `US-09:` Como **técnico**, quero que tudo que registrar seja salvo automaticamente, para não perder dados se o app fechar.

> `US-10:` Como **técnico**, quero saber quando estou sem conexão, para entender que dados ainda não foram enviados ao servidor.

---

### RF-04 — Navegação Guiada da Vistoria

**Descrição:** Checklist organizado por andar/ambiente conforme estrutura do projeto. Técnico percorre sequencialmente ou navega livremente. Cada item exibe descrição, referência normativa (quando disponível), status atual e evidências registradas.

**Regras de negócio:**

- Estrutura de agrupamento vem do projeto — não pode ser alterada em campo.
- App suporta projetos com andares/ambientes e projetos planos (lista única).
- Itens concluídos têm marcação visual distinta dos pendentes.
- Referência normativa é somente leitura — vem do projeto original.

**User Stories:**

> `US-11:` Como **técnico**, quero ver itens agrupados por andar/ambiente, para seguir ordem lógica de deslocamento.

> `US-12:` Como **técnico**, quero navegar para o próximo item ou anterior com um único toque.

> `US-13:` Como **técnico**, quero acessar a lista completa e pular para qualquer item diretamente.

> `US-14:` Como **técnico**, quero ver a referência normativa do item, para justificar classificação de irregularidade sem consultar documentos externos.

> `US-15:` Como **técnico**, quero que itens concluídos tenham marcação visual distinta dos pendentes.

---

### RF-05 — Registro de Status por Item

**Descrição:** Para cada item, técnico define um de quatro status: **Regular**, **Irregular**, **Ausente** ou **Pendente**. Registro imediato, sem botão de salvar, associado ao técnico com carimbo de data/hora.

**Regras de negócio:**

- Quatro status fixos — técnico não pode criar novos.
- **Pendente** é estado inicial de todos os itens ao abrir projeto.
- Status pode ser alterado a qualquer momento durante vistoria ativa.
- Cada alteração registra automaticamente data, hora e identificação do técnico.

**User Stories:**

> `US-16:` Como **técnico**, quero marcar status com um único toque.

> `US-17:` Como **técnico**, quero status salvo automaticamente ao selecionar, sem confirmar ou clicar em "salvar".

> `US-18:` Como **técnico**, quero que minha identificação e horário sejam capturados automaticamente para rastreabilidade.

> `US-19:` Como **técnico**, quero corrigir status de item já preenchido a qualquer momento.

---

### RF-06 — Captura de Evidências por Item

**Descrição:** Cada item permite anexar fotos, vídeo curto e comentário. Mídias capturadas pela câmera ou galeria, vinculadas ao item com carimbo de data/hora. Para itens **Irregulares**, ao menos uma foto é obrigatória para encerrar.

**Regras de negócio:**

- Foto e vídeo ficam vinculados ao item — não existem sem associação.
- Item **Irregular** sem foto bloqueia encerramento.
- Vídeos têm duração máxima de 60 segundos por captura.
- Exclusão de evidências durante vistoria ativa exige confirmação.
- Comentário é livre e independente do status.

**User Stories:**

> `US-20:` Como **técnico**, quero tirar fotos pelo app associadas automaticamente ao item inspecionado.

> `US-21:` Como **técnico**, quero gravar vídeo curto para documentar irregularidades que foto não captura.

> `US-22:` Como **técnico**, quero adicionar comentário textual livre a qualquer item.

> `US-23:` Como **técnico**, quero ver fotos já tiradas na tela do item, sem abrir a galeria.

> `US-24:` Como **técnico**, quero ser alertado ao tentar encerrar com itens Irregulares sem foto.

> `US-25:` Como **técnico**, quero excluir foto ou vídeo capturado por engano.

---

### RF-07 — Controle de Progresso e Encerramento

**Descrição:** Vistoria exibe progresso em tempo real (itens concluídos vs. total). Encerramento bloqueado com itens **Pendentes** ou **Irregulares** sem foto. Antes de confirmar, tela de resumo lista todas as pendências.

**Regras de negócio:**

- Item com status diferente de **Pendente** conta como concluído.
- Itens removidos (RF-09) não entram no contador.
- Encerramento é irreversível — dados ficam apenas para leitura.
- Resumo pré-encerramento lista: itens pendentes, irregulares sem foto, extras adicionados em campo.

**User Stories:**

> `US-26:` Como **técnico**, quero contador de progresso sempre visível (ex.: "32 de 47 itens concluídos").

> `US-27:` Como **técnico**, quero ver resumo de pendências antes de encerrar.

> `US-28:` Como **técnico**, quero encerramento bloqueado com itens Pendentes ou Irregulares sem foto.

> `US-29:` Como **técnico**, quero identificar visualmente itens pendentes na lista.

---

### RF-08 — Adição de Item Extra em Campo

**Descrição:** Técnico inclui itens não previstos durante vistoria. Item extra segue mesmas regras dos regulares — status obrigatório, suporte a evidências — marcado como "Adicionado em campo".

**Regras de negócio:**

- Técnico define descrição e categoria — referência normativa opcional.
- Sem limite de itens extras por projeto.
- Itens extras entram nos contadores de progresso e regras de encerramento igual a itens originais.
- Origem "extra" visível ao revisar a vistoria.

**User Stories:**

> `US-30:` Como **técnico**, quero adicionar item ao checklist durante vistoria para documentar irregularidades fora do escopo original.

> `US-31:` Como **técnico**, quero que itens adicionados em campo sejam marcados como "Extra".

> `US-32:` Como **técnico**, quero selecionar categoria do item extra (ex.: Extintores / Saídas de Emergência / Iluminação).

---

### RF-09 — Remoção de Item com Histórico

**Descrição:** Técnico remove qualquer item — incluindo extras — quando não se aplica ao local. Item desaparece da lista ativa; registro da remoção (quem, quando) mantido para auditoria. Remoção desfeita durante a mesma sessão.

**Regras de negócio:**

- Toda remoção exige confirmação explícita.
- Item removido não bloqueia encerramento.
- Histórico de remoções disponível ao revisar.
- Restauração retorna item com status **Pendente**.

**User Stories:**

> `US-33:` Como **técnico**, quero remover item que não se aplica ao local, para não travar progresso em itens irrelevantes.

> `US-34:` Como **técnico**, quero restaurar item removido por engano durante a mesma sessão.

> `US-35:` Como **técnico**, quero toda remoção registrada com data, hora e meu nome.

---

### RF-10 — Carregamento de Projetos via Sincronização

**Descrição:** Com conexão, app consulta banco e exibe projetos disponíveis não carregados. Técnico escolhe quais baixar. Após carregamento, projeto disponível offline — pode iniciar ou retomar vistoria.

**Regras de negócio:**

- Requer conexão ativa — não opera offline.
- Todos os projetos da organização visíveis a todos os técnicos.
- Carregamento baixa estrutura completa: nome do imóvel, endereço, andares, itens, categorias e referências normativas.
- Projetos já carregados aparecem com indicador "disponível offline" no painel (RF-02).
- Projeto com versão mais recente no banco: app exibe aviso e oferece opção de atualizar.
- Ao atualizar projeto com vistoria em andamento, dados registrados (status, evidências, extras) sempre preservados — campo é a fonte da verdade.
- Técnico pode não carregar projeto — ele permanece visível como "disponível no banco" sem ocupar espaço.

**User Stories:**

> `US-36:` Como **técnico**, quero ver projetos disponíveis no banco quando conectado, para escolher quais carregar antes de ir ao campo.

> `US-37:` Como **técnico**, quero carregar projeto com uma única ação.

> `US-38:` Como **técnico**, quero ser avisado quando projeto carregado tiver versão mais recente no banco.

> `US-39:` Como **técnico**, quero carregar múltiplos projetos e vê-los no painel.

---

### RF-11 — Instalação como App

**Descrição:** App instalável na tela inicial do tablet sem loja. Abre em tela cheia sem barra do navegador, com ícone e nome próprios. Comportamento indistinguível de app nativo.

**Regras de negócio:**

- Instalação não requer App Store / Play Store.
- Atualizações de versão silenciosas, sem interromper uso.
- Técnico não precisa de TI para instalar.

**User Stories:**

> `US-40:` Como **técnico**, quero instalar app na tela inicial do tablet, para acessar sem abrir o navegador.

> `US-41:` Como **técnico**, quero app em tela cheia sem barra do navegador.

> `US-42:` Como **técnico**, quero app funcionando após reiniciar o tablet, sem nova conexão.

> `US-43:` Como **técnico**, quero atualizações aplicadas automaticamente sem interrupções.

---

### RF-12 — Visibilidade de Estado do App

**Descrição:** Técnico sabe a qualquer momento se está online/offline e se há situações que requerem atenção — armazenamento quase cheio ou sessão expirada. Avisos passivos, sem interromper vistoria.

**Regras de negócio:**

- Indicador de conexão sempre visível em qualquer tela.
- Avisos de espaço e sessão informativos — não bloqueiam vistoria ativa.
- Apenas sincronização bloqueada em caso de sessão expirada.

**User Stories:**

> `US-44:` Como **técnico**, quero indicador permanente de online/offline.

> `US-45:` Como **técnico**, quero aviso quando armazenamento do tablet estiver quase cheio.

> `US-46:` Como **técnico**, quero aviso de sessão expirada sem interromper vistoria em andamento.

---

## Requisitos Não-Funcionais

### Disponibilidade e Persistência

| Requisito              | Detalhe                                                                        |
| ---------------------- | ------------------------------------------------------------------------------ |
| Operação offline total | Todas as ações da vistoria funcionam sem conexão após projeto carregado        |
| Persistência de dados  | Dados e mídias sobrevivem a fechamento do app e reinicialização do dispositivo |
| Capacidade de mídia    | Mínimo 200 fotos e 5 vídeos por projeto sem degradação visível                 |
| Salvamento automático  | Nenhum registro se perde — salvo no instante em que é feito                    |

### Compatibilidade e Dispositivos

| Requisito              | Detalhe                                                 |
| ---------------------- | ------------------------------------------------------- |
| Plataforma alvo        | Tablet Android e iPad, via Chrome ou Safari             |
| Tamanho mínimo de tela | 9 polegadas — layout e botões adequados para campo      |
| Instalação             | App instalável na tela inicial sem loja                 |
| App nativo iOS/Android | **Fora do escopo** — app instalável via navegador (PWA) |

### Usabilidade em Campo

| Requisito                          | Detalhe                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------ |
| Uso com uma mão                    | Ações principais (status, foto) acessíveis com polegar na área inferior  |
| Legibilidade ao sol                | Interface legível sob luz solar direta                                   |
| Alvos de toque                     | Tamanho mínimo adequado para uso com luvas de trabalho                   |
| Feedback de ação                   | Toda ação tem confirmação visual imediata — sem ambiguidade se foi salvo |
| Proteção contra exclusão acidental | Ações destrutivas (remover item, excluir foto) exigem confirmação        |

### Segurança e Controle de Acesso

| Requisito           | Detalhe                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Autenticação        | Acesso por e-mail e senha; sessão mantida no dispositivo para uso offline                       |
| Controle de acesso  | Todos os técnicos autenticados veem todos os projetos da organização                            |
| Dados em repouso    | [A VALIDAR] definir se há requisito de proteção dos dados armazenados localmente no dispositivo |
| Expiração de sessão | Aviso ao técnico sem bloquear vistoria; sincronização bloqueada até renovação                   |

---

## Critérios de Aceite do MVP (Épico 1)

### Fundação — aceite antes de avançar para vistoria

1. **App instalável:** técnico instala na tela inicial do tablet; abre em tela cheia com ícone próprio, sem barra do navegador.
2. **Carregamento funciona:** com conexão, técnico vê projetos disponíveis no banco, seleciona um e carrega; projeto aparece no painel com andares e itens completos.
3. **Projeto indisponível sem conexão:** ao tentar acessar lista do banco sem internet, app exibe mensagem clara.
4. **Aviso de versão desatualizada:** ao abrir projeto com versão mais recente no banco, app avisa e oferece atualizar ou continuar com versão atual.
5. **Indicador de conexão funciona:** ao desativar Wi-Fi, indicador muda para "Offline" em até 3 segundos; ao reconectar, volta para "Online".
6. **Dados sobrevivem ao fechamento:** projeto e dados registrados presentes após fechar e reabrir o app.

### Vistoria Offline — aceite do Épico 1 completo

7. **Vistoria completa sem internet:** técnico percorre todos os itens, registra status, foto e comentário para cada item irregular — sem conexão — e dados permanecem ao reabrir.
8. **Rastreabilidade de status:** cada alteração registrada com data, hora e nome do técnico.
9. **Bloqueio de encerramento:** ao tentar encerrar com itens Pendentes ou Irregulares sem foto, app exibe lista de pendências e bloqueia conclusão. Com tudo resolvido, encerramento liberado.
10. **Item extra documentado:** técnico adiciona item extra com descrição, categoria e status; aparece marcado como "Extra".
11. **Remoção rastreável:** item removido some da lista ativa, aparece no histórico com data e nome, pode ser restaurado na mesma sessão.
12. **Avisos não bloqueiam vistoria:** alertas de espaço quase cheio e sessão expirada exibidos sem interromper fluxo ativo.

---

## Decisões em Aberto

- [ ] **Proteção de dados locais:** definir se há política que exija proteção dos dados armazenados no dispositivo. **Dono:** Soraia / equipe.

---

## Fora do Escopo deste Épico

| Item                                                          | Motivo                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------- |
| App nativo iOS/Android                                        | PWA cobre o caso de uso com menor custo                 |
| Anotações visuais sobre fotos (setas, círculos, balões)       | Fase 2                                                  |
| Sincronização dos resultados da vistoria de volta ao servidor | Responsabilidade do Épico 2                             |
| Interface para criar ou editar projetos                       | Responsabilidade do Épico 3 (plataforma web)            |
| Importação manual de projeto via arquivo                      | Substituído pelo carregamento via sincronização (RF-10) |
| Visualização do PDF do Projeto Técnico em campo               | Responsabilidade do Épico 3                             |
| Geração de relatório PDF                                      | Responsabilidade do Épico 4                             |
| Notificações push                                             | Fora do escopo do MVP completo                          |
| Login com biometria ou redes sociais                          | Fase 2                                                  |
| Edição simultânea do mesmo projeto por múltiplos técnicos     | Épico 2 define as regras de conflito                    |
