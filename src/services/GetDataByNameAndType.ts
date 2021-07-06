import { DatumRepo } from '../repositories/DatumRepo'

export class GetDataByNameAndType {
  datumRepo: DatumRepo

  constructor (datumRepo: DatumRepo) {
    this.datumRepo = datumRepo
  }

  async call (params: Record<string, string>) {
    try {
      return await this.datumRepo.byNameAndType(params.name, params.type)
    } catch (e) {
      throw [e.statusMessage || e.code || e]
    }
  }
}
