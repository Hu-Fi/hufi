import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'body-parser';
import { useContainer } from 'class-validator';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';
import helmet from 'helmet';

import { ServerConfigService } from './common/config/server-config.service';
import { AppModule } from './modules/app/app.module';

export default async function init(app: any) {
  const configService: ConfigService = app.get(ConfigService);
  const serverConfigService = new ServerConfigService(configService);

  app.setGlobalPrefix('api');

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.use(cookieParser());

  app.use(
    expressSession({
      secret: serverConfigService.sessionSecret,
      resave: false,
      saveUninitialized: false,
    }),
  );
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ limit: '5mb', extended: true }));

  const config = new DocumentBuilder()
    .setTitle('HuFi Recording Oracle API')
    .setDescription('Recording Oracle API to record data')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  app.use(helmet());
}
