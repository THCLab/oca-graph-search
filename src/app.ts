import express, { Application, Router, Request, Response } from 'express'
import cors from 'cors'

const app: Application = express()
// @ts-ignore
app.use(express.json())
app.use(cors())

const routerV1 = Router()

const port: number = 3000

import gremlin from 'gremlin'
const { statics: __ } = gremlin.process
const traversal = gremlin.process.AnonymousTraversalSource.traversal;
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
const g = traversal().withRemote(new DriverRemoteConnection('ws://localhost:8182/gremlin'));

import { EntityRepo } from './repositories/EntityRepo'
import { FindEntitiesByMeta } from './services/FindEntitiesByMeta'
const entityRepo = new EntityRepo(g)
const findEntitiesByMeta = new FindEntitiesByMeta(entityRepo)
import { MetaRepo } from './repositories/MetaRepo'
import { GetMetaNames } from './services/GetMetaNames'
const metaRepo = new MetaRepo(g)
const getMetaNames = new GetMetaNames(metaRepo)
import { GetMetaByName } from './services/GetMetaByName'
const getMetaByName = new GetMetaByName(metaRepo)
import { GetOperators } from './services/GetOperators'
const getOperators = new GetOperators()

routerV1.get('/q', async (req: Request, res: Response) => {
  try {
    const params = req.query.params || req.body.params
    const entities = await findEntitiesByMeta.call(params)
    res.json({
      results: entities
    })
  } catch (e) {
    console.error(e)
    res.json({
      errors: e
    })
  }
})

routerV1.get('/meta', async (_req: Request, res: Response) => {
  try {
    const names = await getMetaNames.call()
    res.json({
      results: names
    })
  } catch (e) {
    res.json({
      errors: e
    })
  }
})

routerV1.get('/meta/:name', async (req: Request, res: Response) => {
  try {
    const meta = await getMetaByName.call(req.params['name'])
    const operators = getOperators.call(typeof meta[0]?.value)
    res.json({
      values: meta.map(m => m.value),
      operators
    })
  } catch (e) {
    res.json({
      errors: e
    })
  }
})

app.use('/api/v1', routerV1)

app.listen(port, function () {
  console.log(`App is listening on port ${port}`)
})
