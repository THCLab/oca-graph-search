export class Datum {
  name: string
  value: any
  type: string | undefined

  constructor (name: string, value: any, type?: string) {
    this.name = name
    this.value = value
    this.type = type
  }
}
