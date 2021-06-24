import { DatumRepo } from '../repositories/DatumRepo'

export class GetDataNames {
  datumRepo: DatumRepo

  constructor (datumRepo: DatumRepo) {
    this.datumRepo = datumRepo
  }

  async call () {
    try {
      return await this.datumRepo.allNames()
    } catch (e) {
      throw [e.statusMessage || e.code || e]
    }
  }
}
