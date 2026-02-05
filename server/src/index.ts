import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';


const app = express();

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

});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});