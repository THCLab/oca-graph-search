import { Datum } from './Datum'

export class Entity {
  id: number
  data: Datum[]

  constructor (id: number, data: Datum[]) {
    this.id = id
    this.data = data
  }
}
