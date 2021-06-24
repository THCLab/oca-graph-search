import { Attribute } from './Attribute'

export class OCA {
  dri: string
  name: string
  attributes: Attribute[]

  constructor (dri: string, name: string, attributes: Attribute[]) {
    this.dri = dri
    this.name = name
    this.attributes = attributes
  }
}
