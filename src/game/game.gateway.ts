import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { GameService } from './game.service';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:*',
  },
  namespace: '/game',
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userConnections = new Map<string, string>(); // userId -> socketId

  constructor(
    private gameService: GameService,
    private prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    console.log('WebSocket server initialized');
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;

    if (!token) {
      client.disconnect();
      console.log('Client disconnected: No token provided');
      return;
    }

    try {
      const payload = await (this.gameService as any).validateToken?.(token);

      if (!payload) {
        client.disconnect();
        console.log('Client disconnected: Invalid token');
        return;
      }

      client.data.userId = payload.sub || payload.userId;
      client.data.user = payload;

      // Track user connection
      this.userConnections.set(client.data.userId, client.id);

      // Record WebSocket connection
      await this.prisma.webSocketConnection.create({
        data: {
          userId: client.data.userId,
          socketId: client.id,
        },
      });

      console.log(`User ${client.data.userId} connected with socket ${client.id}`);

      // Send heartbeat response
      client.emit('connection_established', {
        socketId: client.id,
        userId: client.data.userId,
      });
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId) {
      this.userConnections.delete(userId);

      // Update WebSocket connection record
      await this.prisma.webSocketConnection.updateMany({
        where: { socketId: client.id },
        data: {
          disconnectedAt: new Date(),
        },
      });

      console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(@ConnectedSocket() client: Socket) {
    client.emit('heartbeat_response', {
      timestamp: new Date(),
      socketId: client.id,
    });
  }

  @SubscribeMessage('player_move')
  async handlePlayerMove(
    @MessageBody() data: { levelId: number; x: number; y: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;

    // Broadcast player position to other players in same level
    this.server.emit('player_moved', {
      userId,
      levelId: data.levelId,
      position: { x: data.x, y: data.y },
    });

    return { success: true };
  }

  @SubscribeMessage('item_collected')
  async handleItemCollected(
    @MessageBody()
    data: {
      levelId: number;
      itemType: 'chocolate' | 'egg';
      itemIndex: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;

    const result = await this.gameService.handleItemCollection(userId, data);

    if (!result.valid) {
      client.emit('item_collection_failed', {
        error: (result as any).error,
        levelId: data.levelId,
      });
      return result;
    }

    // Broadcast to all players
    this.server.emit('item_collected', {
      userId,
      levelId: data.levelId,
      itemType: data.itemType,
      itemIndex: data.itemIndex,
    });

    client.emit('item_collection_success', {
      message: (result as any).message,
      levelProgress: (result as any).levelProgress,
    });

    return result;
  }

  @SubscribeMessage('level_complete')
  async handleLevelComplete(
    @MessageBody()
    data: {
      levelId: number;
      score: number;
      timeSpent: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;

    const result = await this.gameService.handleLevelComplete(userId, data);

    if (!result.success) {
      client.emit('level_complete_failed', {
        error: result.error,
      });
      return result;
    }

    // Broadcast achievement to all players
    this.server.emit('level_completed', {
      userId,
      levelId: data.levelId,
      score: data.score,
      totalScore: result.totalScore,
    });

    client.emit('level_complete_success', {
      message: result.message,
      totalScore: result.totalScore,
      gameProfile: result.gameProfile,
    });

    return result;
  }

  @SubscribeMessage('game_sync')
  async handleGameSync(
    @MessageBody() syncData: any,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;

    const result = await this.gameService.syncGameState(userId, syncData);

    if (!result.success) {
      client.emit('sync_failed', {
        error: result.error,
      });
      return result;
    }

    client.emit('sync_success', {
      message: result.message,
      gameProfile: result.gameProfile,
    });

    return result;
  }
}
