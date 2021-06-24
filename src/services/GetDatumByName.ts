import { DatumRepo } from '../repositories/DatumRepo'

export class GetDataByName {
  datumRepo: DatumRepo

  constructor (datumRepo: DatumRepo) {
    this.datumRepo = datumRepo
  }

  async call (name: string) {
    try {
      return await this.datumRepo.byName(name)
    } catch (e) {
      throw [e.statusMessage || e.code || e]
    }
  }
}
