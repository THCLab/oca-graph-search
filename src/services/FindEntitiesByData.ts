import { EntityRepo } from '../repositories/EntityRepo'
import { Datum } from '../models/Datum'

export class FindEntitiesByData {
  entityRepo: EntityRepo

  constructor (entityRepo: EntityRepo) {
    this.entityRepo = entityRepo
  }

  async call (params: { data: any[], schemas: any[] }) {
    const validation = this.validate(params)
    if (!validation.success) { throw validation.errors }

    try {
      return await this.entityRepo.byParams(
        validation.output!.data,
        validation.output!.schemas
      )
    } catch (e) {
      throw [e.statusMessage || e.code || e]
    }
  }

  validate (params: { data: any[], schemas: any[] }) {
    const errors: string[] = []
    if (!params.data && !params.schemas) {
      errors.push('Missing data or/and schemas params')
    }
    if (!Array.isArray(params.data)) {
      errors.push('Data params must be an array')
    } else {
      params.data = params.data.map(p => (typeof p === 'string') ? JSON.parse(p) : p)
      params.data.forEach((p, i) => {
        if (!p.name)
          errors.push(`params.data[${i}]: Missing name`)
        if (!p.value)
          errors.push(`params.data[${i}]: Missing value`)
      })
    }
    if (!Array.isArray(params.schemas)) {
      errors.push('Schemas params must be an array')
    } else {
      params.schemas = params.schemas.map(p => (typeof p === 'string') ? JSON.parse(p) : p)
      params.schemas.forEach((p, i) => {
        if (!p.name)
          errors.push(`params.schemas[${i}]: Missing name`)
        if (!p.rank)
          return
        if (isNaN(p.rank))
          errors.push(`params.rank[${i}]: Rank must a number`)
        if (p.rank < 0 || p.rank > 1)
          errors.push(`params.rank[${i}]: Rank must be between 0 and 1`)
      })
    }

    if (errors.length > 0) {
      return { success: false, errors }
    }

    return {
      success: true,
      output: {
        data: params.data.map((p: { name: string, value: any, op: string }) => ({
          datum: new Datum(p.name, p.value),
          op: p.op
        })),
        schemas: params.schemas.map((p: { name: string }) => ({
          name: p.name
        }))
      }
    }
  }
}
