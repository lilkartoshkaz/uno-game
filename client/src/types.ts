export interface Card {
  color: string;
  value: string;
}

export interface Player {
  id: string;
  name: string;
  hand?: Card[];
  isOffline?: boolean;
  persistentId?: string;
}

export interface RoomInfo {
  id: string;
  playersCount: number;
}

export interface ChatMessage {
  messageId: string;
  roomId: string;
  senderName: string;
  text: string;
}