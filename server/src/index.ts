import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './game/RoomManager.js';


const app = express();
const roomManager = new RoomManager()

// Enable CORS for all origins
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO server

const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST']
  }
});

//  Handle Socket.IO connections
io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
    socket.on('create_room', () => {
      const roomId = roomManager.createRoom();
      socket.join(roomId);
      socket.emit("room_created", roomId);
      console.log(`Комната ${roomId} создана игроком ${socket.id}`);
    })

});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});