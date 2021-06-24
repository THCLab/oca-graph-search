import { EntityRepo } from '../repositories/EntityRepo'

export class FindEntityById {
  entityRepo: EntityRepo

  constructor (entityRepo: EntityRepo) {
    this.entityRepo = entityRepo
  }

  async call (id: number) {
    try {
      return await this.entityRepo.byId(id)
    } catch (e) {
      throw [e.statusMessage || e.code || e]
    }
  }
}
