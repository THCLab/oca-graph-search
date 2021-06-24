export class Attribute {
  name: string
  isPII: boolean

  constructor (name: string, isPII: boolean) {
    this.name = name
    this.isPII = isPII
  }
}
