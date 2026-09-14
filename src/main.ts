import { NestFactory } from '@nestjs/core';
import 'dotenv/config';
import { AppModule, ObserveInstrument } from './app.module';
import './polyfill';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
