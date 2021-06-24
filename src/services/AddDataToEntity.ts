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

  async call (
    entity: Entity,
    dataObject: Record<string, any>,
    schemaBaseDri: string
  ) {
    try {
      const data = parseData(dataObject)
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

const parseData = (dataObject: Record<string, any>) => {
  const data: Datum[] = []
  Object.entries(dataObject)
    .map(([key, value]) => data.push(new Datum(key, value)) )

  return data
}
