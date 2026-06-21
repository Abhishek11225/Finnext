import type { Server } from "socket.io";

type SocketEvent =
  | "mentorship:created"
  | "mentorship:accepted"
  | "mentorship:rejected"
  | "mentorship:completed"
  | "mentorship:feedback"
  | "notification:new"
  | "notification:read";

declare global {
  var finnextSocketServer: Server | undefined;
}

export const emitToUser = (userId: string, event: SocketEvent, payload: unknown) => {
  global.finnextSocketServer?.to(`user:${userId}`).emit(event, payload);
};
