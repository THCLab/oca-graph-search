import { EntityRepo } from '../repositories/EntityRepo'
import { Meta } from '../models/Meta'

export class FindEntitiesByMeta {
  entityRepo: EntityRepo

  constructor (entityRepo: EntityRepo) {
    this.entityRepo = entityRepo
  }

  async call (params: any[]) {
    const validation = this.validate(params)
    if (!validation.success) { throw validation.errors }

    try {
      return await this.entityRepo.byParams(validation.output!)
    } catch (e) {
      throw [e.statusMessage || e.code || e]
    }
  }

  validate (params: any[]) {
    const errors: string[] = []
    if (!params) {
      errors.push('Missing params')
    }
    if (!Array.isArray(params)) {
      errors.push('Params must be an array')
    } else {
      params = params.map(p => (typeof p === 'string') ? JSON.parse(p) : p)
      params.forEach((p, i) => {
        if (!p.name)
          errors.push(`params[${i}]: Missing name`)
        if (!p.value)
          errors.push(`params[${i}]: Missing value`)
      })
    }

    if (errors.length > 0) {
      return { success: false, errors }
    }

    return {
      success: true,
      output: params.map((p: { name: string, value: any, op: string }) => ({
        meta: new Meta(p.name, p.value),
        op: p.op
      }))
    }
  }
}
