import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = await this.authService.verifyJwtToken(token);
        request.user = {
          id: payload.sub as string,
          role: payload.role as string,
          phone: payload.phone as string,
          legalName: payload.legalName as string,
        };
        return true;
      } catch {
        throw new UnauthorizedException('Invalid JWT Token');
      }
    }

    // Support developer / test impersonation headers for automated testing
    if (request.headers['x-user-role']) {
      request.user = {
        id: (request.headers['x-user-id'] as string) || 'test-user-id',
        role: request.headers['x-user-role'] as string,
        legalName: 'Test Impersonated User',
      };
      return true;
    }

    throw new UnauthorizedException('Missing Authorization Bearer token');
  }
}
