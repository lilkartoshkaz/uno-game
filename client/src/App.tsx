import {useEffect, useState} from 'react';
import {io} from "socket.io-client";
import './App.css';


// Подключаемся к серверу
const socket = io("http://localhost:3001");


interface Card {
  color: string;
  value: string;
}

interface Player {
  id: string;
  name: string;
  hand?: Card[];
}

function App() {
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  
  // Лобби
  const [roomId, setRoomId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]); 
  const [hostId, setHostId] = useState<string | null>(null);

  // Игра
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [topCard, setTopCard] = useState<Card | null>(null);
  const [currentPlayerTurn, setCurrentPlayerTurn] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("room_created", (code: string) => {
      setRoomId(code);
      setHostId(socket.id || null); 
    });

    socket.on("player_joined", (serverPlayers: Player[]) => {
      setPlayers(serverPlayers);
    });

    socket.on("error_event", (message: string) => {
      alert("Ошибка: " + message);
    });

    socket.on("your_cards", (cards: Card[]) => {
      setMyCards(cards);
    });

    socket.on("game_started", (data: { topCard: Card, currentPlayerId: string }) => {
      setTopCard(data.topCard);
      setCurrentPlayerTurn(data.currentPlayerId);
      setIsGameStarted(true); 
    });

    // Слушаем завершение игры
    socket.on("game_over", (winnerName: string) => {
      setWinner(winnerName);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room_created");
      socket.off("player_joined");
      socket.off("error_event");
      socket.off("your_cards");
      socket.off("game_started");
      socket.off("game_over");
    };
  }, []);

  const handleCreateRoom = () => socket.emit('create_room');

  const handleJoinRoom = () => {
    if (!playerName || !roomId) {
      alert("Введи имя и код комнаты!");
      return;
    }
    socket.emit('join_room', roomId, playerName);
  };
  const handleDrawCard = () => {
    if (currentPlayerTurn !== socket.id) {
      alert("Сейчас не твой ход!");
      return;
    }
    socket.emit('draw_card', roomId);
  };

  const handleStartGame = () => socket.emit('start_game', roomId);

  // Логика броска карты
  const handlePlayCard = (index: number) => {
    // Не даем спамить сервер, если не твой ход
    if (currentPlayerTurn !== socket.id) {
      alert("Сейчас не твой ход!");
      return;
    }

    const card = myCards[index];
    let declaredColor: string | undefined = undefined;

    // Если карта черная, требуем выбрать цвет
    if (card.color === 'black') {
      const input = prompt("Выбери цвет: red, blue, green или yellow");
      if (input && ['red', 'blue', 'green', 'yellow'].includes(input.toLowerCase())) {
        declaredColor = input.toLowerCase();
      } else {
        alert("Неверный цвет, ход отменен!");
        return; // Отменяем ход, если игрок ввел ерунду
      }
    }

    // Отправляем ход на сервер
    socket.emit('play_card', roomId, index, declaredColor);
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>UNO Game Client</h1>
      <h3>Status: {isConnected ? '🟢 ONLINE' : '🔴 OFFLINE'}</h3>
      <hr />

      {!isGameStarted ? (
        // --- ЭКРАН 1: ЛОББИ ---
        <div>
          <h2>Лобби</h2>
          <div style={{ marginBottom: 20 }}>
            <button onClick={handleCreateRoom} style={{ padding: '10px', marginRight: '10px' }}>Создать новую комнату</button>
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
            <button onClick={handleJoinRoom} style={{ padding: '10px' }}>Войти в комнату</button>
          </div>
          <hr />
          <h3>Игроки в комнате:</h3>
          {players.length === 0 ? <p>Пока никого нет...</p> : <ul>{players.map((p, i) => <li key={i}>{p.name}</li>)}</ul>}
          
          {socket.id === hostId && players.length > 1 && (
            <div style={{ marginTop: 20 }}>
              <button onClick={handleStartGame} style={{ padding: '15px 30px', background: 'green', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                НАЧАТЬ ИГРУ
              </button>
            </div>
          )}
        </div>
      ) : winner ? (
        // --- ЭКРАН 2: ПОБЕДА ---
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h1 style={{ fontSize: '48px', color: 'gold' }}>🏆 ИГРА ОКОНЧЕНА 🏆</h1>
          <h2>Победитель: {winner}</h2>
        </div>
      ) : (
        // --- ЭКРАН 3: ИГРОВОЙ СТОЛ ---
        <div>
          <h2 style={{ color: 'green' }}>Игра началась! Код комнаты: {roomId}</h2>
          <h3 style={{ background: '#0a0707', padding: 10 }}>
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
          {/* НОВАЯ КНОПКА КОЛОДЫ */}
            <div>
              <h3>Колода:</h3>
              <div 
                onClick={handleDrawCard}
                style={{ 
                  padding: '30px', 
                  background: '#222', // Черная рубашка колоды
                  color: 'white',
                  border: `5px solid #000`, 
                  width: '100px', 
                  textAlign: 'center',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Взять карту
              </div>
            </div>

          <div>
            <h3>Твоя рука ({myCards.length} карт):</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {myCards.map((card, index) => (
                <div 
                  key={index} 
                  onClick={() => handlePlayCard(index)} // Вешаем клик сюда
                  style={{ 
                    padding: '20px', 
                    border: `3px solid ${card.color === 'black' ? '#333' : card.color}`, 
                    width: '60px', 
                    textAlign: 'center',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'transform 0.1s' // легкая анимация при наведении
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
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