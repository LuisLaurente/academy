import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }
    if (user.role !== 'admin') {
      throw new ForbiddenException('Acceso denegado: se requieren privilegios de administrador');
    }
    return true;
  }
}
