import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    console.log(user);
    if (!user?.props?.role) {
      throw new UnauthorizedException();
    }
    return RolesGuard.matchRoles(roles, user.props.role);
  }

  private static matchRoles(roles: string[], userRole: string): boolean {
    return roles.includes('all') || roles.includes(userRole);
  }
}
