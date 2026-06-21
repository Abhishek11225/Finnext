const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const port = Number(process.env.PORT || 3000);
const dev = process.env.NODE_ENV !== "production" && process.env.npm_lifecycle_event !== "start";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  const io = new Server(httpServer, {
    path: "/api/socket",
    cors: { origin: "*" },
  });

  global.finnextSocketServer = io;

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (typeof userId === "string" && userId.trim()) {
      socket.join(`user:${userId}`);
    }
  });

  httpServer.listen(port, () => {
    console.log(`FinNext ready on http://localhost:${port}`);
  });
});
