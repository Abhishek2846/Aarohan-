import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SanitizeInputPipe } from './common/pipes/sanitize-input.pipe';

(BigInt.prototype as any).toJSON = function () {
  const num = Number(this);
  return Number.isSafeInteger(num) ? num : this.toString();
};

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS with support for all local network, government gateway, and tunnel origins.
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization,Bypass-Tunnel-Reminder,Idempotency-Key,X-Idempotency-Key,ngrok-skip-browser-warning',
    exposedHeaders: 'X-Idempotent-Replayed,X-Idempotency-Key',
  });

  // OWASP Standard HTTP Security Headers
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Enable URI API Versioning (e.g., /v1/...)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Validation & Input Sanitization Pipes
  app.useGlobalPipes(
    new SanitizeInputPipe(),
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  // Global Interceptor & Exception Filter
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('BhoomiSetu API')
    .setDescription('Land Acquisition Management Platform API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 BhoomiSetu Backend Server running on port ${port}`);
  logger.log(`📚 Swagger Documentation available at http://localhost:${port}/api/docs`);
}
bootstrap().catch((err) => {
  if (err?.code === 'EADDRINUSE') {
    const port = process.env.PORT || 3001;
    console.error(`\n❌ Error: Port ${port} is already in use by another process.`);
    console.error(`👉 Run the following command in PowerShell / Command Prompt to free port ${port}:\n   cmd /c npx kill-port ${port}\n`);
  } else {
    console.error('Fatal bootstrap error:', err);
  }
  process.exit(1);
});
