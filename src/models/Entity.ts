import { Datum } from './Datum'

export class Entity {
  id: string
  data: Datum[]

  constructor (id: string, data: Datum[]) {
    this.id = id
    this.data = data
  }
}
