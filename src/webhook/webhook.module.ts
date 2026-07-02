import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { AgentModule } from '../agent/agent.module';
import { NotifyModule } from '../notify/notify.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AgentModule, NotifyModule, PrismaModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
