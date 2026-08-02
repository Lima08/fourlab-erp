import { db } from '../dexie'
import { mockClients, mockProjects, mockLocations, mockItems, mockEvidence } from './fixtures'

export async function seedDevelopmentDatabase() {
  if (!import.meta.env.DEV) {
    return
  }

  try {
    const count = await db.projects.count()
    if (count > 0) {
      console.log('[Seeder] Banco de dados já possui projetos. Ignorando seed inicial.')
      return
    }

    console.log('[Seeder] Iniciando seed de desenvolvimento...')

    await db.transaction(
      'rw',
      [db.clients, db.projects, db.locations, db.items, db.evidence, db.syncQueue],
      async () => {
        await db.clients.clear()
        await db.projects.clear()
        await db.locations.clear()
        await db.items.clear()
        await db.evidence.clear()
        await db.syncQueue.clear()

        await db.clients.bulkAdd(mockClients)
        await db.projects.bulkAdd(mockProjects)
        await db.locations.bulkAdd(mockLocations)
        await db.items.bulkAdd(mockItems)
        await db.evidence.bulkAdd(mockEvidence)
      }
    )

    console.log(
      '[Seeder] Dados de desenvolvimento inseridos com sucesso (simulando download do servidor)!'
    )
  } catch (error) {
    console.error('[Seeder] Erro ao inserir dados de desenvolvimento:', error)
  }
}
