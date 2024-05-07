<h1 align="center">Reputation Oracle</h1>
  <p align="center">The Reputation Oracle application directly to a database.</p>

<p align="center">
  <a href="https://github.com/Hu-Fi/hufi/blob/main/LICENSE">
    <img alt="License: GPL" src="https://img.shields.io/badge/license-GPLv3-yellow.svg" target="_blank" />
  </a>
  
</p>

## Set up the reputation oracle
- First, let's install the dependencies, `yarn` is used as a package manager:
```bash
$ yarn
```

- The application needs access to environment variables in order to work correctly, for this, create one of the `.env` files


- Use the `.env.example` file as an example to create a configuration file with certain environment variables:

```bash
$ cp .env.example .env
```

Next, the requirement that the application puts forward is to set up a database.

### Set up the database manually
First of all, postgres needs to be installed, please see here <a href="https://www.postgresql.org/download/">please see here</a>.

Then run the following commands in the postgres console to create the database and issue permissions:
```bash
$ CREATE DATABASE "reputation-oracle";
$ CREATE USER operator WITH ENCRYPTED PASSWORD 'qwerty';
$ GRANT ALL PRIVILEGES ON DATABASE "reputation-oracle" TO "operator";
$ \c "reputation-oracle" postgres
$ GRANT CREATE ON SCHEMA public TO operator;
```


## Usage
### Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod

# debug mode
$ yarn run start:debug
```

### Testing the app

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```