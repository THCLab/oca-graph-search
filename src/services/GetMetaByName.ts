import { MetaRepo } from '../repositories/MetaRepo'

export class GetMetaByName {
  metaRepo: MetaRepo

  constructor (metaRepo: MetaRepo) {
    this.metaRepo = metaRepo
  }

  async call (name: string) {
    try {
      return await this.metaRepo.byName(name)
    } catch (e) {
      throw [e.statusMessage || e.code || e]
    }
  }
}
