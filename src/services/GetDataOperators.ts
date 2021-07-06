import { DatumRepo } from '../repositories/DatumRepo'

export class GetDataOperators {
  datumRepo: DatumRepo

  constructor (datumRepo: DatumRepo) {
    this.datumRepo = datumRepo
  }

  async call (name: string) {
    const results: any[] = []
    const types = await this.datumRepo.typesByName(name)
    types.forEach(type => results.push({
      type,
      operators: operators[type] || []
    }))
    return results
  }
}

const operators: Record<string, string[]> = {
  Number: [
    '=', '>', '>=', '<', '<='
  ],
  Text: [
    'is',
    'is not'
  ]
}
