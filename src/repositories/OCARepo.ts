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

  async allNames() {
    const results = await this.g
      .V().hasLabel('oca_sb')
      .project('name').by('name')
      .dedup().toList()

    // @ts-ignore
    return results.map(el => el.get('name'))
  }

  async allList() {
    const results = await this.g
      .V().hasLabel('oca_sb')
      .project('name', 'dri', 'entitiesCount')
      .by('name').by('dri').by(__.in_('tags').out('describes').dedup().count())
      .dedup().toList()

    return results.map(el => {
      return {
        // @ts-ignore
        name: el.get('name'),
        // @ts-ignore
        dri: el.get('dri'),
        // @ts-ignore
        entitiesCount: el.get('entitiesCount')
      }
    })
  }

  async byDRI(dri: string) {
    const ocaV = (
      await this.g.V().hasLabel('oca_sb')
      .has('dri', dri)
      .project('name', 'dri', 'attributes')
      .by('name').by('dri').by(
        __.outE('contains')
        .project('isPII', 'name')
        .by('isPII').by(__.inV().values('name'))
        .fold()
      )
      .next()
    ).value

    if (!ocaV) { return null }

    return new OCA(
      ocaV.get('dri'),
      ocaV.get('name'),
      ocaV.get('attributes').map((attr: any) => new Attribute(attr.get('name'), attr.get('isPII')))
    )
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

    return ocaV.value
  }

  private async findOrCreateAttributeVertex (attribute: Attribute) {
    const t = this.g.V().hasLabel('attribute')
      .has('name', attribute.name)

    const attributeV = await t.hasNext() ?
      await t.next() :
      await this.g.addV('attribute')
      .property('name', attribute.name)
      .next()

    return attributeV.value
  }

  private async createOCAtoAttributeEdge (
    ocaV: any,
    attributeV: any,
    isPII: boolean
  ) {
    const edgeExists = (
      await this.g.V(ocaV.id)
        .outE('contains').has('isPII', isPII)
        .inV()
        .where(__.id().is(attributeV.id))
        .toList()
    ).length > 0

    if (!edgeExists) {
      await this.g.V(ocaV.id)
        .addE('contains')
        .property('isPII', isPII)
        .to(__.V(attributeV.id))
        .next()
    }
  }

  async addDataToOCA(dri: string, data: Datum[]) {
    const ocaV = (
      await this.g.V().hasLabel('oca_sb')
      .has('dri', dri)
      .next()
    ).value

    if (!ocaV) {
      throw `OCA with DRI: '${dri}' not found`
    }

    data.forEach(async datum => {
      const datumV = (
        await this.g.V().hasLabel('datum')
        .has('name', datum.name)
        .has('value', datum.value)
        .next()
      ).value

      if (datumV) {
        await this.g.V(datumV.id)
          .addE('tags')
          .to(__.V(ocaV.id))
          .next()
      }
    })
  }
}
