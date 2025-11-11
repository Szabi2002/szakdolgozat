import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context }) => {
            return `${timestamp} [${context}] ${level}: ${message}`;
          }),
        ),
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api');

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || 'http://localhost:4200',
    credentials: true,
  });

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Közlekedési Jegykezelő API')
    .setDescription('API dokumentáció a Közlekedési Jegykezelő alkalmazáshoz')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('Auth', 'Autentikáció és felhasználókezelés')
    .addTag('Users', 'Felhasználókezelés')
    .addTag('Routes', 'Járatok kezelése')
    .addTag('Stops', 'Megállók kezelése')
    .addTag('ticket-types', 'Jegytípusok kezelése')
    .addTag('tickets', 'Jegyek vásárlása és kezelése')
    .addTag('Health', 'Health check végpontok')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = configService.get('PORT') || 3000;
  const host = configService.get('HOST') || 'localhost';
  const nodeEnv = configService.get('NODE_ENV') || 'development';

  try {
    await app.listen(port);

    // Only log URLs in development mode
    if (nodeEnv === 'development') {
      logger.log(`Alkalmazás fut: http://${host}:${port}`, 'Bootstrap');
      logger.log(`Swagger docs: http://${host}:${port}/api/docs`, 'Bootstrap');
    } else {
      logger.log(`Alkalmazás fut porton: ${port}`, 'Bootstrap');
    }
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      logger.error(
        `Port ${port} már használatban van. Kérlek állítsd le a futó folyamatot vagy használj másik portot.`,
        'Bootstrap',
      );
      logger.error(`Windows-on: taskkill //F //PID <process_id>`, 'Bootstrap');
      logger.error(`Vagy módosítsd a PORT értéket a .env fájlban`, 'Bootstrap');
    } else {
      logger.error(`Hiba történt az alkalmazás indításakor: ${error.message}`, 'Bootstrap');
    }
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  // Use a basic logger since the app logger might not be available
  const errorLogger = new (require('winston')).createLogger({
    transports: [new (require('winston')).transports.Console()],
  });
  errorLogger.error('Fatal error during bootstrap:', error);
  process.exit(1);
});
