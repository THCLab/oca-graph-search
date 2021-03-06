import { process } from 'gremlin'
const { statics: __ } = process

import { compareTwoStrings } from 'string-similarity'
import { OCA } from '../models/OCA'
import { Attribute } from '../models/Attribute'
import { Datum } from '../models/Datum'
import { Entity } from '../models/Entity'

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
      .by('name').by('dri').by(__.out('owned_by').dedup().count())
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
        .project('isPII', 'name', 'type')
        .by('isPII')
        .by(__.inV().values('name'))
        .by(__.inV().values('type'))
        .fold()
      )
      .next()
    ).value

    if (!ocaV) { return null }

    return new OCA(
      ocaV.get('dri'),
      ocaV.get('name'),
      ocaV.get('attributes').map((attr: any) => {
        return new Attribute(attr.get('name'), attr.get('type'), attr.get('isPII'))
      })
    )
  }

  async save (oca: OCA) {
    try {
      const ocaV = await this.findOrCreateOCAVertex(oca)
      const allAttributes = await this.findAllAtributes()

      oca.attributes.forEach(async attribute => {
        const attributeV = await this.findOrCreateAttributeVertex(attribute)
        await this.createOCAtoAttributeEdge(ocaV, attributeV, attribute.isPII)
        allAttributes.forEach(async attr => {
          await this.createAttributeToAttrbuteEdge(attributeV, attr)
        })
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
      .has('type', attribute.type)

    const attributeV = await t.hasNext() ?
      await t.next() :
      await this.g.addV('attribute')
      .property('name', attribute.name)
      .property('type', attribute.type)
      .next()

    return (await this.g.V(attributeV.value.id)
      .project('id', 'name').by(__.id()).by('name')
      .next()).value
  }

  private async findAllAtributes () {
    return await this.g.V().hasLabel('attribute')
      .project('id', 'name').by(__.id()).by('name')
      .toList()
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
        .where(__.id().is(attributeV.get('id')))
        .toList()
    ).length > 0

    if (!edgeExists) {
      await this.g.V(ocaV.id)
        .addE('contains')
        .property('isPII', isPII)
        .to(__.V(attributeV.get('id')))
        .next()
    }
  }

  private async createAttributeToAttrbuteEdge (attribute1: any, attribute2: any) {
    const edgeExists = (
      await this.g.V(attribute1.get('id'))
        .outE('similar_to')
        .inV()
        .where(__.id().is(attribute2.get('id')))
        .toList()
    ).length > 0
    if (edgeExists) { return }

    const rank = compareTwoStrings(
      attribute1.get('name').toLowerCase(), attribute2.get('name').toLowerCase()
    )
    if (rank === 0) { return }
    await this.g.V(attribute1.get('id'))
      .addE('similar_to')
      .property('rank', rank)
      .to(__.V(attribute2.get('id')))
      .next()
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

  async addOwner(dri: string, entity: Entity) {
    const ocaV = (
      await this.g.V().hasLabel('oca_sb')
      .has('dri', dri)
      .next()
    ).value

    if (!ocaV) {
      throw `OCA with DRI: '${dri}' not found`
    }

    const entityV = (
      await this.g.V().hasLabel('entity')
      .has('id', entity.id)
      .next()
    ).value

    if (!entityV) {
      throw `Entity with ID: '${entity.id}' not found`
    }

    const edgeExists = (
      await this.g.V(ocaV.id)
        .outE('owned_by')
        .inV()
        .where(__.id().is(entityV.id))
        .toList()
    ).length > 0

    if (!edgeExists) {
      await this.g.V(ocaV.id)
        .addE('owned_by')
        .to(__.V(entityV.id))
        .next()
    }
  }
}
