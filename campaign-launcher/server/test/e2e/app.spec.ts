import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { AppModule } from '@/app.module';

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

  test('GET: /health/ping', async () => {
    const response = await request(app.getHttpServer()).get('/health/ping');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      node_env: 'test',
      git_hash: E2E_GIT_HASH,
    });
  });
});
