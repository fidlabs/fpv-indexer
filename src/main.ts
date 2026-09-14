import { NestFactory } from '@nestjs/core';
import 'dotenv/config';
import { AppModule, ObserveInstrument } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import './polyfill';
import { packageSemver } from './lib/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('FPV Indexer API')
    .setDescription(
      'Documentation of Filecoin Pay Volume Indexer RESTful endpoint. Indexer based on FIP-0118.',
    )
    .setVersion(packageSemver ? packageSemver.toString() : '0.0.1')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
