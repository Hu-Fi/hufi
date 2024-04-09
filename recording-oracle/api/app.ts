import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';

import init from '../src/app-init';
import { AppModule } from '../src/modules/app/app.module';

const expressApp = express();
const adapter = new ExpressAdapter(expressApp);
let nestAppInitialized = false;

async function bootstrapNestApp() {
  if (!nestAppInitialized) {
    const app = await NestFactory.create(AppModule, adapter);
    await init(app); // Initialize additional settings
    await app.init();
    nestAppInitialized = true;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  await bootstrapNestApp(); // Ensure NestJS app is bootstrapped

  return expressApp(req, res);
}
