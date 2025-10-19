import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

@Injectable()
export class OptionalAuthGuard extends AuthGuard {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    //If no Authorization header, allow the request
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return true;
    }

    //Otherwise, use normal AuthGuard behavior
    try {
      return super.canActivate(context);
    } catch {
      // Invalid or expired token -> allow as public (no req.user)
      return true;
    }
  }
}
