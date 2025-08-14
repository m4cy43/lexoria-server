import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { GlobalQueryPipe } from './common/pipes/global-query.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://838b71fcc394.ngrok-free.app',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
    ],
  });

  app
    .getHttpAdapter()
    .getInstance()
    .set('query parser', (q) => q);

  app.useGlobalPipes(
    new GlobalQueryPipe(),
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

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
