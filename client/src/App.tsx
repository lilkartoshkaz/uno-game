import {useEffect, useState} from 'react';
import {io} from "socket.io-client";
import './App.css';


// Подключаемся к серверу
const socket = io("http://localhost:3001");

// Описываем форму данных для Карты
interface Card {
  color: string;
  value: string;
}

// Описываем форму данных для Игрока (избавляемся от any)
interface Player {
  id: string;
  name: string;
  hand?: Card[]; // Знак вопроса означает, что массива hand может не быть (например, в лобби)
}

function App() {
  // --- СОСТОЯНИЯ ---
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  
  // Данные лобби
  const [roomId, setRoomId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  // Строго указываем, что здесь будет массив объектов Player
  const [players, setPlayers] = useState<Player[]>([]); 
  const [hostId, setHostId] = useState<string | null>(null);

  // Данные игры
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [topCard, setTopCard] = useState<Card | null>(null);
  const [currentPlayerTurn, setCurrentPlayerTurn] = useState<string | null>(null);

  useEffect(() => {
    // 1. Базовые события сети
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    // 2. Создание комнаты
    socket.on("room_created", (code: string) => {
      setRoomId(code);
      setHostId(socket.id || null); 
    });

    // 3. Обновление списка игроков (строгий тип Player[])
    socket.on("player_joined", (serverPlayers: Player[]) => {
      setPlayers(serverPlayers);
    });

    // 4. Ошибки
    socket.on("error_event", (message: string) => {
      alert("Ошибка: " + message);
    });

    // 5. Раздача личных карт
    socket.on("your_cards", (cards: Card[]) => {
      setMyCards(cards);
    });

    // 6. Старт игры
    socket.on("game_started", (data: { topCard: Card, currentPlayerId: string }) => {
      setTopCard(data.topCard);
      setCurrentPlayerTurn(data.currentPlayerId);
      setIsGameStarted(true); 
    });

    // Очистка при размонтировании
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room_created");
      socket.off("player_joined");
      socket.off("error_event");
      socket.off("your_cards");
      socket.off("game_started");
    };
  }, []);

  // --- ДЕЙСТВИЯ (КНОПКИ) ---
  const handleCreateRoom = () => {
    socket.emit('create_room');
  };

  const handleJoinRoom = () => {
    if (!playerName || !roomId) {
      alert("Введи имя и код комнаты!");
      return;
    }
    socket.emit('join_room', roomId, playerName);
  };

  const handleStartGame = () => {
    socket.emit('start_game', roomId);
  };

  // --- ИНТЕРФЕЙС ---
  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>UNO Game Client</h1>
      <h3>Status: {isConnected ? '🟢 ONLINE' : '🔴 OFFLINE'}</h3>
      <hr />

      {!isGameStarted ? (
        <div>
          <h2>Лобби</h2>
          
          <div style={{ marginBottom: 20 }}>
            <button onClick={handleCreateRoom} style={{ padding: '10px', marginRight: '10px' }}>
              Создать новую комнату
            </button>
          </div>

          <div style={{ marginBottom: 20 }}>
            <input 
              placeholder="Твое имя" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)} 
              style={{ padding: '10px', marginRight: '10px' }}
            />
            <input 
              placeholder="Код комнаты" 
              value={roomId} 
              onChange={(e) => setRoomId(e.target.value)} 
              style={{ padding: '10px', marginRight: '10px' }}
            />
            <button onClick={handleJoinRoom} style={{ padding: '10px' }}>
              Войти в комнату
            </button>
          </div>

          <hr />

          <h3>Игроки в комнате:</h3>
          {players.length === 0 ? (
            <p>Пока никого нет...</p>
          ) : (
            <ul>
              {players.map((p, index) => (
                // Теперь TypeScript точно знает, что у p есть свойство name
                <li key={index}>{p.name}</li>
              ))}
            </ul>
          )}

          {socket.id === hostId && players.length > 1 && (
            <div style={{ marginTop: 20 }}>
              <button 
                onClick={handleStartGame} 
                style={{ padding: '15px 30px', background: 'green', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                НАЧАТЬ ИГРУ
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 style={{ color: 'green' }}>Игра началась! Код комнаты: {roomId}</h2>
          
          <h3 style={{ background: '#eee', padding: 10 }}>
            Сейчас ходит: {currentPlayerTurn === socket.id ? '👉 ТЫ 👈' : 'Другой игрок'}
          </h3>

          <hr />

          <div style={{ marginBottom: 30 }}>
            <h3>На столе:</h3>
            {topCard && (
              <div style={{ 
                padding: '30px', 
                border: `5px solid ${topCard.color === 'black' ? '#333' : topCard.color}`, 
                width: '100px', 
                textAlign: 'center',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '24px'
              }}>
                {topCard.value}
              </div>
            )}
          </div>

          <div>
            <h3>Твоя рука ({myCards.length} карт):</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {myCards.map((card, index) => (
                <div key={index} style={{ 
                  padding: '20px', 
                  border: `3px solid ${card.color === 'black' ? '#333' : card.color}`, 
                  width: '60px', 
                  textAlign: 'center',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>
                  {card.value}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;