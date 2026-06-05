import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RecaptchaService {
  private readonly verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
  private readonly secretKey: string;
  private readonly enabled: boolean;
  private readonly threshold: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY', '');
    // ⚠️ .env values are always strings; "false" is truthy in JS!
    // Must explicitly compare to 'true'
    this.enabled = this.configService.get<string>('RECAPTCHA_ENABLED', 'false') === 'true';
    this.threshold = Number(this.configService.get<string>('RECAPTCHA_THRESHOLD', '0.5'));
  }

  /**
   * Verify a reCAPTCHA v3 token from the frontend.
   *
   * - If reCAPTCHA is disabled (dev mode), always passes.
   * - If no token is provided, fails (score = 0).
   * - If the Google API is unreachable, degrades gracefully (passes with score 0.5).
   * - Otherwise, checks `success && score >= threshold`.
   */
  async verifyToken(token?: string): Promise<{ success: boolean; score: number }> {
    if (!this.enabled) {
      // Dev mode — skip verification
      return { success: true, score: 1.0 };
    }

    if (!token) {
      return { success: false, score: 0 };
    }

    try {
      const response = await this.httpService.axiosRef.post<{
        success: boolean;
        score: number;
        action?: string;
        challenge_ts?: string;
        hostname?: string;
        'error-codes'?: string[];
      }>(this.verifyUrl, null, {
        params: {
          secret: this.secretKey,
          response: token,
        },
      });

      const data = response.data;

      if (data.success && data.score >= this.threshold) {
        return { success: true, score: data.score };
      }

      return { success: false, score: data.score ?? 0 };
    } catch (error: unknown) {
      // Google API unavailable — degrade gracefully
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('ReCaptcha verify error:', message);
      return { success: true, score: 0.5 };
    }
  }

  /** Score between 0.3 and 0.5 — may need manual review */
  needsReview(score: number): boolean {
    return score >= 0.3 && score < 0.5;
  }

  /** Score below 0.3 — likely a bot */
  isBot(score: number): boolean {
    return score < 0.3;
  }
}
