import React from 'react';

interface LoadingScreenProps {
  isVisible: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at center, #1e242c 0%, #0b0d10 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 200000, // Выше всех модалок
      transition: 'opacity 0.5s ease',
    }}>
      <style>
        {`
          @keyframes logoPulse {
            0% { transform: scale(1.2); filter: drop-shadow(0 0 10px rgba(255, 165, 0, 0.2)); }
            50% { transform: scale(1.5); filter: drop-shadow(0 0 30px rgba(255, 165, 0, 0.5)); }
            100% { transform: scale(1.2); filter: drop-shadow(0 0 10px rgba(255, 165, 0, 0.2)); }
          }
          .pulse-logo {
            animation: logoPulse 2s ease-in-out infinite;
          }
          @keyframes textFade {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
        `}
      </style>
      
      <img 
        src="/logo.png" 
        alt="Loading..." 
        className="pulse-logo"
        style={{ width: '150px', objectFit: 'contain' }} 
      />
      
      <div style={{ 
        marginTop: '40px', 
        color: '#ffc107', 
        fontSize: '14px', 
        textTransform: 'uppercase', 
        letterSpacing: '4px',
        animation: 'textFade 2s infinite',
        fontWeight: 'bold'
      }}>
        Загрузка...
      </div>
    </div>
  );
};