import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SyncService implements OnModuleInit {
  private readonly logger = new Logger(SyncService.name);
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.octokit = new Octokit({ auth: this.config.get('GITHUB_TOKEN') });
    const [owner, repo] = (this.config.get<string>('GITHUB_REPO') ?? '').split(
      '/',
    );
    this.owner = owner;
    this.repo = repo;
  }

  // Run a full sync once on startup so the dashboard isn't empty on first boot
  async onModuleInit() {
    this.logger.log('Running initial sync on startup...');
    await this.syncAll();
  }

  // Backup poll every 10 minutes in case any webhook deliveries were missed
  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduledSync() {
    this.logger.log('Running scheduled sync...');
    await this.syncAll();
  }

  private async syncAll() {
    try {
      await this.syncIssues();
      await this.syncPullRequests();
      await this.prisma.syncLog.create({
        data: { source: 'poll', status: 'success', message: 'Full sync completed' },
      });
    } catch (err) {
      this.logger.error(`Sync failed: ${err}`);
      await this.prisma.syncLog.create({
        data: { source: 'poll', status: 'error', message: String(err) },
      });
    }
  }

  private async syncIssues() {
    const { data: issues } = await this.octokit.issues.listForRepo({
      owner: this.owner,
      repo: this.repo,
      state: 'all',
      per_page: 100,
    });

    for (const issue of issues) {
      // GitHub's issues endpoint also returns PRs — skip those, handled separately
      if (issue.pull_request) continue;

      await this.prisma.issue.upsert({
        where: { githubId: issue.id },
        update: {
          title: issue.title,
          status: issue.state === 'closed' ? 'closed' : 'open',
          assignee: issue.assignee?.login,
          labels: issue.labels
            .map((l) => (typeof l === 'string' ? l : l.name))
            .join(','),
        },
        create: {
          githubId: issue.id,
          number: issue.number,
          title: issue.title,
          body: issue.body ?? undefined,
          status: issue.state,
          assignee: issue.assignee?.login,
          labels: issue.labels
            .map((l) => (typeof l === 'string' ? l : l.name))
            .join(','),
        },
      });
    }

    this.logger.log(`Synced ${issues.length} issues`);
  }

  private async syncPullRequests() {
    const { data: prs } = await this.octokit.pulls.list({
      owner: this.owner,
      repo: this.repo,
      state: 'all',
      per_page: 100,
    });

    for (const pr of prs) {
      const existing = await this.prisma.pullRequest.findUnique({
        where: { githubId: pr.id },
      });

      // Don't overwrite Claude-generated summaries/risk flags on a plain poll —
      // only the webhook path (which has the diff) should set those.
      await this.prisma.pullRequest.upsert({
        where: { githubId: pr.id },
        update: {
          title: pr.title,
          status: pr.merged_at ? 'merged' : pr.state,
        },
        create: {
          githubId: pr.id,
          number: pr.number,
          title: pr.title,
          author: pr.user?.login,
          status: pr.merged_at ? 'merged' : pr.state,
          diffSummary: existing?.diffSummary,
          riskFlag: existing?.riskFlag,
        },
      });
    }

    this.logger.log(`Synced ${prs.length} pull requests`);
  }
}
