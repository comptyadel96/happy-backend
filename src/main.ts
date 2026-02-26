import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  // app.set('trust proxy', 1);
  // Security middleware
  app.use(helmet());

  // Rate limiting
  // const limiter = rateLimit({
  //   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  //   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  // });
  // app.use(limiter);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global interceptors & filters
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Enable graceful shutdown
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  app.enableCors({
    origin: '*', // À restreindre en prod plus tard
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Happy Backend API')
    .setDescription(
      'API documentation for Happy - Secure Game Backend for Godot',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Game', 'Game logic endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`✅ Happy Backend is running on port ${port}`);
  console.log(`🎮 WebSocket server available on ws://localhost:${port}/game`);
  console.log(
    `📚 Swagger documentation available at http://localhost:${port}/api/docs`,
  );
  console.log(`📦 Instance ID: ${process.env.INSTANCE_ID || 'localhost'}`);
}

void bootstrap();
