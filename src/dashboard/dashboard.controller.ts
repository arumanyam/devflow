import { Controller, Get, Render, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class DashboardController {
  constructor(private prisma: PrismaService) {}

  // JSON API endpoints
  @Get('api/issues')
  async getIssues(@Query('status') status?: string) {
    return this.prisma.issue.findMany({
      where: status ? { status } : undefined,
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Get('api/pull-requests')
  async getPullRequests(@Query('status') status?: string) {
    return this.prisma.pullRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Get('api/sync-logs')
  async getSyncLogs() {
    return this.prisma.syncLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  // Simple server-rendered dashboard
  @Get()
  @Render('dashboard')
  async dashboard() {
    const [issues, pullRequests, recentLogs] = await Promise.all([
      this.prisma.issue.findMany({ orderBy: { updatedAt: 'desc' } }),
      this.prisma.pullRequest.findMany({ orderBy: { updatedAt: 'desc' } }),
      this.prisma.syncLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);

    return {
      issues,
      pullRequests,
      recentLogs,
      openCount: issues.filter((i) => i.status === 'open').length,
      blockedCount: issues.filter((i) => i.status === 'blocked').length,
      highRiskPrCount: pullRequests.filter((p) => p.riskFlag === 'high').length,
    };
  }
}
