const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Store rooms: roomId -> Set of socket ids
  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-room", ({ roomId }) => {
      const room = rooms.get(roomId) || new Set();

      if (room.size >= 2) {
        socket.emit("room-full");
        return;
      }

      room.add(socket.id);
      rooms.set(roomId, room);
      socket.join(roomId);

      const otherUsers = [...room].filter((id) => id !== socket.id);
      socket.emit("room-joined", { users: otherUsers, roomId });

      // Notify others in the room
      socket.to(roomId).emit("user-joined", { userId: socket.id });

      console.log(`Socket ${socket.id} joined room ${roomId}. Room size: ${room.size}`);
    });

    // WebRTC signaling
    socket.on("offer", ({ offer, to }) => {
      socket.to(to).emit("offer", { offer, from: socket.id });
    });

    socket.on("answer", ({ answer, to }) => {
      socket.to(to).emit("answer", { answer, from: socket.id });
    });

    socket.on("ice-candidate", ({ candidate, to }) => {
      socket.to(to).emit("ice-candidate", { candidate, from: socket.id });
    });

    socket.on("disconnect", () => {
      rooms.forEach((members, roomId) => {
        if (members.has(socket.id)) {
          members.delete(socket.id);
          if (members.size === 0) {
            rooms.delete(roomId);
          } else {
            io.to(roomId).emit("user-left", { userId: socket.id });
          }
        }
      });
      console.log("Client disconnected:", socket.id);
    });

    socket.on("leave-room", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) rooms.delete(roomId);
        else io.to(roomId).emit("user-left", { userId: socket.id });
      }
      socket.leave(roomId);
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 