## Overview

Backend component that serves the core features for storing the data for OCA schema bases. As it is backed by graph database (currently Apache Tinkerpop with Gremlin), the OCA schema bases data are not stored as a flat structure, or more precisely as a column-oriented structures (ie. Apache Cassandra). Graph database allows to inject enrichments under the form of relationships between the schema and the data, which then leads to more precise query results.

Until OpenApi spec is missing, please examine [the router](https://github.com/THCLab/oca-graph-search/blob/master/src/app.ts) for the available endpoints.

## Development

* Run `docker-compose -f docker-compose.dev.yml up` to get Apache Tinkerpop running.
* If you want to access database interactively, use `console` container so the `Gremlin console`. In order to do so run `docker-compose run console -i /opt/gremlin-console/data/init.groovy`.
* To run server locally: `yarn install && yarn dev`.

### Building Docker image

```
export VERSION=0.0.1
docker build . -t humancolossus/oca-criteria-search-backend:${VERSION}
docker push humancolossus/oca-criteria-search-backend:${VERSION}
```
