import express, { Application, Router, Request, Response } from 'express'
import cors from 'cors'

const app: Application = express()
// @ts-ignore
app.use(express.json())
app.use(cors())

const routerV1 = Router()

const port: number = Number(process.env.PORT) || 3000

import gremlin from 'gremlin'
const { statics: __ } = gremlin.process
const traversal = gremlin.process.AnonymousTraversalSource.traversal;
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
const g = traversal().withRemote(new DriverRemoteConnection(process.env.GREMLIN_URI || 'ws://localhost:8182/gremlin'));

import { EntityRepo } from './repositories/EntityRepo'
import { FindEntitiesByData } from './services/FindEntitiesByData'
const entityRepo = new EntityRepo(g)
const findEntitiesByData = new FindEntitiesByData(entityRepo)
import { DatumRepo } from './repositories/DatumRepo'
import { GetDataNames } from './services/GetDataNames'
const datumRepo = new DatumRepo(g)
const getDataNames = new GetDataNames(datumRepo)
import { GetDataByName } from './services/GetDataByName'
const getDataByName = new GetDataByName(datumRepo)
import { GetOperators } from './services/GetOperators'
const getOperators = new GetOperators()

import axios from 'axios'
const ocaRegistryClient = axios.create({
  baseURL: process.env.OCA_REGISTRY_API ||
    'https://repository.oca.argo.colossi.network/api/v3',
  validateStatus: (_) => true
})
import { OCARepo } from './repositories/OCARepo'
const ocaRepo = new OCARepo(g)
import { AddOCAByDri } from './services/AddOCAByDri'
const addOCAByDri = new AddOCAByDri(ocaRepo, ocaRegistryClient)

routerV1.get('/q', async (req: Request, res: Response) => {
  try {
    const params = { data: [], attributes: []}
    params.data = req.query.data || req.body.data || []
    params.attributes = req.query.attributes || req.body.attributes || []
    const entities = await findEntitiesByData.call(params)
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

routerV1.get('/data/names', async (_req: Request, res: Response) => {
  try {
    const names = await getDataNames.call()
    res.json({
      results: names
    })
  } catch (e) {
    res.json({
      errors: e
    })
  }
})

routerV1.get('/datum/:name', async (req: Request, res: Response) => {
  try {
    const data = await getDataByName.call(req.params['name'])
    const operators = getOperators.call(typeof data[0]?.value)
    res.json({
      values: data.map(d => d.value),
      operators
    })
  } catch (e) {
    res.json({
      errors: e
    })
  }
})

routerV1.post('/oca', async (req: Request, res: Response) => {
  try {
    if (!req.body['dri']) { throw ['dri param is required'] }
    await addOCAByDri.call(req.body['dri'])
    res.json({
      success: true
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
