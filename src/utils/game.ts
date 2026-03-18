import { Book, Flashcard } from '../types';

export interface GameMedia {
  image: string;
  audio: string;
  text: string;
}

export const getGameMedia = (card: Flashcard): GameMedia | null => {
  if (card.wordImage && card.wordAudio) {
    return {
      image: card.wordImage,
      audio: card.wordAudio,
      text: card.word || card.sentence,
    };
  }

  if (card.sentenceImage && card.sentenceAudio) {
    return {
      image: card.sentenceImage,
      audio: card.sentenceAudio,
      text: card.sentence || card.word,
    };
  }

  return null;
};

export const getPlayableGameCards = (book: Book): Flashcard[] =>
  book.cards.filter((card) => getGameMedia(card) !== null);

export const canPlayBookGame = (book: Book): boolean => getPlayableGameCards(book).length >= 2;
