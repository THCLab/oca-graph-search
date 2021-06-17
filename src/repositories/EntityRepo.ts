import { process } from 'gremlin'
const { statics: __, P } = process

import { Entity } from '../models/Entity'
import { Meta } from '../models/Meta'

export class EntityRepo {
  g: process.GraphTraversalSource<process.GraphTraversal>

  constructor (g: process.GraphTraversalSource<process.GraphTraversal>) {
    this.g = g
  }

  async byParams(params: { meta: Meta, op?: string }[]) {
    if (params.length === 0) { return [] }

    const results = await this.g
      .V().hasLabel('entity')
      .and(
        ...params.map(param =>
          __.in_('describes')
            .has('name', param.meta.name)
            .has('value', parseValue(param.meta.value, param.op))
        )
      ).project('id', 'meta')
      .by('id').by(__.in_('describes').valueMap().fold())
      .dedup().toList()

    return results.map(el => new Entity(
      // @ts-ignore
      el.get('id'),
      // @ts-ignore
      el.get('meta').map(m => new Meta(m.get('name')[0], m.get('value')[0]))
    ))
  }

}

const parseValue = (value: any, op: string = '=') => {
  switch (op) {
    case '=':
      return P.eq(value)
    case '>':
      return P.gt(value)
    case '>=':
      return P.gte(value)
    case '<':
      return P.lt(value)
    case '<=':
      return P.lte(value)
    case 'is':
      return P.eq(value)
    default:
      throw `Invalid operator: "${op}"`
  }
}
