import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  );

  // Security headers & CORS per Section 17.4
  await app.register(fastifyHelmet as any, { contentSecurityPolicy: false });
  await app.register(fastifyCors as any, {
    origin: true,
    credentials: true,
  });
  await app.register(fastifyCookie as any);

  // OpenAPI 3.1 Spec Generation (Section 10 & 14)
  const config = new DocumentBuilder()
    .setTitle('BulkkX Platform API')
    .setDescription(
      'India-first horizontal commodity matching platform with zero-leak identity masking and append-only integer paise ledger.'
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 BulkkX NestJS Fastify modular monolith running on http://localhost:${port}`);
  console.log(`📑 OpenAPI Documentation available on http://localhost:${port}/api/docs`);
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}

export { bootstrap };
