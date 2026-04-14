import React, { useEffect, useState } from 'react';
import { Socket } from "socket.io-client";
import { type ChatMessage } from '../types';
import { translations } from '../i18n';

type TranslationType = typeof translations['ru'];

interface ChatProps {
  socket: Socket;
  roomId: string;
  playerName: string;
  onError: (msg: string) => void;
  t: TranslationType;
}

export const Chat: React.FC<ChatProps> = ({ socket, roomId, playerName, onError, t }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [lastSentTime, setLastSentTime] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const handleNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (!isOpen && msg.senderName !== playerName) setUnreadCount((prev) => prev + 1);
    };
    const handleSpam = (err: { messageId: string, text: string }) => {
      onError(t.chat.tooFast); // Используем перевод ошибки спама
      setMessages((prev) => prev.filter((m) => m.messageId !== err.messageId));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('spam_error', handleSpam);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('spam_error', handleSpam);
    };
  }, [socket, isOpen, playerName, onError, t]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !roomId || !playerName) return;

    const now = Date.now();
    if (now - lastSentTime < 1000) {
      onError(t.chat.tooFast);
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
        <div onClick={() => { setIsOpen(true); setUnreadCount(0); }} style={{ position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', background: '#4CAF50', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.4)', zIndex: 9999, transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          <span style={{ fontSize: '28px' }}>💬</span>
          {unreadCount > 0 && <div style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#dc3545', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', border: '2px solid white' }}>{unreadCount}</div>}
        </div>
      )}

      {isOpen && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', width: '350px', height: '450px', background: '#fff', borderRadius: '12px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 9999, overflow: 'hidden', fontFamily: 'sans-serif', border: '1px solid #ddd' }}>
          <div style={{ background: '#212529', color: '#fff', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{t.chat.title} ({roomId})</span>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>✖</button>
          </div>

          <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8f9fa' }}>
            {messages.length === 0 && <p style={{ textAlign: 'center', color: '#adb5bd', fontSize: '14px', margin: 'auto' }}>{t.chat.empty}</p>}
            {messages.map((msg) => {
              const isMine = msg.senderName === playerName;
              return (
                <div key={msg.messageId} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', background: isMine ? '#28a745' : '#e9ecef', color: isMine ? '#fff' : '#212529', padding: '10px 14px', borderRadius: '15px', borderBottomRightRadius: isMine ? '4px' : '15px', borderBottomLeftRadius: !isMine ? '4px' : '15px', fontSize: '15px', maxWidth: '85%', wordBreak: 'break-word', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  {!isMine && <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', color: '#6c757d', marginBottom: '4px' }}>{msg.senderName}</span>}
                  {msg.text}
                </div>
              );
            })}
          </div>

          <form onSubmit={sendMessage} style={{ display: 'flex', borderTop: '1px solid #dee2e6', background: 'white', padding: '12px' }}>
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={t.chat.placeholder} style={{ flex: 1, padding: '12px 15px', border: '1px solid #ced4da', borderRadius: '25px', outline: 'none', fontSize: '15px', background: '#f8f9fa', color: '#212529' }} />
            <button type="submit" style={{ background: '#28a745', color: '#fff', border: 'none', width: '45px', height: '45px', borderRadius: '50%', marginLeft: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' }}>➤</button>
          </form>
        </div>
      )}
    </>
  );
};