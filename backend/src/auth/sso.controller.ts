import { Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('auth')
export class SsoController {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * GET /api/auth/grafana-token
   *
   * Generates a short-lived JWT token signed with GRAFANA_AUTH_SECRET.
   * The frontend redirects the user to Grafana with this token in the URL.
   * Nginx auth_request forwards the token to auth-service for validation.
   *
   * Returns: { token: "eyJhbGci..." }  (expires in 30 seconds)
   */
  @Get('grafana-token')
  async getGrafanaToken(@Req() req: { user: { email: string } }) {
    const secret = this.configService.get<string>('GRAFANA_AUTH_SECRET');

    if (!secret) {
      throw new UnauthorizedException('Grafana SSO is not configured');
    }

    // Sign with GRAFANA_AUTH_SECRET (different from the app's JWT_SECRET)
    const token = this.jwtService.sign({ email: req.user.email }, { secret, expiresIn: '30s' });

    return { token };
  }
}
