import { OCARepo } from '../repositories/OCARepo'

export class GetOCANames {
  ocaRepo: OCARepo

  constructor (ocaRepo: OCARepo) {
    this.ocaRepo = ocaRepo
  }

  async call () {
    try {
      return await this.ocaRepo.allNames()
    } catch (e) {
      throw [e.statusMessage || e.code || e]
    }
  }
}
