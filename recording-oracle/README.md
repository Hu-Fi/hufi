# Recording Oracle For Hufi

## Overview
Recording Oracle is a tool designed to calculate liquidity score for all the users who sign up for specifc campaigns. This project is part of the Hufi system to reward liquidity providers



## Installation
```bash
$ git clone https://github.com/Hu-Fi/hufi.git
$ cd hufi/recording-oracle
$ yarn
```

## API

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

## Test

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```
## API

- <b>POST</b> `/records/calculate-liquidity-score`

  Request Payload:

  ```json
  {
  "exchangeId": string,
  "apiKey": string,
  "secret": string,
  "symbol": string,
  "since": number
  }
  ```

