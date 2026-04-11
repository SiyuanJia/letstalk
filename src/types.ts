export interface Flashcard {
  id: string;
  word: string;
  sentence: string;
  wordImage?: string;
  sentenceImage?: string;
  wordAudio?: string;
  sentenceAudio?: string;
}

export interface Book {
  id: string;
  title: string;
  coverImage?: string;
  style: string;
  cards: Flashcard[];
}

export const STYLES = [
  { id: 'cartoon', name: '卡通风 (Cartoon)' },
  { id: 'clay', name: '黏土风 (Clay)' },
  { id: 'felt', name: '毛毡风 (Felt)' },
  { id: 'watercolor', name: '水彩风 (Watercolor)' },
  { id: 'realistic', name: '写实风 (Realistic)' },
  { id: 'lineart', name: '手绘风 (Hand-drawn)' },
];

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
