import { OCARepo } from '../repositories/OCARepo'

export class GetOCAList {
  ocaRepo: OCARepo

  constructor (ocaRepo: OCARepo) {
    this.ocaRepo = ocaRepo
  }

  async call () {
    try {
      return await this.ocaRepo.allList()
    } catch (e) {
      throw [e.statusMessage || e.code || e]
    }
  }
}
