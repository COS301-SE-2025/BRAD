import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { ROLES_KEY } from '../decorators/roles.decorator';
  import { JwtPayload } from '../interfaces/jwt-payload.interface';
  
  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}
  
    canActivate(context: ExecutionContext): boolean {
      const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
  
      if (!requiredRoles) return true;
  
      const { user } = context.switchToHttp().getRequest() as { user: JwtPayload };
  
      if (!requiredRoles.includes(user.role)) {
        throw new ForbiddenException('Insufficient permissions');
      }
  
      return true;
    }
  }
  