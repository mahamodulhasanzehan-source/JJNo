import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  
  // Socket.io for WebRTC Signaling
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  interface LobbyEntry {
    id: string;
    name: string;
    character: string;
  }
  
  let lobbyEntries: LobbyEntry[] = [];

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    
    // Send current lobby to new connection
    socket.emit("lobby_update", lobbyEntries);

    socket.on("join_q2play", (data) => {
      if (!lobbyEntries.find(e => e.id === socket.id)) {
        lobbyEntries.push({ 
          id: socket.id, 
          name: data.name || "Fighter",
          character: data.character || "Yuji"
        });
        io.emit("lobby_update", lobbyEntries);
      }
    });

    socket.on("leave_q2play", () => {
      lobbyEntries = lobbyEntries.filter(e => e.id !== socket.id);
      io.emit("lobby_update", lobbyEntries);
    });

    socket.on("challenge_player", (targetId) => {
      const target = lobbyEntries.find(e => e.id === targetId);
      if (target) {
        // Remove both from lobby
        lobbyEntries = lobbyEntries.filter(e => e.id !== socket.id && e.id !== targetId);
        io.emit("lobby_update", lobbyEntries);

        const room = `room_${socket.id}_${targetId}`;
        socket.join(room);
        const targetSocket = io.sockets.sockets.get(targetId);
        
        if (targetSocket) {
          targetSocket.join(room);
          // Challenger is host, target is client
          socket.emit("match_found", { room, role: "host" });
          targetSocket.emit("match_found", { room, role: "client" });
        }
      }
    });

    // WebRTC Signaling
    socket.on("webrtc_offer", (data) => {
      socket.to(data.room).emit("webrtc_offer", data.offer);
    });

    socket.on("webrtc_answer", (data) => {
      socket.to(data.room).emit("webrtc_answer", data.answer);
    });

    socket.on("webrtc_ice_candidate", (data) => {
      socket.to(data.room).emit("webrtc_ice_candidate", data.candidate);
    });

    socket.on("disconnect", () => {
      lobbyEntries = lobbyEntries.filter(e => e.id !== socket.id);
      io.emit("lobby_update", lobbyEntries);
      console.log("User disconnected:", socket.id);
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
