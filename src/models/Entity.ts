import { Meta } from '@/models/Meta'

export class Entity {
  id: number
  meta: Meta[]

  constructor (id: number, meta: Meta[]) {
    this.id = id
    this.meta = meta
  }
}
