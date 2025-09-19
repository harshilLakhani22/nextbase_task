import 'fastify';
import { Server as IOServer } from 'socket.io';
declare module 'fastify' {
  interface FastifyInstance {
    io: IOServer;
  }
  interface FastifyRequest {
    // This will hold the decoded JWT payload after verification
    user?: {
      userId: string;
      username?: string;
      iat?: number;
      exp?: number;
      [k: string]: any;
    };
  }
}
