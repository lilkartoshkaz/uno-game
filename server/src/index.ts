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
    // 
    socket.on('create_room', () => {
      const roomId = roomManager.createRoom();
      socket.join(roomId);
      socket.emit("room_created", roomId);
      console.log(`Комната ${roomId} создана игроком ${socket.id}`);
    })
    socket.on('join_room', (roomId,playerName) => {
      const game = roomManager.getRoom(roomId);
      if(!game){
        socket.emit('error_event', 'Нет такой комнаты');
        return 
      }
      game.addPlayer(socket.id, playerName);

      socket.join(roomId);
      io.to(roomId).emit("player_joined", game.players);

      console.log(`Игрок ${playerName} (${socket.id}) присоединился к комнате ${roomId}`);
    })
    socket.on('start_game', (roomId) => {
      const game = roomManager.getRoom(roomId);
      if (!game){
        return;
      }
      if (socket.id != game.hostId ){
        socket.emit('error_event', 'Только создатель может начать игру');
        return;
      }
      if (game.players.length < 2){
        socket.emit('error_event', 'Недостаточно игроков ');
        return
      }
      game.startGame();
      for( const player of game.players){
        io.to(player.id).emit('your_cards', player.hand);
      }
      io.to(roomId).emit('game_started', {
        topCard: game.discardPile[game.discardPile.length - 1]!, 
        currentPlayerId: game.players[game.currentPlayerIndex]!.id 
      });
    })
    
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});