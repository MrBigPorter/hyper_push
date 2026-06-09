import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * GitHub event types for repository_dispatch.
 * These must match the types in deploy.yml → on → repository_dispatch → types.
 */
type DispatchEventType = 'codepush-hotfix' | 'codepush-staging';

/**
 * Service to trigger GitHub Actions workflows via repository_dispatch.
 *
 * Environment variables required:
 *   CODEPUSH_GITHUB_PAT     — Personal Access Token with "repo" scope
 *   CODEPUSH_GITHUB_OWNER   — GitHub owner (user or org) of frontend-blog-mobile
 */
@Injectable()
export class CodepushGithubService {
  private readonly pat: string;
  private readonly repoOwner: string;
  private readonly repoName = 'frontend-blog-mobile';

  constructor(private readonly config: ConfigService) {
    const pat = this.config.get<string>('CODEPUSH_GITHUB_PAT');
    const owner = this.config.get<string>('CODEPUSH_GITHUB_OWNER');

    if (!pat) {
      console.warn(
        '[CodepushGithubService] CODEPUSH_GITHUB_PAT not configured — triggerCodepushRelease will be unavailable',
      );
    }
    if (!owner) {
      console.warn(
        '[CodepushGithubService] CODEPUSH_GITHUB_OWNER not configured — triggerCodepushRelease will be unavailable',
      );
    }

    this.pat = pat ?? '';
    this.repoOwner = owner ?? '';
  }

  /**
   * Trigger a GitHub Actions workflow via repository_dispatch.
   *
   * @param environment - 'staging' or 'production'
   * @param description - Optional description to include in the dispatch payload
   * @returns true if the dispatch was accepted (HTTP 204), false on failure
   */
  async triggerWorkflowDispatch(
    environment: 'staging' | 'production',
    description?: string,
  ): Promise<boolean> {
    if (!this.pat || !this.repoOwner) {
      throw new Error(
        'GitHub integration not configured. Set CODEPUSH_GITHUB_PAT and CODEPUSH_GITHUB_OWNER environment variables.',
      );
    }

    const eventType: DispatchEventType =
      environment === 'production' ? 'codepush-hotfix' : 'codepush-staging';

    const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/dispatches`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${this.pat}`,
        'Content-Type': 'application/json',
        'User-Agent': 'hyperpush-backend/1.0',
      },
      body: JSON.stringify({
        event_type: eventType,
        client_payload: {
          description: description ?? `Hot fix triggered from HyperPush dashboard (${environment})`,
          triggered_by: 'hyperpush-dashboard',
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`GitHub API error (${response.status}): ${body || response.statusText}`);
    }

    return true;
  }
}
