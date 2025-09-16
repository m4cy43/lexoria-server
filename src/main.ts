import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { GlobalQueryPipe } from './common/pipes/global-query.pipe';

// import { ImportService } from './import/import.service';

const tf = require('@tensorflow/tfjs');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://2e6773ce0cd1.ngrok-free.app',
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

  // INIT LOADER
  // try {
  //   const importService = app.get(ImportService);
  //   await importService.runImport();
  //   console.log('✅ Import completed successfully!');
  // } catch (error) {
  //   console.error('❌ Import failed:', error);
  // }

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
