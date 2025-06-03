import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { ConfigService } from "@nestjs/config"
import helmet from "helmet"
import { AppModule } from "./app.module"
import { HttpExceptionFilter } from "./common/filters/http-exception.filter"
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  // Security
  app.use(helmet())
  app.enableCors({
    origin: configService.get("ALLOWED_ORIGINS")?.split(",") || ["*"],
    credentials: true,
  })

  // Global pipes and filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new LoggingInterceptor())

  // API prefix
  app.setGlobalPrefix("api/v1")

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("OpenAI ChatGPT API Wrapper")
    .setDescription("NestJS wrapper for OpenAI ChatGPT API with Supabase integration")
    .setVersion("1.0")
    .addApiKey(
      {
        type: "apiKey",
        name: "X-API-Key",
        in: "header",
      },
      "api-key",
    )
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      "bearer-token",
    )
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("api/docs", app, document)

  // Use Railway's PORT environment variable or default to 3000
  const port = process.env.PORT || configService.get("PORT") || 3000
  await app.listen(port, "0.0.0.0")

  console.log(`🚀 Application is running on: http://0.0.0.0:${port}`)
  console.log(`📚 Swagger documentation: http://0.0.0.0:${port}/api/docs`)
  console.log(`🏥 Health check: http://0.0.0.0:${port}/api/v1/health`)
}

bootstrap()
