import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: false,
      validateCustomDecorators: true,
      stopAtFirstError: false,
    }),
  );

  app.use(cookieParser());

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  app.use(helmet());
  app.use(compression());

  const config = new DocumentBuilder()
    .addCookieAuth()
    .addBearerAuth()
    .setTitle('Lexoria API docs')
    .setDescription('The Lexoria API documentation')
    .setVersion('1.0')
    .addTag('lexoria')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
