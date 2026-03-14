import localforage from 'localforage';
import { Book } from '../types';

const store = localforage.createInstance({
  name: 'baby-english-cards',
});

const SAMPLE_INJECTED_KEY = 'samples_injected_v1';
const JPEG_MIGRATED_KEY = 'jpeg_migrated_v1';

export const getBooks = async (): Promise<Book[]> => {
  // 首次加载时，尝试注入样例绘本
  const injected = await store.getItem<boolean>(SAMPLE_INJECTED_KEY);
  if (!injected) {
    try {
      const res = await fetch('/samples/manifest.json');
      if (res.ok) {
        const sampleBooks: Book[] = await res.json();
        const existing = await store.getItem<Book[]>('books');
        if (!existing || existing.length === 0) {
          await store.setItem('books', sampleBooks);
          await store.setItem(SAMPLE_INJECTED_KEY, true);
          return sampleBooks;
        }
      }
    } catch {
      // manifest 不存在时静默跳过
    }
    await store.setItem(SAMPLE_INJECTED_KEY, true);
  }

  // 迁移：将 IndexedDB 中 sample 绘本的 .png 路径替换为 .jpg
  const migrated = await store.getItem<boolean>(JPEG_MIGRATED_KEY);
  if (!migrated) {
    const books = await store.getItem<Book[]>('books');
    if (books) {
      const fixPath = (p: string | undefined) => p ? p.replace(/\.png$/, '.jpg') : p;
      const updated = books.map(book => ({
        ...book,
        coverImage: fixPath(book.coverImage),
        cards: book.cards.map(card => ({
          ...card,
          wordImage: fixPath(card.wordImage),
          sentenceImage: fixPath(card.sentenceImage),
        })),
      }));
      await store.setItem('books', updated);
    }
    await store.setItem(JPEG_MIGRATED_KEY, true);
  }

  const books = await store.getItem<Book[]>('books');
  return books || [];
};

export const saveBooks = async (books: Book[]): Promise<void> => {
  await store.setItem('books', books);
};
