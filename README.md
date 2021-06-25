## Overview



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
