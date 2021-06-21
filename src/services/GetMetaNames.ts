import { MetaRepo } from '../repositories/MetaRepo'

export class GetMetaNames {
  metaRepo: MetaRepo

  constructor (metaRepo: MetaRepo) {
    this.metaRepo = metaRepo
  }

  async call () {
    try {
      return await this.metaRepo.allNames()
    } catch (e) {
      throw [e.statusMessage || e.code || e]
    }
  }
}
