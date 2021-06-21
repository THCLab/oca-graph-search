import { process } from 'gremlin'
const { statics: __, P } = process

import { Meta } from '../models/Meta'

export class MetaRepo {
  g: process.GraphTraversalSource<process.GraphTraversal>

  constructor (g: process.GraphTraversalSource<process.GraphTraversal>) {
    this.g = g
  }

  async allNames() {
    const results = await this.g
      .V().hasLabel('meta')
      .project('name').by('name')
      .dedup().toList()

    // @ts-ignore
    return results.map(el => el.get('name'))
  }

  async byName(name: string) {
    const results = await this.g
      .V().hasLabel('meta').has('name', name)
      .dedup().valueMap().toList()

    return results.map(el => new Meta(
      // @ts-ignore
      el.get('name')[0], el.get('value')[0]
    ))
  }
}
