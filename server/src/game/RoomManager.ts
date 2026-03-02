import { type Card, type Player, UnoGame, createDeck, shuffleDeck, type ColorCards, type ValueCards } from './card.js';

export class RoomManager {
    private rooms: Map<string, UnoGame>;
    
    constructor() {
        this.rooms = new Map();
    }
    private generateRoomCode(length:number = 6): string{
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for(let i = 0; i < 6; i++){
            result +=chars.charAt(Math.floor(Math.random()* chars.length));
        }
        return result
    }
    createRoom(roomId: string) : UnoGame {
        const game = new UnoGame();
        this.rooms.set(roomId, game);
        return game;
    }

    getRoom(roomId: string): UnoGame | undefined {
        return this.rooms.get(roomId);
    }
    deleteRoom(roomId: string): void {
        this.rooms.delete(roomId);
    } 
}