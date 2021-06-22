import { process } from 'gremlin'
const { statics: __, P } = process

import { Entity } from '../models/Entity'
import { Meta } from '../models/Meta'

export class EntityRepo {
  g: process.GraphTraversalSource<process.GraphTraversal>

  constructor (g: process.GraphTraversalSource<process.GraphTraversal>) {
    this.g = g
  }

  async byParams(
    metaParams: { meta: Meta, op?: string }[],
    attrParams: { name: string }[]
  ) {
    let traversal = this.g

    if (metaParams.length === 0 && attrParams.length === 0) {
      // @ts-ignore
      traversal = this.g.V().hasLabel('entity')
    }

    if (metaParams.length > 0) {
      // @ts-ignore
      traversal = traversal.V().hasLabel('entity')
      .and(
        ...metaParams.map(param =>
          __.in_('describes')
            .has('name', param.meta.name)
            .has('value', parseValue(param.meta.value, param.op))
        )
      ).as('e1')
    }
    if (attrParams.length > 0) {
      // @ts-ignore
      traversal = traversal.V().hasLabel('attribute')
      .and(
        ...attrParams.map(param =>
          __.has('name', param.name)
            .optional(__.both('similar_to'))
        )
      )
      .in_('contains')
      .in_('tags').out('describes')
      .as('e2')
    }
    if (metaParams.length > 0 && attrParams.length > 0) {
      // @ts-ignore
      traversal = traversal.select('e1').where('e1', P.eq('e2'))
    }
    // @ts-ignore
    traversal = traversal.project('id', 'meta')
      .by('id').by(__.in_('describes').valueMap().fold())

    // @ts-ignore
    const results: any[] = await traversal.dedup().toList()

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
