import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string>; user?: any }>();

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return true;
    }

    const token = authHeader.split(' ')[1];
    if (!token || token.trim() === '') {
      return true;
    }

    // Parse token format: bearer-token-<uuid>-<role>
    // Example: bearer-token-123e4567-e89b-12d3-a456-426614174000-admin
    const parts = token.split('-');
    // Expect at least 4 parts: ["bearer", "token", "<uuid>", "<role>"]
    if (parts.length < 4) {
      throw new UnauthorizedException('Token format is invalid.');
    }

    const role = parts[parts.length - 1];
    // Re‑assemble uuid (could contain hyphens)
    const userId = parts.slice(2, parts.length - 1).join('-');

    // Attach user info to request for downstream guards (e.g., RolesGuard)
    request.user = { userId, role };

    return true;
  }
}
