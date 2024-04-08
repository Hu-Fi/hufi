# HuFi Campaign Launcher Server

## Description

This is the API server for the campaign launcher.

Main endpoints include:

Endpoint | Feature
---|---
`/manifest` | Upload the manifest to cloud storage and return the URL and hash


## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Deployment
The server is automatically deployed on Vercel.
