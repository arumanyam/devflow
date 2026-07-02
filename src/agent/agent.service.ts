import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

interface PrSummaryResult {
  summary: string;
  riskFlag: 'low' | 'medium' | 'high';
  riskReason: string;
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly anthropic: Anthropic;

  constructor(private config: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async summarizePullRequest(
    title: string,
    diff: string,
  ): Promise<PrSummaryResult> {
    const systemPrompt = `You are a code review assistant. You will be given a PR title and diff.
Respond with ONLY a JSON object, no preamble, no markdown fences, matching this exact shape:
{
  "summary": "2-3 sentence plain-English summary of what the diff changes and why it likely matters",
  "riskFlag": "low" | "medium" | "high",
  "riskReason": "one sentence justifying the risk flag (e.g. touches auth, no tests added, large surface area)"
}
Risk guidance:
- "high": touches auth/security/payment logic, deletes data, or has no accompanying tests
- "medium": moderate surface area, touches shared/core modules
- "low": isolated change, tests included, low blast radius`;

    const truncatedDiff =
      diff.length > 12000 ? diff.slice(0, 12000) + '\n...[truncated]' : diff;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `PR Title: ${title}\n\nDiff:\n${truncatedDiff}`,
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      const raw = textBlock && 'text' in textBlock ? textBlock.text : '';
      const cleaned = raw.replace(/```json|```/g, '').trim();

      return JSON.parse(cleaned) as PrSummaryResult;
    } catch (err) {
      this.logger.error(`Failed to summarize PR: ${err}`);
      return {
        summary: 'Summary unavailable — Claude API call failed.',
        riskFlag: 'medium',
        riskReason:
          'Could not assess risk automatically; manual review required.',
      };
    }
  }

  async generateChangelog(mergedPrTitles: string[]): Promise<string> {
    const systemPrompt = `You write concise release changelogs in markdown, grouped under
"Features", "Fixes", and "Other" headers. Only include headers that have items. No preamble.`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Merged PR titles since last release:\n${mergedPrTitles.join('\n')}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    return textBlock && 'text' in textBlock ? textBlock.text : '';
  }
}
