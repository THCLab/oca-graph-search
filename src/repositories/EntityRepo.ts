import { process } from 'gremlin'
const { statics: __, P } = process

import { Entity } from '../models/Entity'
import { Datum } from '../models/Datum'

export class EntityRepo {
  g: process.GraphTraversalSource<process.GraphTraversal>

  constructor (g: process.GraphTraversalSource<process.GraphTraversal>) {
    this.g = g
  }

  async byId (id: number) {
    const entity = (
      await this.g.V().hasLabel('entity')
      .has('id', id)
      .project('id', 'data')
      .by('id').by(__.in_('describes').valueMap().fold())
      .dedup().toList()
    )[0]

    if (!entity) {
      throw `Entity with id: '${id}' not found`
    }

    return new Entity(
      // @ts-ignore
      entity.get('id'),
      // @ts-ignore
      entity.get('data').map(m => new Datum(m.get('name')[0], m.get('value')[0]))
    )
  }

  async byParams(
    dataParams: { datum: Datum, op?: string }[],
    attrParams: { name: string }[]
  ) {
    let traversal = this.g

    if (dataParams.length === 0 && attrParams.length === 0) {
      // @ts-ignore
      traversal = this.g.V().hasLabel('entity')
    }

    if (dataParams.length > 0) {
      // @ts-ignore
      traversal = traversal.V().hasLabel('entity')
      .and(
        ...dataParams.map(param =>
          __.in_('describes')
            .has('name', param.datum.name)
            .has('value', parseValue(param.datum.value, param.op))
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
    if (dataParams.length > 0 && attrParams.length > 0) {
      // @ts-ignore
      traversal = traversal.select('e1').where('e1', P.eq('e2'))
    }
    // @ts-ignore
    traversal = traversal.project('id', 'data')
      .by('id').by(__.in_('describes').valueMap().fold())

    // @ts-ignore
    const results: any[] = await traversal.dedup().toList()

    return results.map(el => new Entity(
      // @ts-ignore
      el.get('id'),
      // @ts-ignore
      el.get('data').map(m => new Datum(m.get('name')[0], m.get('value')[0]))
    ))
  }

  async save (entity: Entity) {
    try {
      const entityV = await this.findOrCreateEntityVertex(entity)

      entity.data.forEach(async datum => {
        const datumV = await this.findOrCreateDatumVertex(datum)
        await this.createEntityToDatumEdge(entityV, datumV)
      })
      return true
    } catch (_e) {
      return false
    }
  }

  private async findOrCreateEntityVertex (entity: Entity) {
    const t = this.g.V().hasLabel('entity')
      .has('id', entity.id)

    const entityV = await t.hasNext() ?
      await t.next() :
      await this.g.addV('entity')
      .property('id', entity.id)
      .next()

    return entityV
  }

  private async findOrCreateDatumVertex (datum: Datum) {
    const t = this.g.V().hasLabel('datum')
      .has('name', datum.name)
      .has('value', datum.value)

    const datumV = await t.hasNext() ?
      await t.next() :
      await this.g.addV('datum')
      .property('name', datum.name)
      .property('value', datum.value)
      .next()

    return datumV
  }

  private async createEntityToDatumEdge (
    entityV: IteratorResult<any, any>,
    datumV: IteratorResult<any, any>
  ) {
    const edgeExists = (
      await this.g.V(datumV.value.id)
        .outE('describes')
        .inV()
        .where(__.id().is(entityV.value.id))
        .toList()
    ).length > 0

    if (!edgeExists) {
      await this.g.V(datumV.value.id)
        .addE('describes')
        .to(__.V(entityV.value.id))
        .next()
    }
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
