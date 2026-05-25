import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

import '@/setup-libs';

import Environment from '@/common/utils/environment';
import { CustomNamingStrategy } from '@/infrastructure/database/naming-strategy';

dotenv.config({
  /**
   * First value wins if "override" option is not set
   */
  path: [`.env.${Environment.name}`, '.env'],
});

const connectionUrl = process.env.POSTGRES_URL;

export default new DataSource({
  type: 'postgres',
  useUTC: true,
  ...(connectionUrl
    ? {
        url: connectionUrl,
      }
    : {
        host: process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_PORT),
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DATABASE,
      }),
  ssl: process.env.POSTGRES_SSL?.toLowerCase() === 'true',
  synchronize: false,
  migrationsRun: true,
  migrations: ['src/infrastructure/database/migrations/*.ts'],
  migrationsTableName: 'migrations_typeorm',
  namingStrategy: new CustomNamingStrategy(),
  entities: ['src/modules/**/*.entity.ts'],
});
