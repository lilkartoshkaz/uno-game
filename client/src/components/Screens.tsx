import React from 'react';
import { type Card, type Player, type RoomInfo } from '../types';
import { getCardImage } from '../utils';
import { FaPlus, FaKey, FaBoxOpen } from 'react-icons/fa';
import { translations } from '../i18n';

type TranslationType = typeof translations['ru'];

interface MainMenuProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  handleCreateRoom: () => void;
  handleJoinManual: () => void;
  availableRooms: RoomInfo[];
  handleJoinRoom: (code: string) => void;
  t: TranslationType;
}

export const MainMenu: React.FC<MainMenuProps> = ({ playerName, setPlayerName, handleCreateRoom, handleJoinManual, availableRooms, handleJoinRoom, t }) => (
  <>
    <style>
      {`
        @keyframes slideUpSmooth { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popInRoom { from { opacity: 0; transform: scale(0.9) translateX(-20px); } to { opacity: 1; transform: scale(1) translateX(0); } }
        .modern-input:focus { border-color: #007BFF !important; box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.25) !important; transform: translateY(-2px); }
        .room-card:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.2); border-color: rgba(0, 123, 255, 0.5) !important; background: rgba(255, 255, 255, 0.1) !important; }
        .btn-primary { background: linear-gradient(135deg, #007BFF 0%, #0056b3 100%); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0, 123, 255, 0.4); }
        .btn-secondary { background: rgba(255, 255, 255, 0.05); color: #fff; border: 1px solid rgba(255, 255, 255, 0.2); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2); border-color: rgba(255, 255, 255, 0.4); }
      `}
    </style>

    <div style={{ display: 'flex', gap: '40px', maxWidth: '1200px', margin: '0 auto', alignItems: 'flex-start', paddingBottom: '50px' }}>
      <div style={{ flex: '1', padding: '50px', borderRadius: '24px', background: 'rgba(20, 30, 45, 0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', animation: 'slideUpSmooth 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
        <h2 style={{ marginTop: 0, fontSize: '32px', marginBottom: '40px', fontWeight: '900', letterSpacing: '-0.5px' }}>{t.startTitle}</h2>
        <div style={{ marginBottom: '40px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold', color: '#adb5bd', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t.nicknameLabel}</label>
          <input className="modern-input" placeholder="..." value={playerName} onChange={(e) => setPlayerName(e.target.value)} style={{ width: '100%', padding: '18px 20px', fontSize: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0, 0, 0, 0.3)', color: 'white', boxSizing: 'border-box', outline: 'none', transition: 'all 0.3s ease', fontWeight: '600' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <button className="btn-primary" onClick={handleCreateRoom} style={{ padding: '20px', fontSize: '18px', fontWeight: '800', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}><FaPlus size={20} /> {t.createRoom}</button>
          <button className="btn-secondary" onClick={handleJoinManual} style={{ padding: '20px', fontSize: '18px', fontWeight: 'bold', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}><FaKey size={20} /> {t.joinManual}</button>
        </div>
      </div>

      <div style={{ flex: '1', padding: '50px', borderRadius: '24px', minHeight: '450px', background: 'rgba(20, 30, 45, 0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', animation: 'slideUpSmooth 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.15s', opacity: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '900', letterSpacing: '-0.5px' }}>{t.openRooms}</h2>
          <span style={{ background: 'rgba(40, 167, 69, 0.2)', color: '#4dd46b', border: '1px solid rgba(40,167,69,0.4)', padding: '6px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px' }}>{t.online}: {availableRooms.length}</span>
        </div>
        {availableRooms.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', color: '#adb5bd', fontSize: '18px', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <FaBoxOpen size={50} style={{ opacity: 0.5 }} />
            <span>{t.noRooms}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
            {availableRooms.map((room: RoomInfo, index: number) => (
              <div key={room.id} className="room-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', cursor: 'default', opacity: 0, animation: `popInRoom 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards ${0.3 + (index * 0.1)}s` }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', fontWeight: 'bold' }}>{t.roomCode}</div>
                  <div style={{ fontSize: '24px', color: '#fff', fontWeight: '900', letterSpacing: '2px' }}>{room.id}</div>
                  <div style={{ fontSize: '15px', color: '#adb5bd', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#28a745', borderRadius: '50%', boxShadow: '0 0 8px #28a745' }}></span> {t.participants}: <b style={{ color: '#fff' }}>{room.playersCount}</b> / 10</div>
                </div>
                <button onClick={() => handleJoinRoom(room.id)} style={{ background: '#28a745', color: 'white', border: 'none', padding: '15px 30px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '16px', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(40,167,69,0.3)' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(40,167,69,0.5)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(40,167,69,0.3)'; }}>{t.enter}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </>
);

interface LobbyProps {
  roomId: string;
  players: Player[];
  hostId: string | null;
  socketId?: string;
  handleStartGame: () => void;
  handleGoHome: () => void;
  t: TranslationType;
}

export const Lobby: React.FC<LobbyProps> = ({ roomId, players, hostId, socketId, handleStartGame, handleGoHome, t }) => (
  <>
    <style>
      {`
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInPlayer { to { opacity: 1; transform: translateX(0); } }
        @keyframes pulseGlow { 0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); } 70% { box-shadow: 0 0 0 20px rgba(40, 167, 69, 0); } 100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); } }
        @keyframes floatIcon { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes neonFlicker { 0%, 100% { text-shadow: 0 0 10px rgba(0, 123, 255, 0.5), 0 0 20px rgba(0, 123, 255, 0.3); } 50% { text-shadow: 0 0 15px rgba(0, 123, 255, 0.8), 0 0 30px rgba(0, 123, 255, 0.5); } }
      `}
    </style>

    <div style={{ maxWidth: '900px', margin: '0 auto', background: 'rgba(20, 30, 45, 0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '50px', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', animation: 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '25px', marginBottom: '30px' }}>
        <h2 style={{ margin: 0, fontSize: '36px', fontWeight: '900', background: 'linear-gradient(135deg, #fff, #adb5bd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.waitingPlayers}</h2>
        <div style={{ background: 'rgba(0, 123, 255, 0.15)', border: '1px solid rgba(0, 123, 255, 0.3)', padding: '12px 25px', borderRadius: '16px', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#a0cfff', textTransform: 'uppercase', fontSize: '14px', letterSpacing: '1px' }}>{t.roomCode}</span>
          <b style={{ color: '#fff', fontSize: '28px', letterSpacing: '4px', animation: 'neonFlicker 2s infinite' }}>{roomId}</b>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '40px' }}>
        <div style={{ flex: '2' }}>
          <h3 style={{ color: '#adb5bd', marginBottom: '20px', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '2px' }}>{t.participants} ({players.length}/10)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {players.map((p: Player, index: number) => (
              <div key={p.id} style={{ padding: '20px 25px', fontSize: '20px', background: p.id === socketId ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.3)', border: p.id === socketId ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', color: '#fff', opacity: 0, transform: 'translateX(-30px)', animation: `slideInPlayer 0.5s ease forwards ${index * 0.15}s`, transition: 'all 0.3s ease' }}>
                <div style={{ fontSize: '32px', marginRight: '20px', animation: 'floatIcon 3s ease-in-out infinite', filter: p.isOffline ? 'grayscale(100%) opacity(0.5)' : 'none' }}>{p.isOffline ? '👻' : (p.id === hostId ? '👑' : '👤')}</div>
                <span style={{ fontWeight: p.id === socketId ? 'bold' : 'normal', flex: 1, color: p.isOffline ? '#adb5bd' : '#fff' }}>
                  {p.name} 
                  {p.id === socketId && <span style={{ color: '#28a745', fontSize: '14px', marginLeft: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>[✓]</span>}
                </span>
                {p.id === hostId && <span style={{ background: 'linear-gradient(45deg, #ffc107, #ff9800)', color: '#000', fontSize: '12px', padding: '6px 14px', borderRadius: '20px', fontWeight: '900', boxShadow: '0 4px 10px rgba(255, 193, 7, 0.4)', letterSpacing: '1px' }}>{t.host}</span>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
          {socketId === hostId ? (
            <button onClick={handleStartGame} disabled={players.length < 2} style={{ padding: '25px', fontSize: '20px', textTransform: 'uppercase', letterSpacing: '2px', background: players.length < 2 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #28a745, #20c997)', color: players.length < 2 ? '#6c757d' : 'white', fontWeight: '900', border: players.length < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius: '16px', cursor: players.length < 2 ? 'not-allowed' : 'pointer', animation: players.length < 2 ? 'none' : 'pulseGlow 2s infinite', transition: 'all 0.3s', boxShadow: players.length < 2 ? 'none' : '0 10px 30px rgba(40,167,69,0.4)' }}>▶ {t.startGame}</button>
          ) : (
            <div style={{ padding: '30px 20px', fontSize: '16px', textAlign: 'center', color: '#ffc107', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '16px', border: '1px solid rgba(255, 193, 7, 0.2)', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <div style={{ fontSize: '40px', animation: 'floatIcon 2s ease-in-out infinite' }}>⏳</div>
              <span>{t.waitingHost}</span>
            </div>
          )}
          <button onClick={handleGoHome} style={{ padding: '18px', fontSize: '16px', background: 'rgba(220, 53, 69, 0.1)', color: '#ff6b6b', border: '1px solid rgba(220, 53, 69, 0.3)', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s ease', textTransform: 'uppercase', letterSpacing: '1px' }} onMouseOver={(e) => { e.currentTarget.style.background = '#dc3545'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(220, 53, 69, 0.1)'; e.currentTarget.style.color = '#ff6b6b'; e.currentTarget.style.transform = 'translateY(0)'; }}>{t.leaveRoom}</button>
        </div>
      </div>
    </div>
  </>
);

interface GameBoardProps {
  turnEndTime: number | null;
  timeLeft: number;
  myCards: Card[];
  topCard: Card | null;
  players: Player[];
  currentPlayerTurn: string | null;
  socketId?: string;
  handleCallUno: () => void;
  handleCatchUno: () => void;
  handleDrawCard: () => void;
  handlePlayCard: (index: number) => void;
  handleGoHome: () => void;
  t: TranslationType;
}

export const GameBoard: React.FC<GameBoardProps> = ({ turnEndTime, timeLeft, myCards, topCard, players, currentPlayerTurn, socketId, handleCallUno, handleCatchUno, handleDrawCard, handlePlayCard, handleGoHome, t }) => (
  <>
    <style>
      {`
        /* Плавный бросок карты на стол */
        @keyframes dropOnTable {
          0% { opacity: 0; transform: scale(1.3) translateY(-60px) rotate(-15deg); filter: blur(4px); }
          100% { opacity: 1; transform: scale(1) translateY(0) rotate(0deg); filter: blur(0); }
        }
        
        .top-card-played {
          animation: dropOnTable 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }

        /* МАГИЯ ПЛАВНОСТИ РУКИ: 
          Мы не пишем transform жестко в React. Мы берем переменные --rot, --y и --ml. 
          Браузер сам сделает идеальный плавный переход (transition), когда количество карт изменится!
        */
        .hand-card-wrapper {
          position: relative;
          cursor: pointer;
          transform-origin: bottom center;
          transform: translateY(var(--y)) rotate(var(--rot));
          margin-left: var(--ml);
          /* Очень мягкая кривая анимации в стиле Apple */
          transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), margin-left 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          will-change: transform;
        }

        .hand-card-image {
          width: 100px;
          border-radius: 12px;
          object-fit: contain;
          box-shadow: -4px 4px 15px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
        }

        /* Идеально гладкое поднятие карты при наведении */
        .hand-card-wrapper:hover {
          transform: translateY(calc(var(--y) - 40px)) scale(1.15) rotate(0deg) !important;
          z-index: 100 !important;
        }

        .hand-card-wrapper:hover .hand-card-image {
          box-shadow: 0 20px 40px rgba(0,0,0,0.6);
          filter: brightness(1.15);
        }

        .deck-card {
          width: 120px;
          height: 180px;
          cursor: pointer;
          border-radius: 16px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.5);
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          object-fit: contain;
        }
        .deck-card:hover {
          transform: scale(1.05) translateY(-5px) rotate(2deg);
          box-shadow: 0 20px 40px rgba(0,0,0,0.6);
        }
      `}
    </style>

    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px', boxSizing: 'border-box', position: 'relative' }}>
      
      <button onClick={handleGoHome} style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(220,53,69,0.8)', color: 'white', border: '2px solid #fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', zIndex: 50, transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
        🏳️ {t.surrender}
      </button>
      
      {/* Игроки */}
      <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', gap: '30px', paddingTop: '10px' }}>
        {players.map((p: Player) => (
          <div key={p.id} style={{ padding: '15px 30px', borderRadius: '12px', background: p.id === currentPlayerTurn ? '#ffeb3b' : 'rgba(255,255,255,0.1)', color: p.id === currentPlayerTurn ? '#000' : '#fff', fontWeight: 'bold', border: '2px solid ' + (p.id === socketId ? '#fff' : 'rgba(255,255,255,0.3)'), boxShadow: p.id === currentPlayerTurn ? '0 0 30px rgba(255,235,59,0.6)' : 'none', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', opacity: p.isOffline ? 0.5 : 1, transition: 'all 0.3s' }}>
            {p.isOffline ? '👻' : '👤'} {p.name} {p.id === socketId ? '[✓]' : ''}
          </div>
        ))}
      </div>

      {/* Стол */}
      <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        {turnEndTime && (
          <div style={{ background: timeLeft <= 5 ? '#dc3545' : '#ffc107', color: timeLeft <= 5 ? 'white' : 'black', padding: '10px 30px', borderRadius: '30px', fontSize: '24px', fontWeight: 'bold', boxShadow: timeLeft <= 5 ? '0 0 20px rgba(220,53,69,0.8)' : '0 4px 10px rgba(0,0,0,0.3)', transition: 'all 0.3s', zIndex: 10 }}>
            ⏳ {t.timeToMove}: {timeLeft}
          </div>
        )}
        <div style={{ display: 'flex', gap: '80px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             {myCards.length <= 2 && (
              <button onClick={handleCallUno} style={{ background: '#fd7e14', color: 'white', padding: '20px 40px', fontWeight: '900', fontSize: '24px', border: '3px solid #fff', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(253,126,20,0.6)', transform: 'rotate(-5deg)', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.transform='scale(1.1) rotate(-5deg)'} onMouseOut={e => e.currentTarget.style.transform='scale(1) rotate(-5deg)'}>{t.unoButton}</button>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '40px', background: 'rgba(0,0,0,0.2)', padding: '40px 60px', borderRadius: '24px', border: '2px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)' }}>
            <div>
              <h3 style={{ textAlign: 'center', margin: '0 0 15px 0', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '2px' }}>{t.onTable}</h3>
              {topCard ? (
                <img key={topCard.value + topCard.color} className="top-card-played" src={getCardImage(topCard)} alt="На столе" style={{ width: '120px', height: '180px', borderRadius: '16px', objectFit: 'contain' }} onError={(e) => (e.currentTarget.src = "/cards/back.jpg")} />
              ) : <div style={{ width: '120px', height: '180px', border: '4px dashed rgba(255,255,255,0.3)', borderRadius: '16px' }}></div>}
            </div>
            <div>
              <h3 style={{ textAlign: 'center', margin: '0 0 15px 0', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '2px' }}>{t.deck}</h3>
              <img onClick={handleDrawCard} src="/cards/back.jpg" alt="Колода" className="deck-card" />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <button onClick={handleCatchUno} style={{ background: '#dc3545', color: 'white', padding: '20px 40px', fontWeight: '900', fontSize: '20px', border: '3px solid #fff', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(220,53,69,0.6)', transform: 'rotate(5deg)', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.transform='scale(1.1) rotate(5deg)'} onMouseOut={e => e.currentTarget.style.transform='scale(1) rotate(5deg)'}>{t.catchButton}</button>
          </div>
        </div>
      </div>

      {/* Веер карт */}
      <div style={{ flex: '0 0 auto', padding: '20px 20px 40px 20px', background: 'rgba(0,0,0,0.4)', borderRadius: '24px 24px 0 0', borderTop: '2px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: '0px', justifyContent: 'center', padding: '10px' }}>
          {myCards.map((card: Card, index: number) => {
             const offset = index - (myCards.length - 1) / 2;
             const angle = offset * 5; 
             const yOffset = Math.abs(offset) * 4; // Чем дальше от центра, тем ниже карта

             return (
              <div 
                key={index} 
                className="hand-card-wrapper"
                onClick={() => handlePlayCard(index)}
                style={{ 
                  '--rot': `${angle}deg`,
                  '--y': `${yOffset}px`,
                  '--ml': index === 0 ? '0px' : '-45px', // Карты сильнее накладываются друг на друга
                  zIndex: index,
                } as React.CSSProperties} 
              >
                <img 
                  src={getCardImage(card)} 
                  className="hand-card-image"
                  onError={(e) => (e.currentTarget.src = "/cards/back.jpg")} 
                  alt="Card"
                />
              </div>
          )})}
        </div>
      </div>
    </div>
  </>
);

interface VictoryScreenProps {
  winner: string;
  t: TranslationType;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ winner, t }) => (
  <div style={{ textAlign: 'center', marginTop: '15vh' }}>
    <h1 style={{ fontSize: '80px', color: '#ffd700', textShadow: '0 5px 15px rgba(0,0,0,0.5)', margin: '0 0 20px 0' }}>🏆 {t.victory} 🏆</h1>
    <h2 style={{ fontSize: '40px', color: '#fff', margin: '0 0 40px 0' }}>{t.winner}: <b style={{ background: '#fff', color: '#212529', padding: '5px 20px', borderRadius: '10px' }}>{winner}</b></h2>
    <button onClick={() => window.location.reload()} style={{ padding: '20px 40px', fontSize: '24px', fontWeight: 'bold', background: '#007BFF', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 8px 25px rgba(0,123,255,0.5)' }}>{t.toMenu}</button>
  </div>
);