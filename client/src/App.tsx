import {useEffect, useState} from 'react';
import {io} from "socket.io-client";
import './App.css';

// создаем подключение к серверу Socket.IO
const socket = io("http://localhost:3001");

function App() {
  const [isConnected, setIsConnected] =useState(socket.connected);

  useEffect(() => {
    // слушаем событие подключения
    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to server");
    });
    // слушаем событие отключения
    socket.on("disconnect", ()=> {
      setIsConnected(false);
      console.log("Disconnected from server");
    });

    // очищаем слушатели при размонтировании компонента
    return () => {
      socket.off("connect");
      socket.off("disconnect");
 };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>UNO Game Client</h1>
      {/* 3. Если сервер работает, будет зеленый кружок */}
      <h2>Status: {isConnected ? '🟢 ONLINE' : '🔴 OFFLINE'}</h2>
    </div>
  );
}
export default App;