import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AuthService } from './auth.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token = client.handshake?.auth?.token;

    if (!token) {
      throw new WsException('Unauthorized: No token provided');
    }

    const payload = await this.authService.validateToken(token);

    if (!payload) {
      throw new WsException('Unauthorized: Invalid token');
    }

    // Attach user to socket
    client.user = payload;
    return true;
  }
}
