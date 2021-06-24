import { process } from 'gremlin'
const { statics: __, P } = process

import { Datum } from '../models/Datum'

export class DatumRepo {
  g: process.GraphTraversalSource<process.GraphTraversal>

  constructor (g: process.GraphTraversalSource<process.GraphTraversal>) {
    this.g = g
  }

  async allNames() {
    const results = await this.g
      .V().hasLabel('datum')
      .project('name').by('name')
      .dedup().toList()

    // @ts-ignore
    return results.map(el => el.get('name'))
  }

  async byName(name: string) {
    const results = await this.g
      .V().hasLabel('datum').has('name', name)
      .dedup().valueMap().toList()

    return results.map(el => new Datum(
      // @ts-ignore
      el.get('name')[0], el.get('value')[0]
    ))
  }
}
