import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from "socket.io-client";
import './App.css';

const socket = io("http://localhost:3001");

// --- ЛОГИКА ВЕЧНОГО ID ---
// Генерируем уникальный ID для браузера и сохраняем навсегда
const getPersistentId = () => {
  let id = localStorage.getItem('uno_persistent_id');
  if (!id) {
    id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('uno_persistent_id', id);
  }
  return id;
};

const PERSISTENT_ID = getPersistentId();

interface Card {
  color: string;
  value: string;
}

interface Player {
  id: string;
  name: string;
  hand?: Card[];
  isOffline?: boolean;
  persistentId?: string;
}

interface RoomInfo {
  id: string;
  playersCount: number;
}

// --- ЧАТ ---
interface ChatMessage {
  messageId: string;
  roomId: string;
  senderName: string;
  text: string;
}

const Chat = ({ socket, roomId, playerName }: { socket: Socket, roomId: string, playerName: string }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [lastSentTime, setLastSentTime] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const handleNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (!isOpen && msg.senderName !== playerName) {
        setUnreadCount((prev) => prev + 1);
      }
    };
    const handleSpam = (err: { messageId: string, text: string }) => {
      alert(err.text);
      setMessages((prev) => prev.filter((m) => m.messageId !== err.messageId));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('spam_error', handleSpam);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('spam_error', handleSpam);
    };
  }, [socket, isOpen, playerName]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !roomId || !playerName) return;

    const now = Date.now();
    if (now - lastSentTime < 1000) {
      alert("Не так быстро! Подожди секунду.");
      return; 
    }

    setLastSentTime(now);

    const newMsg: ChatMessage = {
      messageId: Math.random().toString(36).substring(2, 9),
      roomId,
      senderName: playerName,
      text: chatInput.trim(),
    };

    setMessages((prev) => [...prev, newMsg]);
    socket.emit('send_message', newMsg);
    setChatInput('');
  };

  if (!roomId) return null;

  return (
    <>
      {!isOpen && (
        <div 
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);
          }}
          style={{
            position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px',
            background: '#4CAF50', borderRadius: '50%', display: 'flex', justifyContent: 'center',
            alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
            zIndex: 9999, transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span style={{ fontSize: '28px' }}>💬</span>
          {unreadCount > 0 && (
            <div style={{
              position: 'absolute', top: '-5px', right: '-5px', background: '#dc3545', color: 'white',
              borderRadius: '50%', width: '24px', height: '24px', display: 'flex', justifyContent: 'center',
              alignItems: 'center', fontSize: '12px', fontWeight: 'bold', border: '2px solid white'
            }}>
              {unreadCount}
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '30px', right: '30px', width: '350px', height: '450px',
          background: '#fff', borderRadius: '12px', display: 'flex', flexDirection: 'column',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 9999, overflow: 'hidden', fontFamily: 'sans-serif',
          border: '1px solid #ddd'
        }}>
          <div style={{ background: '#212529', color: '#fff', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Чат комнаты ({roomId})</span>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>✖</button>
          </div>

          <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8f9fa' }}>
            {messages.length === 0 && <p style={{ textAlign: 'center', color: '#adb5bd', fontSize: '14px', margin: 'auto' }}>Здесь пока тихо...</p>}
            {messages.map((msg) => {
              const isMine = msg.senderName === playerName;
              return (
                <div key={msg.messageId} style={{
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  background: isMine ? '#28a745' : '#e9ecef',
                  color: isMine ? '#fff' : '#212529',
                  padding: '10px 14px', borderRadius: '15px', 
                  borderBottomRightRadius: isMine ? '4px' : '15px',
                  borderBottomLeftRadius: !isMine ? '4px' : '15px',
                  fontSize: '15px', maxWidth: '85%', wordBreak: 'break-word',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  {!isMine && <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', color: '#6c757d', marginBottom: '4px' }}>{msg.senderName}</span>}
                  {msg.text}
                </div>
              );
            })}
          </div>

          <form onSubmit={sendMessage} style={{ display: 'flex', borderTop: '1px solid #dee2e6', background: 'white', padding: '12px' }}>
            <input 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Введите сообщение..."
              style={{ flex: 1, padding: '12px 15px', border: '1px solid #ced4da', borderRadius: '25px', outline: 'none', fontSize: '15px', background: '#f8f9fa', color: '#212529' }}
            />
            <button type="submit" style={{ background: '#28a745', color: '#fff', border: 'none', width: '45px', height: '45px', borderRadius: '50%', marginLeft: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' }}>➤</button>
          </form>
        </div>
      )}
    </>
  );
};

// --- ОСНОВНОЕ ПРИЛОЖЕНИЕ ---
function App() {
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  
  const [roomId, setRoomId] = useState<string>('');
  
  // Достаем имя из localStorage, чтобы не вводить после F5
  const [playerName, setPlayerName] = useState<string>(localStorage.getItem('uno_playerName') || '');
  const playerNameRef = useRef(playerName);
  
  const [players, setPlayers] = useState<Player[]>([]); 
  const [hostId, setHostId] = useState<string | null>(null);
  const [availableRooms, setAvailableRooms] = useState<RoomInfo[]>([]);

  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [topCard, setTopCard] = useState<Card | null>(null);
  const [currentPlayerTurn, setCurrentPlayerTurn] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);

  const [turnEndTime, setTurnEndTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  // Визуальный отсчет таймера
  useEffect(() => {
    if (!turnEndTime) return;

    const calculateTime = () => Math.max(0, Math.floor((turnEndTime - Date.now()) / 1000));

    const interval = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [turnEndTime]);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
      
      // АВТОРЕКОННЕКТ: Проверяем, был ли игрок в комнате до разрыва связи
      const savedRoomId = sessionStorage.getItem('uno_roomId');
      if (savedRoomId && playerNameRef.current) {
        setRoomId(savedRoomId);
        // Передаем PERSISTENT_ID на сервер
        socket.emit('join_room', savedRoomId, playerNameRef.current, PERSISTENT_ID);
      }
    });
    
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("available_rooms", (rooms: RoomInfo[]) => setAvailableRooms(rooms));
    
    socket.on("room_created", (code: string) => {
      setRoomId(code);
      setHostId(socket.id || null); 
      sessionStorage.setItem('uno_roomId', code); // Запоминаем комнату
      socket.emit('join_room', code, playerNameRef.current, PERSISTENT_ID);
    });

    socket.on("player_joined", (serverPlayers: Player[]) => setPlayers(serverPlayers));
    
    socket.on("error_event", (message: string) => {
      alert("Ошибка: " + message);
      // Если комната удалена или не существует, сбрасываем кэш
      if (message.includes("Нет такой комнаты")) {
        sessionStorage.removeItem('uno_roomId');
        setRoomId('');
      }
    });
    
    socket.on("your_cards", (cards: Card[]) => setMyCards(cards));

    socket.on("game_started", (data: { topCard: Card, currentPlayerId: string, turnEndTime?: number }) => {
      setTopCard(data.topCard);
      setCurrentPlayerTurn(data.currentPlayerId);
      if (data.turnEndTime) setTurnEndTime(data.turnEndTime);
      setIsGameStarted(true); 
    });

    socket.on("game_over", (winnerName: string) => {
      setWinner(winnerName);
      sessionStorage.removeItem('uno_roomId'); // Игра окончена, чистим сессию
    });
    
    socket.on("system_message", (msg: string) => {
      setSystemMessage(msg);
      setTimeout(() => setSystemMessage(null), 3000);
    });

    return () => {
      socket.off("connect"); socket.off("disconnect"); socket.off("available_rooms");
      socket.off("room_created"); socket.off("player_joined"); socket.off("error_event");
      socket.off("your_cards"); socket.off("game_started"); socket.off("game_over");
      socket.off("system_message");
    };
  }, []);

  const handleCreateRoom = () => {
    if (!playerName.trim()) return alert("Сначала введи свое имя!");
    localStorage.setItem('uno_playerName', playerName); // Сохраняем имя
    socket.emit('create_room');
  };

  const handleJoinRoom = (code: string) => {
    if (!playerName.trim()) return alert("Сначала введи свое имя!");
    localStorage.setItem('uno_playerName', playerName); // Сохраняем имя
    sessionStorage.setItem('uno_roomId', code); // Запоминаем комнату
    setRoomId(code);
    socket.emit('join_room', code, playerName, PERSISTENT_ID); // Отправляем ID
  };

  const handleJoinManual = () => {
    const code = prompt("Введите код комнаты:");
    if (code) handleJoinRoom(code);
  };

  const handleDrawCard = () => {
    if (currentPlayerTurn !== socket.id) return alert("Сейчас не твой ход!");
    socket.emit('draw_card', roomId);
  };

  const handleStartGame = () => socket.emit('start_game', roomId);

  const handlePlayCard = (index: number) => {
    if (currentPlayerTurn !== socket.id) return alert("Сейчас не твой ход!");
    const card = myCards[index];
    let declaredColor: string | undefined = undefined;

    if (card.color === 'black') {
      const input = prompt("Выбери цвет: red, blue, green или yellow");
      if (input && ['red', 'blue', 'green', 'yellow'].includes(input.toLowerCase())) {
        declaredColor = input.toLowerCase();
      } else {
        return alert("Неверный цвет, ход отменен!");
      }
    }
    socket.emit('play_card', roomId, index, declaredColor);
  };

  const handleCallUno = () => socket.emit('call_uno', roomId);
  const handleCatchUno = () => socket.emit('catch_uno', roomId);

const handleGoHome = () => {
    if (window.confirm("Вы точно хотите сдаться? Игра закончится для всех.")) {
      // 1. Отправляем специальное событие сдачи
      socket.emit('surrender', roomId);
      
      // 2. Очищаем комнату из памяти браузера, чтобы реконнект не сработал
      sessionStorage.removeItem('uno_roomId');
      
      // 3. Перезагружаем
      window.location.reload(); 
    }
  };

  const isJoinedRoom = players.some((p) => p.id === socket.id || p.persistentId === PERSISTENT_ID);

  const backgroundStyle = isGameStarted 
    ? 'radial-gradient(circle at center, #2e7d32 0%, #1b5e20 100%)' 
    : '#f4f6f9';

  return (
    <div style={{ 
      position: 'absolute', top: 0, left: 0, right: 0, 
      margin: 0, padding: 0, boxSizing: 'border-box', fontFamily: 'sans-serif', 
      minHeight: '100vh', width: '100vw', background: backgroundStyle, color: isGameStarted ? '#fff' : '#333',
      transition: 'background 0.5s ease', overflowX: 'hidden', overflowY: 'auto'
    }}>
      
      {systemMessage && (
        <div style={{
          position: 'fixed', top: '30px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.9)', color: 'white', padding: '15px 40px',
          borderRadius: '50px', fontSize: '20px', fontWeight: 'bold', zIndex: 10000,
          boxShadow: '0 8px 25px rgba(0,0,0,0.4)', border: '2px solid #fff'
        }}>
          {systemMessage}
        </div>
      )}

      {!isGameStarted && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <h1 style={{ margin: 0, color: '#dc3545', fontSize: '28px', fontWeight: '900', letterSpacing: '1px' }}>UNO ONLINE</h1>
          <span style={{ fontWeight: 'bold', fontSize: '16px', color: isConnected ? '#28a745' : '#dc3545', padding: '8px 15px', background: isConnected ? '#e8f5e9' : '#f8d7da', borderRadius: '20px' }}>
            {isConnected ? '🟢 Server Online' : '🔴 Server Offline'}
          </span>
        </div>
      )}

      <div style={{ padding: isGameStarted ? '0' : '40px' }}>
        
        {!isJoinedRoom ? (
          // ==========================================
          // ЭКРАН 1: ГЛАВНОЕ МЕНЮ
          // ==========================================
          <div style={{ display: 'flex', gap: '40px', maxWidth: '1200px', margin: '0 auto', alignItems: 'flex-start' }}>
            <div style={{ flex: '1', background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
              <h2 style={{ marginTop: 0, fontSize: '28px', color: '#212529', marginBottom: '30px' }}>Подключение к игре</h2>
              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#495057', fontSize: '16px' }}>Ваш никнейм:</label>
                <input 
                  placeholder="Введите имя..." value={playerName} onChange={(e) => setPlayerName(e.target.value)} 
                  style={{ width: '100%', padding: '15px', fontSize: '18px', borderRadius: '8px', border: '2px solid #e9ecef', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <button onClick={handleCreateRoom} style={{ padding: '18px', fontSize: '18px', fontWeight: 'bold', background: '#007BFF', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,123,255,0.3)' }}>➕ Создать новую комнату</button>
                <button onClick={handleJoinManual} style={{ padding: '18px', fontSize: '18px', fontWeight: 'bold', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🔑 Войти по коду вручную</button>
              </div>
            </div>

            <div style={{ flex: '1', background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', minHeight: '400px' }}>
              <h2 style={{ marginTop: 0, fontSize: '28px', color: '#212529', marginBottom: '30px' }}>Открытые комнаты</h2>
              {availableRooms.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px', color: '#adb5bd', fontSize: '18px', border: '2px dashed #dee2e6' }}>Сейчас нет активных игр.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                  {availableRooms.map((room) => (
                    <div key={room.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '10px' }}>
                      <div>
                        <div style={{ fontSize: '20px', color: '#212529', fontWeight: 'bold', marginBottom: '5px' }}>Комната: {room.id}</div>
                        <div style={{ fontSize: '15px', color: '#6c757d' }}>Игроков внутри: <b>{room.playersCount}</b></div>
                      </div>
                      <button onClick={() => handleJoinRoom(room.id)} style={{ background: '#28a745', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>Войти</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        ) : !isGameStarted ? (
          // ==========================================
          // ЭКРАН 2: ЛОББИ КОМНАТЫ
          // ==========================================
          <div style={{ maxWidth: '900px', margin: '0 auto', background: 'white', padding: '50px', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f8f9fa', paddingBottom: '20px', marginBottom: '30px' }}>
              <h2 style={{ margin: 0, fontSize: '32px', color: '#212529' }}>Ожидание игроков</h2>
              <div style={{ background: '#e9ecef', padding: '10px 20px', borderRadius: '8px', fontSize: '20px', color: '#495057' }}>
                Код комнаты: <b style={{ color: '#007BFF', fontSize: '26px', marginLeft: '10px', letterSpacing: '2px' }}>{roomId}</b>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '40px' }}>
              <div style={{ flex: '2' }}>
                <h3 style={{ color: '#6c757d', marginBottom: '15px', fontSize: '20px' }}>Список участников ({players.length}):</h3>
                <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '12px', padding: '10px' }}>
                  {players.map((p) => (
                    <div key={p.id} style={{ padding: '15px 20px', fontSize: '20px', borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', color: '#212529', opacity: p.isOffline ? 0.5 : 1 }}>
                      <span style={{ fontSize: '24px', marginRight: '15px' }}>{p.isOffline ? '👻' : '👤'}</span>
                      <span style={{ fontWeight: p.id === socket.id ? 'bold' : 'normal', flex: 1 }}>{p.name} {p.id === socket.id ? '(Вы)' : ''} {p.isOffline ? ' [Отключился]' : ''}</span>
                      {p.id === hostId && <span style={{ background: '#ffc107', color: '#000', fontSize: '12px', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>ХОСТ</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
                {socket.id === hostId ? (
                  <button onClick={handleStartGame} disabled={players.length < 2} style={{ padding: '20px', fontSize: '20px', background: players.length < 2 ? '#6c757d' : '#28a745', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: players.length < 2 ? 'not-allowed' : 'pointer' }}>▶ Начать игру</button>
                ) : (
                  <div style={{ padding: '20px', fontSize: '18px', textAlign: 'center', color: '#856404', background: '#fff3cd', borderRadius: '12px', border: '2px solid #ffeeba', fontWeight: 'bold' }}>⏳ Ждем запуска хостом...</div>
                )}
                <button onClick={handleGoHome} style={{ padding: '15px', fontSize: '18px', background: 'transparent', color: '#dc3545', border: '2px solid #dc3545', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Покинуть комнату</button>
              </div>
            </div>
          </div>

        ) : winner ? (
          // ==========================================
          // ЭКРАН 3: ЭКРАН ПОБЕДЫ
          // ==========================================
          <div style={{ textAlign: 'center', marginTop: '15vh' }}>
            <h1 style={{ fontSize: '80px', color: '#ffd700', textShadow: '0 5px 15px rgba(0,0,0,0.5)', margin: '0 0 20px 0' }}>🏆 ПОБЕДА! 🏆</h1>
            <h2 style={{ fontSize: '40px', color: '#fff', margin: '0 0 40px 0' }}>Победитель: <b style={{ background: '#fff', color: '#212529', padding: '5px 20px', borderRadius: '10px' }}>{winner}</b></h2>
            <button onClick={() => window.location.reload()} style={{ padding: '20px 40px', fontSize: '24px', fontWeight: 'bold', background: '#007BFF', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 8px 25px rgba(0,123,255,0.5)' }}>В главное меню</button>
          </div>

        ) : (
          // ==========================================
          // ЭКРАН 4: ИГРОВОЙ СТОЛ
          // ==========================================
          <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px', boxSizing: 'border-box', position: 'relative' }}>
            
            <button onClick={handleGoHome} style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(220,53,69,0.8)', color: 'white', border: '2px solid #fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>🏳️ Сдаться</button>

            {/* ВЕРХНЯЯ ЗОНА: ОППОНЕНТЫ */}
            <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', gap: '30px', paddingTop: '10px' }}>
              {players.map((p) => (
                <div key={p.id} style={{
                  padding: '15px 30px', borderRadius: '12px',
                  background: p.id === currentPlayerTurn ? '#ffeb3b' : 'rgba(255,255,255,0.1)',
                  color: p.id === currentPlayerTurn ? '#000' : '#fff',
                  fontWeight: 'bold', border: '2px solid ' + (p.id === socket.id ? '#fff' : 'rgba(255,255,255,0.3)'),
                  boxShadow: p.id === currentPlayerTurn ? '0 0 30px rgba(255,235,59,0.6)' : 'none',
                  fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px',
                  opacity: p.isOffline ? 0.5 : 1
                }}>
                  {p.isOffline ? '👻' : '👤'} {p.name} {p.id === socket.id ? '(Вы)' : ''} {p.isOffline ? '[АФК]' : ''}
                </div>
              ))}
            </div>

            {/* ЦЕНТРАЛЬНАЯ ЗОНА */}
            <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
              
              {/* ВИЗУАЛЬНЫЙ ТАЙМЕР */}
              {turnEndTime && (
                <div style={{ 
                  background: timeLeft <= 5 ? '#dc3545' : '#ffc107', 
                  color: timeLeft <= 5 ? 'white' : 'black', 
                  padding: '10px 30px', borderRadius: '30px', fontSize: '24px', fontWeight: 'bold', 
                  boxShadow: timeLeft <= 5 ? '0 0 20px rgba(220,53,69,0.8)' : '0 4px 10px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s', zIndex: 10
                }}>
                  ⏳ Время на ход: {timeLeft} сек.
                </div>
              )}

              <div style={{ display: 'flex', gap: '80px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   {myCards.length <= 2 && (
                    <button onClick={handleCallUno} style={{ background: '#fd7e14', color: 'white', padding: '20px 40px', fontWeight: '900', fontSize: '24px', border: '3px solid #fff', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(253,126,20,0.6)', transform: 'rotate(-5deg)' }}>
                      КРИЧАТЬ "УНО!"
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '40px', background: 'rgba(0,0,0,0.2)', padding: '40px 60px', borderRadius: '24px', border: '2px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)' }}>
                  <div>
                    <h3 style={{ textAlign: 'center', margin: '0 0 15px 0', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '2px' }}>На столе</h3>
                    {topCard ? (
                      <div style={{ 
                        padding: '60px 30px', border: `8px solid ${topCard.color === 'black' ? '#333' : topCard.color}`, 
                        width: '120px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '16px', fontWeight: '900', fontSize: '64px', background: '#fff', color: topCard.color === 'black' ? '#000' : topCard.color,
                        boxShadow: '0 15px 35px rgba(0,0,0,0.5)', textShadow: '1px 1px 0 rgba(0,0,0,0.1)'
                      }}>
                        {topCard.value}
                      </div>
                    ) : <div style={{ width: '120px', height: '180px', border: '4px dashed rgba(255,255,255,0.3)', borderRadius: '16px' }}></div>}
                  </div>

                  <div>
                    <h3 style={{ textAlign: 'center', margin: '0 0 15px 0', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '2px' }}>Колода</h3>
                    <div onClick={handleDrawCard} style={{ 
                        padding: '60px 30px', background: '#111', color: '#dc3545', border: `8px solid #fff`, 
                        width: '120px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '16px', fontWeight: '900', fontSize: '32px', cursor: 'pointer', userSelect: 'none',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.5)', backgroundImage: 'radial-gradient(#333 15%, transparent 16%)', backgroundSize: '10px 10px'
                      }}>
                      UNO
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   <button onClick={handleCatchUno} style={{ background: '#dc3545', color: 'white', padding: '20px 40px', fontWeight: '900', fontSize: '20px', border: '3px solid #fff', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(220,53,69,0.6)', transform: 'rotate(5deg)' }}>
                    ПОЙМАТЬ<br/>НАРУШИТЕЛЯ
                  </button>
                </div>
              </div>
            </div>

            {/* НИЖНЯЯ ЗОНА: РУКА ИГРОКА */}
            <div style={{ flex: '0 0 auto', padding: '20px', background: 'rgba(0,0,0,0.4)', borderRadius: '24px 24px 0 0', borderTop: '2px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {myCards.map((card, index) => (
                  <div key={index} onClick={() => handlePlayCard(index)} style={{ 
                      padding: '40px 15px', border: `6px solid ${card.color === 'black' ? '#333' : card.color}`, 
                      width: '80px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '12px', fontWeight: '900', fontSize: '42px', cursor: 'pointer',
                      background: '#fff', color: card.color === 'black' ? '#000' : card.color,
                      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 5px 15px rgba(0,0,0,0.4)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-30px) scale(1.1)'; e.currentTarget.style.zIndex = '10'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.zIndex = '1'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.4)'; }}
                  >
                    {card.value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {isJoinedRoom && <Chat socket={socket} roomId={roomId} playerName={playerName} />}
    </div>
  );
}

export default App;