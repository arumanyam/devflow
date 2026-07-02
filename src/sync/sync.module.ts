import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SyncService } from './sync.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  providers: [SyncService],
})
export class SyncModule {}
