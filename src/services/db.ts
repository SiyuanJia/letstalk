import localforage from 'localforage';
import { Book } from '../types';

const store = localforage.createInstance({
  name: 'baby-english-cards',
});

const JPEG_MIGRATED_KEY = 'jpeg_migrated_v1';
const SAMPLE_MANIFEST_URL = './samples/manifest.json';

const fixPath = (p: string | undefined) => p ? p.replace(/\.png$/, '.jpg') : p;

const migrateJpegPaths = (books: Book[]): Book[] => books.map(book => ({
  ...book,
  coverImage: fixPath(book.coverImage),
  cards: book.cards.map(card => ({
    ...card,
    wordImage: fixPath(card.wordImage),
    sentenceImage: fixPath(card.sentenceImage),
  })),
}));

const mergeSampleBooks = (existingBooks: Book[], sampleBooks: Book[]): Book[] => {
  const existingById = new Map(existingBooks.map(book => [book.id, book]));
  const sampleIds = new Set(sampleBooks.map(book => book.id));

  const mergedSamples = sampleBooks.map(sampleBook => existingById.get(sampleBook.id) || sampleBook);
  const customBooks = existingBooks.filter(book => !sampleIds.has(book.id));

  return [...mergedSamples, ...customBooks];
};

export const getBooks = async (): Promise<Book[]> => {
  let books = (await store.getItem<Book[]>('books')) || [];

  // 迁移：将 IndexedDB 中 sample 绘本的 .png 路径替换为 .jpg
  const migrated = await store.getItem<boolean>(JPEG_MIGRATED_KEY);
  if (!migrated) {
    books = migrateJpegPaths(books);
    await store.setItem('books', books);
    await store.setItem(JPEG_MIGRATED_KEY, true);
  }

  try {
    const res = await fetch(SAMPLE_MANIFEST_URL);
    if (res.ok) {
      const sampleBooks: Book[] = await res.json();
      const mergedBooks = mergeSampleBooks(books, sampleBooks);

      if (JSON.stringify(mergedBooks) !== JSON.stringify(books)) {
        books = mergedBooks;
        await store.setItem('books', books);
      }
    }
  } catch {
    // manifest 不存在或加载失败时静默跳过，保留本地书单
  }

  return books;
};

export const saveBooks = async (books: Book[]): Promise<void> => {
  await store.setItem('books', books);
};
