import express, { Application, Router, Request, Response } from 'express'
import cors from 'cors'
import { setup, serve } from "swagger-ui-express";
import { resolve } from "path";
import {readFileSync} from "fs";
import { parse } from 'yaml'
const app = express()
// @ts-ignore
app.use(express.json())
app.use(cors())

const routerV1 = Router()
const router2 = Router()
const swaggerDocument = parse(
  readFileSync(resolve(process.cwd(), "openapi.yaml")).toString("utf8")
);


router2.use('/api-docs', serve);
router2.get('/api-docs', setup(swaggerDocument));

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
import { FindEntityById } from './services/FindEntityById'
const findEntityById = new FindEntityById(entityRepo)
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
import { GetOCANames } from './services/GetOCANames'
const getOCANames = new GetOCANames(ocaRepo)
import { GetOCAList } from './services/GetOCAList'
const getOCAList = new GetOCAList(ocaRepo)

import { AddDataToEntity } from './services/AddDataToEntity'
const addDataToEntity = new AddDataToEntity(entityRepo, ocaRepo)

routerV1.get('/q', async (req: Request, res: Response) => {
  try {
    const params = { data: [], schemas: []}
    params.data = req.query.data || req.body.data || []
    params.schemas = req.query.schemas || req.body.schemas || []
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

routerV1.get('/oca/names', async (_req: Request, res: Response) => {
  try {
    const names = await getOCANames.call()
    res.json({
      results: names
    })
  } catch (e) {
    res.json({
      errors: e
    })
  }
})

routerV1.get('/oca/list', async (_req: Request, res: Response) => {
  try {
    const ocaList = await getOCAList.call()
    res.json({
      results: ocaList
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

routerV1.post('/entities', async (req: Request, res: Response) => {
  try {
    await addDataToEntity.call(req.body)
    res.json({
      success: true
    })
  } catch (e) {
    res.status(422).json({
      errors: e
    })
  }
})

routerV1.get('/entities/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const entity = await findEntityById.call(id)
    res.json({
      result: entity
    })
  } catch (e) {
    res.json({
      errors: e
    })
  }
})

app.use('/api/v1', routerV1)
app.use('/', router2)

app.listen(port, function () {
  console.log(`App is listening on port ${port}`)
})
