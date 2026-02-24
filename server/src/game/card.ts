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
    const actions: ValueCards[] = ['skip', 'reverse', 'draw_two'];

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


// блок для тестирования создания и перемешивания колоды карт
const deck = createDeck();
console.log('Original Deck:', deck);
const shuffledDeck = shuffleDeck(deck);
console.log('Shuffled Deck:', shuffledDeck);