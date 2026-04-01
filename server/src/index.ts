import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './game/RoomManager.js';
import { error } from 'console';

interface CustomSocket extends Socket {
  lastMessageTime?: number;
}


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
// Функция для рассылки списка доступных комнат всем подключенным клиентам
const broadcastRooms = () => {
  const roomsList = Array.from(roomManager.rooms.entries()).map(([id, game]) => ({
    id,
    playersCount: game.players.length
  }));
  io.emit('available_rooms', roomsList);
};

//  Handle Socket.IO connections
io.on('connection', (socket: CustomSocket) => {
  broadcastRooms();  
  console.log(`A user connected: ${socket.id}`);
    
    // Handle disconnection
    socket.on('disconnect', () => {
        for (const[roomId, game] of roomManager.rooms.entries()){
          const playerIndex = game.players.findIndex(p => p.id === socket.id);
          if (playerIndex !== -1){
            console.log(`Удаляем игрока ${socket.id} из комнаты ${roomId}`);
          }
          if (playerIndex < game.currentPlayerIndex){
            game.currentPlayerIndex--;
          } else if (playerIndex === game.currentPlayerIndex && playerIndex === game.players.length - 1){
            game.currentPlayerIndex = 0;
          }
          game.players = game.players.filter(p => p.id !== socket.id);
          if (game.players.length === 0){
            roomManager.rooms.delete(roomId);
            console.log(`Комната ${roomId} удалена (пустая)`);
            return;
          }
          if (game.hostId === socket.id){
            game.hostId = game.players[0]?.id || null;
          }
          if (game.discardPile.length > 0 && game.players.length < 2) {
            game.winner = game.players[0] || null ; 
            io.to(roomId).emit('game_over', game.winner!.name);
          } 
          else {
           io.to(roomId).emit('player_joined', game.players);
           if (game.discardPile.length > 0) {
              io.to(roomId).emit('game_started', {
                topCard: game.discardPile[game.discardPile.length - 1]!,
                  currentPlayerId: game.players[game.currentPlayerIndex]?.id
              });
            }
          }     
           break;
        }
        broadcastRooms();
    });
    // 
    socket.on('create_room', () => {
      const roomId = roomManager.createRoom();
      socket.join(roomId);
      socket.emit("room_created", roomId);
      console.log(`Комната ${roomId} создана игроком ${socket.id}`);
      broadcastRooms();
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
      broadcastRooms()
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
        currentPlayerId: game.players[game.currentPlayerIndex]?.id 
      });
    })
    socket.on('play_card', (roomId, cardIndex, declaredColor) => {
      const game = roomManager.getRoom(roomId);
      if (!game){
        return;
      }
      try{
        game.playCard(socket.id, cardIndex, declaredColor)

        io.to(roomId).emit('game_started', {
          topCard: game.discardPile[game.discardPile.length -1]!,
          currentPlayerId: game.players[game.currentPlayerIndex]!.id
        });
        for(const player of game.players){
          io.to(player.id).emit('your_cards', player.hand);
        }
        if(game.winner){
          io.to(roomId).emit('game_over', game.winner.name);
        }
      }catch(err: any){
        socket.emit('error_event', err.message);
      }
    })
    socket.on('draw_card', (roomId) => {
      const game = roomManager.getRoom(roomId);

      if (!game) return;

      try {
        game.drawCard(socket.id);

        io.to(roomId).emit('game_started', {
          topCard: game.discardPile[game.discardPile.length -1]!,
          currentPlayerId: game.players[game.currentPlayerIndex]!.id
        });
        const player = game.players.find(p => p.id === socket.id);

        if (player){
          socket.emit('your_cards', player.hand);
        }


      } catch(err: any){
        socket.emit('error_event', err.message)
      }
    })
    socket.on('call_uno', (roomId)=>{
      const game = roomManager.getRoom(roomId);
      if (!game){return;}
      try{
        game?.callUno(socket.id)
        const caller = game.players.find(p => p.id === socket.id);
            if (caller) {
              io.to(roomId).emit('system_message', `🛡️ ${caller.name} крикнул "УНО!"`);
            }         
      }catch(err:any){
        socket.emit('error_event', err.message)
      }
    })
    socket.on('catch_uno', (roomId) => {
      const game = roomManager.getRoom(roomId);
      if (!game){return;}

      try{
        const violator = game.catchUno(socket.id);

        // 1. Отправляем нарушителю его обновленные карты со штрафом
        io.to(violator.id).emit('your_cards', violator.hand);

        // 2. Рассылаем всем в комнате уведомление о поимке
        const catcher = game.players.find(p => p.id === socket.id);
        if (catcher && violator) {
          io.to(roomId).emit('system_message', `🚨 ${catcher.name} поймал игрока ${violator.name}! Штраф 2 карты.`);
        }   
      }catch(err: any){
        socket.emit('error_event', err.message)
      }
    });

    
    const SPAM_COOLDOWN_MS = 1000; // Лимит: 1 секунда

    socket.on('send_message', (payload) => {
      const now = Date.now();
      
      // Проверка на спам
      if (socket.lastMessageTime && (now - socket.lastMessageTime < SPAM_COOLDOWN_MS)) {
        socket.emit('spam_error', { 
          messageId: payload.messageId, 
          text: 'Не спамь! Подожди секунду.' 
        });
        return; 
      }

      // Обновляем таймер последнего сообщения
      socket.lastMessageTime = now;
      
      // Пересылаем сообщение всем остальным в комнате
      socket.to(payload.roomId).emit('new_message', payload);
    });

});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});