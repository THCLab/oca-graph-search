import { OCARepo } from '../repositories/OCARepo'
import { OCA } from '../models/OCA'
import { Attribute } from '../models/Attribute'
import { AxiosInstance, AxiosResponse } from 'axios'

export class AddOCAByDri {
  ocaRepo: OCARepo
  ocaRegistryClient: AxiosInstance

  constructor (ocaRepo: OCARepo, ocaRegistryClient: AxiosInstance) {
    this.ocaRepo = ocaRepo
    this.ocaRegistryClient = ocaRegistryClient
  }

  async call (dri: string) {
    try {
      const schemaResponse = await this.ocaRegistryClient.get(`/schemas/${dri}`)
      validateSchemaResponse(schemaResponse)
      const schema = schemaResponse.data
      const oca = parseOCASchema(dri, schema)
      return await this.ocaRepo.save(oca)
    } catch (e) {
      throw [e.message || e]
    }
  }
}

const validateSchemaResponse = (response: AxiosResponse<any>) => {
  if (response.status !== 200) {
    throw 'Error while retrieving OCA Schema Base'
  }
  if (!response.data.name) {
    throw 'Retrievied schema is not a Schema Base'
  }
}

const parseOCASchema = (dri: string, schema: Record<any, any>) => {
  const attributes: Attribute[] = []
  Object.keys(schema.attributes).forEach((attrName: string) => {
    attributes.push(
      new Attribute(attrName, schema.pii_attributes.includes(attrName))
    )
  })
  return new OCA(dri, schema.name, attributes)
}
