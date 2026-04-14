import {type Card } from './types';

export const getPersistentId = (): string => {
  let id = localStorage.getItem('uno_persistent_id');
  if (!id) {
    id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('uno_persistent_id', id);
  }
  return id;
};

export const getCardImage = (card: Card): string => {
  const fileName = `${card.color}_${card.value}.jpg`;
  return `/cards/${fileName}`;
};

export const PERSISTENT_ID = getPersistentId();