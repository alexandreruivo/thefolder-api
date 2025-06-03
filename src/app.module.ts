import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { ThrottlerModule } from "@nestjs/throttler"
import { ChatModule } from "./chat/chat.module"
import { AuthModule } from "./auth/auth.module"
import { HealthModule } from "./health/health.module"
import { configuration } from "./config/configuration"

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    AuthModule,
    ChatModule,
    HealthModule,
  ],
})
export class AppModule {}
