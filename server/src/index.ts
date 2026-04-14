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
      for (const [roomId, game] of roomManager.rooms.entries()){
        const player = game.players.find(p => p.id === socket.id);
            if (!player) continue;
            console.log(`Игрок ${player.name} отключился от комнаты ${roomId}. Ждем возвращения...`);

            player.isOffline = true;

            player.disconnectTimeout = setTimeout(() => {
              console.log(`Игрок ${player.name} не вернулся. Удаляем окончательно.`);
              const playerIndex = game.players.findIndex(p => p.persistentId === player.persistentId);
              
              if (playerIndex !== -1) {
                // Старая логика сдвига индекса хода...
                if (playerIndex < game.currentPlayerIndex) {
                    game.currentPlayerIndex--;
                } else if (playerIndex === game.currentPlayerIndex && playerIndex === game.players.length - 1) {
                    game.currentPlayerIndex = 0;
                }
                
                game.players = game.players.filter(p => p.persistentId !== player.persistentId);
                
                // --- НОВАЯ ЛОГИКА УДАЛЕНИЯ ---
                
                // Вариант А: В комнате никого не осталось
                if (game.players.length === 0) {
                    game.stopTimer();
                    roomManager.rooms.delete(roomId);
                    broadcastRooms();
                    return;
                }
                
                // Вариант Б: Игра шла (есть карты на столе), и остался всего 1 игрок
                if (game.discardPile.length > 0 && game.players.length < 2) {
                    const survivor = game.players[0];
                    if (survivor) {
                        io.to(roomId).emit('game_over', `${survivor.name} (остальные сбежали)`);
                    }
                    
                    setTimeout(() => {
                        game.stopTimer();
                        roomManager.rooms.delete(roomId);
                        broadcastRooms();
                    }, 5000);
                    return;
                }

                // Если игра ещё в лобби или игроков всё ещё много
                if (game.hostId === player.id) {
                    game.hostId = game.players[0]?.id || null;
                }
                
                io.to(roomId).emit('player_joined', getSafePlayers(game.players));
                broadcastRooms();
              }
            }, 60000);
      }
    })
    const getSafePlayers = (players: any[]) => {
      return players.map(p => {
        // Достаем disconnectTimeout, а всё остальное кладем в safePlayer
        const { disconnectTimeout, ...safePlayer } = p;
        return safePlayer; // Отправляем чистый объект
      });
    };
    // 
    socket.on('create_room', () => {
      const roomId = roomManager.createRoom();
      socket.join(roomId);
      socket.emit("room_created", roomId);
      console.log(`Комната ${roomId} создана игроком ${socket.id}`);
      broadcastRooms();
    })
    socket.on('join_room', (roomId, playerName, persistentId) => {
      const game = roomManager.getRoom(roomId);
      if(!game){
        socket.emit('error_event', 'Нет такой комнаты');
        return 
      }
      
      const player = game.addPlayer(socket.id, playerName, persistentId); 

      socket.join(roomId);
      io.to(roomId).emit('player_joined', getSafePlayers(game.players));

      console.log(`Игрок ${playerName} (${socket.id}) присоединился к комнате ${roomId}`);
      broadcastRooms(); 
      if (game.discardPile.length > 0) {

        socket.emit('your_cards', player.hand);
    
        socket.emit('game_started', {
          topCard: game.discardPile[game.discardPile.length - 1]!,
          currentPlayerId: game.players[game.currentPlayerIndex]?.id,
          turnEndTime: game.turnEndTime
        });
      }
    });
    socket.on('start_game', (roomId) => {
      const game = roomManager.getRoom(roomId);
      if (!game){
        return;
      }
      game.onTurnChange = () => {
        io.to(roomId).emit('game_started', {
            topCard: game.discardPile[game.discardPile.length - 1]!,
            currentPlayerId: game.players[game.currentPlayerIndex]?.id,
            turnEndTime: game.turnEndTime // Передаем время
        });
        for (const player of game.players) {
            io.to(player.id).emit('your_cards', player.hand);
        }
        io.to(roomId).emit('system_message', '⏰ Время вышло! Игрок пропустил ход.');
      };
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
        currentPlayerId: game.players[game.currentPlayerIndex]?.id,
        turnEndTime: game.turnEndTime
      });
    })
    socket.on('play_card', (roomId, cardIndex, declaredColor) => {
      const game = roomManager.getRoom(roomId);
      if (!game) return;
      
      try {
        game.playCard(socket.id, cardIndex, declaredColor);

        // --- НОВАЯ ФИШКА: ОПОВЕЩЕНИЕ О 2 КАРТАХ ---
        // Ищем игрока, который только что сделал ход
        const currentPlayer = game.players.find(p => p.id === socket.id);
        // Если у него после хода осталось ровно 2 карты:
        if (currentPlayer && currentPlayer.hand.length === 2) {
          // Рассылаем всем в комнате системное сообщение
          io.to(roomId).emit('system_message', `⚠️ Внимание! У игрока ${currentPlayer.name} осталось всего 2 карты!`);
        }
        // ------------------------------------------

        // Рассылаем состояние...
        io.to(roomId).emit('game_started', {
          topCard: game.discardPile[game.discardPile.length - 1]!,
          currentPlayerId: game.players[game.currentPlayerIndex]!.id,
          turnEndTime: game.turnEndTime
        });

        for (const player of game.players) {
          io.to(player.id).emit('your_cards', player.hand);
        }

        if (game.winner) {
          io.to(roomId).emit('game_over', game.winner.name);
          
          broadcastRooms(); 

          setTimeout(() => {
            game.stopTimer();
            roomManager.rooms.delete(roomId);
          }, 3000); 
        }
      } catch (err: any) {
        socket.emit('error_event', err.message);
      }
    });
    socket.on('draw_card', (roomId) => {
      const game = roomManager.getRoom(roomId);

      if (!game) return;

      try {
        game.drawCard(socket.id);

        io.to(roomId).emit('game_started', {
          topCard: game.discardPile[game.discardPile.length -1]!,
          currentPlayerId: game.players[game.currentPlayerIndex]!.id,
          turnEndTime: game.turnEndTime
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
    socket.on('surrender', (roomId) => {
      const game = roomManager.getRoom(roomId);
      if (!game) return;

      const player = game.players.find(p => p.id === socket.id);
      if (!player) return;

      console.log(`Игрок ${player.name} сдался. Завершаем игру в комнате ${roomId}`);

      // 1. Удаляем игрока из списка мгновенно (без таймаута)
      game.players = game.players.filter(p => p.id !== socket.id);

      // 2. Если остался один игрок или меньше — объявляем конец
      if (game.players.length <= 1) {
        const winnerName = game.players[0]?.name || "Никто (все сдались)";
        
        // Оповещаем оставшихся
        io.to(roomId).emit('game_over', `${winnerName} победил (оппонент сдался)`);
        
        // Мгновенно чистим комнату
        game.stopTimer();
        roomManager.deleteRoom(roomId);
        broadcastRooms();
      } else {
        
        if (game.hostId === socket.id) {
            game.hostId = game.players[0]?.id || null;
        }
        io.to(roomId).emit('player_joined', getSafePlayers(game.players));
        io.to(roomId).emit('system_message', `🏳️ Игрок ${player.name} сдался.`);
      }
    });

});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});