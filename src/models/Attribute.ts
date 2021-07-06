export class Attribute {
  name: string
  type: string
  isPII: boolean

  constructor (name: string, type: string, isPII: boolean) {
    this.name = name
    this.type = type
    this.isPII = isPII
  }
}
