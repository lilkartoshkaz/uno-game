import { useEffect, useState, useRef } from 'react';
import { io } from "socket.io-client";
import './App.css';
import { type Card, type Player, type RoomInfo } from './types';
import { PERSISTENT_ID } from './utils';
import { Chat } from './components/Chat';
import { AlertModal, ColorPickerModal } from './components/Modals';
import { MainMenu, Lobby, GameBoard, VictoryScreen } from './components/Screens';
import { LoadingScreen } from './components/LoadingScreen';
import { translations, type Language } from './i18n';

const socket = io("http://localhost:3001");

function App() {
  // --- ОБЪЯВЛЯЕМ ЯЗЫК И ПЕРЕМЕННУЮ t ПРЯМО ЗДЕСЬ ---
  const [lang, setLang] = useState<Language>('ru'); 
  const t = translations[lang];

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const [roomId, setRoomId] = useState<string>('');
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
  const [customAlert, setCustomAlert] = useState<string | null>(null);
  const [colorPicker, setColorPicker] = useState<{ isOpen: boolean, cardIndex: number | null }>({ isOpen: false, cardIndex: null });

  // Функция перевода серверных ошибок
  const translateError = (msg: string) => {
    if (msg.includes("Нет такой комнаты")) return t.errors.noRoom;
    if (msg.includes("Сначала введи свое имя!")) return t.errors.enterName;
    if (msg.includes("Сейчас не твой ход!")) return t.errors.notYourTurn;
    if (msg.includes("Неверный цвет, ход отменен!")) return t.errors.invalidColor;
    if (msg.includes("Только создатель может начать игру")) return t.errors.onlyHostStart;
    if (msg.includes("Недостаточно игроков")) return t.errors.notEnoughPlayers;
    return msg; 
  };

  const showError = (msg: string) => setCustomAlert(translateError(msg));

  useEffect(() => { playerNameRef.current = playerName; }, [playerName]);

  useEffect(() => {
    if (!turnEndTime) return;
    const calculateTime = () => Math.max(0, Math.floor((turnEndTime - Date.now()) / 1000));
    const interval = setInterval(() => setTimeLeft(calculateTime()), 1000);
    return () => clearInterval(interval);
  }, [turnEndTime]);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
      const savedRoomId = sessionStorage.getItem('uno_roomId');
      if (savedRoomId && playerNameRef.current) {
        setIsLoading(true);
        setRoomId(savedRoomId);
        socket.emit('join_room', savedRoomId, playerNameRef.current, PERSISTENT_ID);
      }
    });
    
    socket.on("disconnect", () => setIsConnected(false));
    
    socket.on("available_rooms", (rooms: RoomInfo[]) => {
      setAvailableRooms(rooms);
      if (!sessionStorage.getItem('uno_roomId')) {
        setTimeout(() => setIsLoading(false), 800);
      }
    });
    
    socket.on("room_created", (code: string) => {
      setRoomId(code); 
      setHostId(socket.id || null); 
      sessionStorage.setItem('uno_roomId', code); 
      socket.emit('join_room', code, playerNameRef.current, PERSISTENT_ID);
    });

    socket.on("player_joined", (serverPlayers: Player[]) => {
      setPlayers(serverPlayers);
      setTimeout(() => setIsLoading(false), 1200); 
    });
    
    socket.on("error_event", (message: string) => {
      showError(message);
      setIsLoading(false);
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
      setTimeout(() => setIsLoading(false), 1500); 
    });

    socket.on("game_over", (winnerName: string) => {
      setWinner(winnerName); 
      sessionStorage.removeItem('uno_roomId'); 
      setIsLoading(false);
    });
    
    socket.on("system_message", (msg: string) => {
      setSystemMessage(msg); 
      setTimeout(() => setSystemMessage(null), 3000);
    });

    return () => {
      socket.off("connect"); socket.off("disconnect"); socket.off("available_rooms");
      socket.off("room_created"); socket.off("player_joined"); socket.off("error_event");
      socket.off("your_cards"); socket.off("game_started"); socket.off("game_over"); socket.off("system_message");
    };
  }, [lang]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) return showError("Сначала введи свое имя!");
    setIsLoading(true);
    localStorage.setItem('uno_playerName', playerName); 
    socket.emit('create_room');
  };

  const handleJoinRoom = (code: string) => {
    if (!playerName.trim()) return showError("Сначала введи свое имя!");
    setIsLoading(true);
    localStorage.setItem('uno_playerName', playerName); 
    sessionStorage.setItem('uno_roomId', code); 
    setRoomId(code); 
    socket.emit('join_room', code, playerName, PERSISTENT_ID); 
  };

  const handleJoinManual = () => { 
    const code = window.prompt(t.enterCode); 
    if (code) handleJoinRoom(code); 
  };

  const handleDrawCard = () => { 
    if (currentPlayerTurn !== socket.id) return showError("Сейчас не твой ход!"); 
    socket.emit('draw_card', roomId); 
  };

  const handleStartGame = () => {
    setIsLoading(true);
    socket.emit('start_game', roomId);
  };
  
  const handlePlayCard = (index: number) => {
    if (currentPlayerTurn !== socket.id) return showError("Сейчас не твой ход!");
    if (myCards[index].color === 'black') return setColorPicker({ isOpen: true, cardIndex: index });
    socket.emit('play_card', roomId, index, undefined);
  };

  const handleColorSelect = (color: string) => {
    if (colorPicker.cardIndex !== null) {
      socket.emit('play_card', roomId, colorPicker.cardIndex, color);
      socket.emit('send_message', { messageId: Math.random().toString(), roomId, senderName: 'Система', text: `Игрок ${playerName} заказал цвет: ${color.toUpperCase()}` });
    }
    setColorPicker({ isOpen: false, cardIndex: null });
  };

  const handleCallUno = () => socket.emit('call_uno', roomId);
  const handleCatchUno = () => socket.emit('catch_uno', roomId);
  
  const handleGoHome = () => {
    if (window.confirm(t.surrenderConfirm)) {
      setIsLoading(true);
      socket.emit('surrender', roomId); 
      sessionStorage.removeItem('uno_roomId'); 
      window.location.reload(); 
    }
  };

  const isJoinedRoom = players.some((p) => p.id === socket.id || p.persistentId === PERSISTENT_ID);
  const backgroundStyle = isGameStarted ? 'radial-gradient(circle at center, #2e7d32 0%, #1b5e20 100%)' : 'radial-gradient(circle at center, #1e242c 0%, #0b0d10 100%)';

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, margin: 0, padding: 0, boxSizing: 'border-box', fontFamily: 'sans-serif', minHeight: '100vh', width: '100vw', background: backgroundStyle, color: isGameStarted ? '#fff' : '#333', transition: 'background 0.5s ease', overflowX: 'hidden', overflowY: 'auto' }}>
      {customAlert && <AlertModal message={customAlert} onClose={() => setCustomAlert(null)} />}
      {colorPicker.isOpen && <ColorPickerModal onSelect={handleColorSelect} onCancel={() => setColorPicker({isOpen: false, cardIndex: null})} />}
      
      {systemMessage && (
        <div style={{ position: 'fixed', top: '30px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0, 0, 0, 0.9)', color: 'white', padding: '15px 40px', borderRadius: '50px', fontSize: '20px', fontWeight: 'bold', zIndex: 10000, border: '2px solid #fff' }}>{systemMessage}</div>
      )}

      {!isGameStarted && (
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          padding: '20px 40px', background: 'rgba(20, 30, 45, 0.5)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)' 
        }}>
          <img src="/logo.png" alt="UNO Logo" style={{ height: '50px', transform: 'scale(6.2)', transformOrigin: 'left center', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(255, 165, 0, 0.3))' }} />
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '5px', background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '12px' }}>
              {(['ru', 'en', 'cs'] as Language[]).map(l => (
                <button 
                  key={l} 
                  onClick={() => setLang(l)} 
                  style={{ background: lang === l ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', color: 'white', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', transition: '0.3s' }}
                >
                  {l}
                </button>
              ))}
            </div>

            <span style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: isConnected ? '#4dd46b' : '#ff6b6b', padding: '10px 20px', background: isConnected ? 'rgba(40,167,69,0.1)' : 'rgba(220,53,69,0.1)', border: isConnected ? '1px solid rgba(40,167,69,0.3)' : '1px solid rgba(220,53,69,0.3)', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
              {isConnected ? t.serverOnline : t.serverOffline}
            </span>
          </div>
        </div>
      )}

      <div style={{ padding: isGameStarted ? '0' : '40px' }}>
        {!isJoinedRoom ? (
          <MainMenu playerName={playerName} setPlayerName={setPlayerName} handleCreateRoom={handleCreateRoom} handleJoinManual={handleJoinManual} availableRooms={availableRooms} handleJoinRoom={handleJoinRoom} t={t} />
        ) : !isGameStarted ? (
          <Lobby roomId={roomId} players={players} hostId={hostId} socketId={socket.id} handleStartGame={handleStartGame} handleGoHome={handleGoHome} t={t} />
        ) : winner ? (
          <VictoryScreen winner={winner} t={t} />
        ) : (
          <GameBoard turnEndTime={turnEndTime} timeLeft={timeLeft} myCards={myCards} topCard={topCard} players={players} currentPlayerTurn={currentPlayerTurn} socketId={socket.id} handleCallUno={handleCallUno} handleCatchUno={handleCatchUno} handleDrawCard={handleDrawCard} handlePlayCard={handlePlayCard} handleGoHome={handleGoHome} t={t} />
        )}
      </div>

      {isJoinedRoom && <Chat socket={socket} roomId={roomId} playerName={playerName} onError={showError} t={t} />}
      <LoadingScreen isVisible={isLoading} />
    </div>
  );
}

export default App;