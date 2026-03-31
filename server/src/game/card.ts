import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

// создаем карточную колоду для игры UNO
type ColorCards = 'blue'| 'red' | 'green' | 'yellow'| 'black';
type ValueCards = '0' | '1'| '2'| '3'| '4' | '5' | '6'| '7'| '8'| '9'| 'skip' | 'reverse'| 'draw_two'| 'wild' | 'wild_draw_four';

interface Card {
    color: ColorCards,
    value: ValueCards
}
// функция для создания колоды карт UNO
function createDeck(): Card[] {

    const deck : Card[] = [];

    const colors: ColorCards[] = ['blue', 'red', 'green', 'yellow'];
    const numbers: ValueCards[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const actions: ValueCards[] = ['skip', 'reverse', 'draw_two','wild', 'wild_draw_four'];
    // добавляем карты с цифрами и действием для каждого цвета
    for (const color of colors){
        deck.push({ color: color,value: '0'});

        for(const number of numbers){
            deck.push({color: color, value: number});
            deck.push({color: color, value: number});
        }
        for(const action of actions){
            deck.push({color: color, value: action});
            deck.push({color: color, value: action});
        }
    }
    for(let i = 0; i<4; i++){
        deck.push({color: 'black', value: 'wild'});
        deck.push({color: 'black', value: 'wild_draw_four'});
    }
    return deck;
}
// функция для перемешивания колоды карт

function shuffleDeck(deck: Card[]): Card[] {
    for (let i = deck.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        const temp = deck[i]!;
        deck[i] = deck[j]!;
        deck[j] = temp;
    }
    return deck; 
}

interface Player{
    id: string;
    name: string;
    hand: Card[];
    declareUno?: boolean;
}
class UnoGame{
    players: Player[];
    deck: Card[]
    discardPile: Card[];
    currentPlayerIndex: number;
    direction: number = 1;
    declaredColor: ColorCards | null = null;
    winner: Player | null = null;
    hostId: string | null = null; 

    // методы для управления игрой, например, раздача карт, обработка ходов, проверка победителя
    constructor() {
        this.players = [];
        this.deck = shuffleDeck(createDeck());
        this.discardPile = [];
        this.currentPlayerIndex = 0;
        this.direction = 1;
        this.declaredColor = null;
        this.winner = null; 
    }
    addPlayer(id: string, name: string) {
        const newPlayer: Player = { id, name, hand: []};
        if (this.players.length === 0){
            this.hostId = id;
        }
        this.players.push(newPlayer); 
        
    }
    startGame() {
        // раздаем по 7 карт каждому игроку
        for (let i = 0; i < 7; i++){
            for (const player of this.players){
                const card = this.deck.pop();
                if (card) {
                    player.hand.push(card);
                }
            }
        }
        // открываем первую карту на столе
        const firstCard = this.deck.pop();
        if (firstCard) {
            this.discardPile.push(firstCard);
        }
    }
    
    canPlayCard(cardToPlay: Card, topCardOnTable: Card): boolean {
        if (cardToPlay.color === "black") {
            return true; 
        }
        if (topCardOnTable.color === "black" && this.declaredColor) {
            return cardToPlay.color === this.declaredColor || cardToPlay.value === topCardOnTable.value;
        }
        if (cardToPlay.color === "red" || cardToPlay.color === "blue" || cardToPlay.color === "green" || cardToPlay.color === "yellow") {
            return cardToPlay.color === topCardOnTable.color || cardToPlay.value === topCardOnTable.value;
        }
        return false;
    }
    playCard(playerId: string, cardIndex: number, declaredColor?: ColorCards ) {
        // проверяем, что игрок может ходить
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            throw new Error("Player not found");
        }
        const playerIndex = this.players.indexOf(player);

        if (playerIndex !== this.currentPlayerIndex) {
            throw new Error("Not this player's turn");
        }
        // проверяем, что карта может быть сыграна
        const cardToPlay = player.hand[cardIndex];
        if (!cardToPlay) {
            throw new Error("Card not found in player's hand");
        }else if (cardToPlay.color === "black" && !declaredColor) {
            throw new Error("Must declare a color when playing a wild card");
        }
        // проверяем, что карта может быть сыграна на верхнюю карту на столе
        const topCardOnTable = this.discardPile[this.discardPile.length - 1]!;
        if (!this.canPlayCard(cardToPlay, topCardOnTable)){
            throw new Error("Cannot play this card");
        }
        // играем карту
        player.hand.splice(cardIndex,1);
        this.discardPile.push(cardToPlay);
        player.declareUno = false;
        if (player.hand.length === 0){
            this.winner = player;
            return;
        }
        // обрабатываем действие карты (например, смена направления, пропуск хода, взятие карт)
        if (cardToPlay.value === 'reverse'){
            this.direction *= -1;
        }
        if (cardToPlay.value === 'skip'){
            this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
            // выдача двух карт следующему игроку и пропуск его хода
        }else if (cardToPlay.value === 'wild'){
            this.declaredColor = declaredColor || null;
        }
        else if (cardToPlay.value === 'draw_two'){
            const nextPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
            const nextPlayer = this.players[nextPlayerIndex];
            for (let i = 0; i <2; i++){
                const card = this.deck.pop();
                if (card) {
                    nextPlayer?.hand.push(card);
                }
            }
            this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
        } // выдача четырех карт следующему игроку и пропуск его хода
            else if (cardToPlay.value === 'wild_draw_four'){
            const nextPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
            const nextPlayer = this.players[nextPlayerIndex];
            this.declaredColor = declaredColor || null; 
            for (let i =0; i <4; i++){
                const card = this.deck.pop();
                if (card) {
                    nextPlayer?.hand.push(card);
                }
            }
            this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
        }
            
        this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;

    }
    drawCard(playerId: string) {
        // проверяем, что игрок может ходить 
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            throw new Error("Player not found");
        }
        
        const playerIndex = this.players.indexOf(player);
        if (playerIndex !== this.currentPlayerIndex) {
            throw new Error("Not this player's turn");
        }
        if (this.deck.length === 0){
            this.reshuffleDeck();
        }
        const card = this.deck.pop();
        
        if (card) {
            player.hand.push(card);
        }
       
        this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
        

    }
    reshuffleDeck() {
        if (this.discardPile.length <= 1){
            return;
        }
        const cardToSuffle = this.discardPile.splice(0, this.discardPile.length - 1); // все карты, кроме верхней, идут в колоду для перемешивания
        cardToSuffle.sort(() => Math.random() - 0.5);
        // добавляем перемешанные карты обратно в колоду
        this.deck = cardToSuffle;
        console.log("Колода перемешана! Теперь в ней карт:", this.deck.length);

    }
    callUno(playerId:string){
        const player = this.players.find(p => p.id === playerId);
        if(!player){throw new Error("Player not found");}

        if(player.hand.length > 2){throw new Error("Рано кричать УНО! У тебя больше 2 карт.");}
        
        player.declareUno = true;
    }
    catchUno(callerId: string){
        const violator = this.players.find(p => p.hand.length === 1 && !p.declareUno);

        if (!violator){throw new Error("Некого ловить! Все честные или карт больше одной.");}

        for (let i = 0; i < 2; i ++){
            if(this.deck.length === 0) this.reshuffleDeck();
            const card = this.deck.pop();
            if(card) violator.hand.push(card);
        }
        violator.declareUno = false;
        return violator;
    }

}
export type { Card, Player };
export { UnoGame, createDeck, shuffleDeck };
export type { ColorCards, ValueCards };
/* блок для тестирования создания и перемешивания колоды карт
const deck = createDeck();
console.log('Original Deck:', deck);
const shuffledDeck = shuffleDeck(deck);
console.log('Shuffled Deck:', shuffledDeck);
*/