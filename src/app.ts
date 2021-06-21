import express, { Application, Request, Response } from 'express'
import cors from 'cors'

const app: Application = express()
// @ts-ignore
app.use(express.json())
app.use(cors())

const port: number = 3000

import gremlin from 'gremlin'
const { statics: __, P } = gremlin.process
const traversal = gremlin.process.AnonymousTraversalSource.traversal;
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
const g = traversal().withRemote(new DriverRemoteConnection('ws://localhost:8182/gremlin'));

import { EntityRepo } from './repositories/EntityRepo'
import { FindEntitiesByMeta } from './services/FindEntitiesByMeta'
const entityRepo = new EntityRepo(g)
const findEntitiesByMeta = new FindEntitiesByMeta(entityRepo)

app.get('/', (req: Request, res: Response) => {
  res.send('Hello world!')
})

app.get('/q', async (req: Request, res: Response) => {
  try {
    const params = req.query.params || req.body.params
    const entities = await findEntitiesByMeta.call(params)
    res.json({
      results: entities
    })
  } catch (e) {
    res.json({
      errors: e
    })
  }
})

app.listen(port, function () {
  console.log(`App is listening on port ${port}`)
})
