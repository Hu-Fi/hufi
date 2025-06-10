import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../../src/app.module';

const E2E_GIT_HASH = `e2e_${faker.git.commitSha()}`;
process.env.GIT_HASH = E2E_GIT_HASH;

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET: /health/ping', async () => {
    await request(app.getHttpServer()).get('/health/ping').expect(200).expect({
      node_env: 'test',
      git_hash: E2E_GIT_HASH,
    });
  });
});
