import { EntityRepo } from '../repositories/EntityRepo'
import { OCARepo } from '../repositories/OCARepo'
import { Entity } from '../models/Entity'
import { Datum } from '../models/Datum'
import { OCA } from '../models/OCA'

export class AddDataToEntity {
  entityRepo: EntityRepo
  ocaRepo: OCARepo

  constructor (entityRepo: EntityRepo, ocaRepo: OCARepo) {
    this.entityRepo = entityRepo
    this.ocaRepo = ocaRepo
  }

  async call (params: Record<string, any>) {
    try {
      const validation = validate(params)
      if (!validation.success) { throw validation.errors }
      const { entity, data, schemaBaseDri } = validation.output!
      const oca = await this.ocaRepo.byDRI(schemaBaseDri)
      if (!oca) {
        throw `OCA with DRI: '${schemaBaseDri}' not found. Please import that OCA first`
      }
      const dataValidation = validateDataToOCA(oca, data)
      if (!dataValidation.success) { throw dataValidation.errors }
      entity.data = dataValidation.output as Datum[]
      const isEntitySaved = await this.entityRepo.save(entity)
      if (!isEntitySaved) {
        throw 'Error occured while saving entity'
      }

      await this.ocaRepo.addDataToOCA(schemaBaseDri, data)
      await this.ocaRepo.addOwner(schemaBaseDri, entity)
    } catch (e) {
      throw [e.message || e]
    }
  }
}

const validate = (params: Record<string, any>) => {
  const errors = []
  const { i, d, x } = params
  if (!i) { errors.push("Field 'i' is required") }
  if (typeof i !== 'string') { errors.push("Field 'i' must be a string") }
  if (!d) { errors.push("Field 'd' is required") }
  if (typeof d !== 'object') { errors.push("Field 'd' must be an object") }
  if (!x) { errors.push("Field 'x' is required") }
  if (typeof x !== 'string') { errors.push("Field 'x' must be a string") }

  if (errors.length !== 0) {
    return {
      success: false,
      errors
    }
  }

  const id = i.split('/')[0]

  return {
    success: true,
    output: {
      entity: new Entity(id, []),
      data: parseData(d),
      schemaBaseDri: x
    }
  }
}

const parseData = (dataObject: Record<string, any>) => {
  const data: Datum[] = []
  Object.entries(dataObject)
    .map(([key, value]) => data.push(new Datum(key, value)) )

  return data
}

const validateDataToOCA = (oca: OCA, data: Datum[]) => {
  const errors: string[] = []
  if (oca.attributes.length !== data.length) {
    const dataNames = data.map(datum => datum.name)
    const missingAttrs = oca.attributes.filter(attr => !dataNames.includes(attr.name))
    missingAttrs.forEach(attr => errors.push(`Missing data for attribute '${attr.name}' [${attr.type}]`))
  }

  const output = data.map(datum => {
    const attribute = oca.attributes.find(attr => datum.name === attr.name)
    if (!attribute) {
      errors.push(`Cannot find matching OCA attribute for '${datum.name}' data key`)
      return
    }
    try {
      return new Datum(datum.name, castDatumValue(datum.value, attribute.type), attribute.type)
    } catch (e) {
      errors.push(`Error occured while casting '${datum.name}' value (${datum.value}). Expected type: ${attribute.type}`)
    }
  })

  if (errors.length !== 0) {
    return {
      success: false,
      errors
    }
  }

  return {
    success: true,
    output
  }
}

const castDatumValue = (value: any, type: string) => {
  switch (type) {
    case 'Text':
      const s = String(value).trim()
      if (s.length === 0) { return null }
      return s
    case 'Array[Text]':
      return value.map((v: any) => String(v))
    case 'Number':
      if (value === "" || value === "null") { throw ''}
      if (value === null) { return null }
      const n = Number(value)
      if (isNaN(n)) { throw '' }
      return n
    case 'Date':
      return String(value)
    case 'Boolean':
      return !(value === 'false' || value === '0' || !Boolean(value))
  }
}
