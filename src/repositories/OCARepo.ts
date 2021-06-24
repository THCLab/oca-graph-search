import { process } from 'gremlin'
const { statics: __ } = process

import { OCA } from '../models/OCA'
import { Attribute } from '../models/Attribute'
import { Datum } from '../models/Datum'

export class OCARepo {
  g: process.GraphTraversalSource<process.GraphTraversal>

  constructor (g: process.GraphTraversalSource<process.GraphTraversal>) {
    this.g = g
  }

  async save (oca: OCA) {
    try {
      const ocaV = await this.findOrCreateOCAVertex(oca)

      oca.attributes.forEach(async attribute => {
        const attributeV = await this.findOrCreateAttributeVertex(attribute)
        await this.createOCAtoAttributeEdge(ocaV, attributeV, attribute.isPII)
      })

      return true
    } catch (_e) {
      return false
    }
  }

  private async findOrCreateOCAVertex (oca: OCA) {
    const t = this.g.V().hasLabel('oca_sb')
      .has('dri', oca.dri)
      .has('name', oca.name)

    const ocaV = await t.hasNext() ?
      await t.next() :
      await this.g.addV('oca_sb')
      .property('dri', oca.dri)
      .property('name', oca.name)
      .next()

    return ocaV
  }

  private async findOrCreateAttributeVertex (attribute: Attribute) {
    const t = this.g.V().hasLabel('attribute')
      .has('name', attribute.name)

    const attributeV = await t.hasNext() ?
      await t.next() :
      await this.g.addV('attribute')
      .property('name', attribute.name)
      .next()

    return attributeV
  }

  private async createOCAtoAttributeEdge (
    ocaV: IteratorResult<any, any>,
    attributeV: IteratorResult<any, any>,
    isPII: boolean
  ) {
    const edgeExists = (
      await this.g.V(ocaV.value.id)
        .outE('contains').has('isPII', isPII)
        .inV()
        .where(__.id().is(attributeV.value.id))
        .toList()
    ).length > 0

    if (!edgeExists) {
      await this.g.V(ocaV.value.id)
        .addE('contains')
        .property('isPII', isPII)
        .to(__.V(attributeV.value.id))
        .next()
    }
  }

  async addDataToOCA(dri: string, data: Datum[]) {
    const ocaV = await this.g.V().hasLabel('oca_sb')
      .has('dri', dri)
      .next()

    if (!ocaV) {
      throw `OCA with DRI: '${dri}' not found`
    }

    data.forEach(async datum => {
      const datumV = await this.g.V().hasLabel('datum')
        .has('name', datum.name)
        .has('value', datum.value)
        .next()

      if (datumV) {
        await this.g.V(datumV.value.id)
          .addE('tags')
          .to(__.V(ocaV.value.id))
          .next()
      }
    })
  }
}
