import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AgentModule } from './agent/agent.module';
import { NotifyModule } from './notify/notify.module';
import { WebhookModule } from './webhook/webhook.module';
import { SyncModule } from './sync/sync.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AgentModule,
    NotifyModule,
    WebhookModule,
    SyncModule,
    DashboardModule,
  ],
})
export class AppModule {}
