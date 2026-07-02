import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);
  private readonly webhookUrl: string;

  constructor(private config: ConfigService) {
    this.webhookUrl = this.config.get<string>('SLACK_WEBHOOK_URL')?? "";
  }

  async postPrSummary(params: {
    prNumber: number;
    title: string;
    author?: string;
    summary: string;
    riskFlag: string;
    riskReason: string;
    url: string;
  }) {
    const riskEmoji =
      { low: '🟢', medium: '🟡', high: '🔴' }[params.riskFlag] ?? '⚪';

    const payload = {
      text:
        `${riskEmoji} *PR #${params.prNumber}: ${params.title}*\n` +
        `_by ${params.author ?? 'unknown'}_\n\n` +
        `${params.summary}\n\n` +
        `*Risk:* ${params.riskFlag} — ${params.riskReason}\n` +
        `<${params.url}|View PR>`,
    };

    await this.send(payload);
  }

  async postChangelog(changelog: string, releaseTag?: string) {
    const payload = {
      text: `📦 *Changelog${releaseTag ? ` — ${releaseTag}` : ''}*\n\n${changelog}`,
    };
    await this.send(payload);
  }

  private async send(payload: { text: string }) {
    if (!this.webhookUrl) {
      this.logger.warn('SLACK_WEBHOOK_URL not set — logging instead of posting');
      this.logger.log(payload.text);
      return;
    }

    try {
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        this.logger.error(`Slack post failed: ${res.status} ${await res.text()}`);
      }
    } catch (err) {
      this.logger.error(`Slack post error: ${err}`);
    }
  }
}
