import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  BadRequestException,
} from '@nestjs/common';
 import { Buffer } from 'buffer';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AgentService } from '../agent/agent.service';
import { NotifyService } from '../notify/notify.service';
import { Octokit } from '@octokit/rest';

@Controller('webhooks')
export class WebhookController {
  private octokit: Octokit;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private agent: AgentService,
    private notify: NotifyService,
  )
   {
    this.octokit = new Octokit({ auth: this.config.get('GITHUB_TOKEN') });
  }

  @Post('github')
  async handleGithubEvent(
    @Req() req: Request & { rawBody?: Buffer },
    @Res() res: Response,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') eventType: string,
  ) 
  {
    const config = {
      api: {
         bodyParser: false, 
      },
    };
 

    this.verifySignature(req.body, signature);

    const payload = req.body;

    await this.prisma.syncLog.create({
      data: { source: 'webhook', eventType, status: 'success' },
    });

    if (
      eventType === 'pull_request' &&
      ['opened', 'synchronize'].includes(payload.action)
    ) {
      await this.handlePullRequestEvent(payload);
    }

    if (
      eventType === 'pull_request' &&
      payload.action === 'closed' &&
      payload.pull_request.merged
    ) {
      await this.handlePrMerged(payload);
    }

    if (eventType === 'issues') {
      await this.handleIssueEvent(payload);
    }

    res.status(200).json({ received: true });
  }

  private verifySignature(rawBody: Buffer, signature: string) {
    const secret = this.config.get<string>('GITHUB_WEBHOOK_SECRET');
    if (!secret || !signature) throw new BadRequestException('Missing signature');

    const expected =
      'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expected);
    if (
      sigBuffer.length !== expBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expBuffer)
    ) {
      throw new BadRequestException('Invalid signature');
    }
  }

  private async handlePullRequestEvent(payload: any) {
    const pr = payload.pull_request;

    const { data: diffData } = await this.octokit.request(
      `GET ${pr.diff_url.replace('https://github.com', '')}`,
      { headers: { accept: 'application/vnd.github.v3.diff' } },
    );

    const result = await this.agent.summarizePullRequest(
      pr.title,
      String(diffData),
    );

    await this.prisma.pullRequest.upsert({
      where: { githubId: pr.id },
      update: {
        title: pr.title,
        status: 'open',
        diffSummary: result.summary,
        riskFlag: result.riskFlag,
      },
      create: {
        githubId: pr.id,
        number: pr.number,
        title: pr.title,
        author: pr.user?.login,
        status: 'open',
        diffSummary: result.summary,
        riskFlag: result.riskFlag,
      },
    });

    await this.notify.postPrSummary({
      prNumber: pr.number,
      title: pr.title,
      author: pr.user?.login,
      summary: result.summary,
      riskFlag: result.riskFlag,
      riskReason: result.riskReason,
      url: pr.html_url,
    });
  }

  private async handlePrMerged(payload: any) {
    const pr = payload.pull_request;
    await this.prisma.pullRequest.update({
      where: { githubId: pr.id },
      data: { status: 'merged' },
    });
  }

  private async handleIssueEvent(payload: any) {
    const issue = payload.issue;
    await this.prisma.issue.upsert({
      where: { githubId: issue.id },
      update: {
        title: issue.title,
        status: issue.state === 'closed' ? 'closed' : 'open',
        assignee: issue.assignee?.login,
      },
      create: {
        githubId: issue.id,
        number: issue.number,
        title: issue.title,
        status: issue.state,
        assignee: issue.assignee?.login,
        labels: issue.labels?.map((l: any) => l.name).join(','),
      },
    });
  }
}
