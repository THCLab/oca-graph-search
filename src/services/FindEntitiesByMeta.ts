import { EntityRepo } from '../repositories/EntityRepo'
import { Meta } from '../models/Meta'

export class FindEntitiesByMeta {
  entityRepo: EntityRepo

  constructor (entityRepo: EntityRepo) {
    this.entityRepo = entityRepo
  }

  async call (params: { meta: any[], attributes: any[] }) {
    const validation = this.validate(params)
    if (!validation.success) { throw validation.errors }

    try {
      return await this.entityRepo.byParams(
        validation.output!.meta,
        validation.output!.attributes
      )
    } catch (e) {
      throw [e.statusMessage || e.code || e]
    }
  }

  validate (params: { meta: any[], attributes: any[] }) {
    const errors: string[] = []
    if (!params.meta && !params.attributes) {
      errors.push('Missing meta or/and attributes params')
    }
    if (!Array.isArray(params.meta)) {
      errors.push('Meta params must be an array')
    } else {
      params.meta = params.meta.map(p => (typeof p === 'string') ? JSON.parse(p) : p)
      params.meta.forEach((p, i) => {
        if (!p.name)
          errors.push(`params.meta[${i}]: Missing name`)
        if (!p.value)
          errors.push(`params.meta[${i}]: Missing value`)
      })
    }
    if (!Array.isArray(params.attributes)) {
      errors.push('Attributes params must be an array')
    } else {
      params.attributes = params.attributes.map(p => (typeof p === 'string') ? JSON.parse(p) : p)
      params.attributes.forEach((p, i) => {
        if (!p.name)
          errors.push(`params.attributes[${i}]: Missing name`)
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
        meta: params.meta.map((p: { name: string, value: any, op: string }) => ({
          meta: new Meta(p.name, p.value),
          op: p.op
        })),
        attributes: params.attributes.map((p: { name: string }) => ({
          name: p.name
        }))
      }
    }
  }
}
