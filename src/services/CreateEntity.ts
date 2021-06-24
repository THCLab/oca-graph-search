import { EntityRepo } from '../repositories/EntityRepo'
import { Entity } from '../models/Entity'

export class CreateEntity {
  entityRepo: EntityRepo

  constructor (entityRepo: EntityRepo) {
    this.entityRepo = entityRepo
  }

  async call () {
    try {
      const entity = new Entity(generateId(), [])
      const isSaved = await this.entityRepo.save(entity)
      if (isSaved) {
        return entity
      } else {
        throw 'Error occured while creating entity'
      }
    } catch (e) {
      throw [e.message || e]
    }
  }
}

const generateId = () => {
  return Math.floor(Math.random() * 999999999)
}
