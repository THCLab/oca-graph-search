import { EntityRepo } from '../repositories/EntityRepo'
import { OCARepo } from '../repositories/OCARepo'
import { Entity } from '../models/Entity'
import { Datum } from '../models/Datum'

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
      entity.data = data
      const isEntitySaved = await this.entityRepo.save(entity)
      if (!isEntitySaved) {
        throw 'Error occured while saving entity'
      }

      await this.ocaRepo.addDataToOCA(schemaBaseDri, data)
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
