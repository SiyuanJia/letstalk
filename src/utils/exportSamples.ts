import JSZip from 'jszip';
import { Book } from '../types';

// 将 data URI 转为 Uint8Array
function dataUriToBytes(dataUri: string): { bytes: Uint8Array; ext: string } {
  const [header, base64] = dataUri.split(',');
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const ext = mime.split('/')[1].replace('wav', 'wav').replace('jpeg', 'jpg');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return { bytes, ext };
}

// 判断是否是 data URI（需要导出为文件）
function isDataUri(s: string): boolean {
  return s.startsWith('data:');
}

/**
 * 把一本绘本的所有 base64 资源打包进 ZIP，
 * 返回该绘本清洗后的数据（图片/音频字段替换为相对路径）
 */
function packBookIntoZip(
  zip: JSZip,
  book: Book,
  existingManifest: Book[]
): Book {
  const bookId = book.id;
  const folder = zip.folder(bookId)!;

  // 辅助：写文件并返回路径
  const writeAsset = (dataUri: string, name: string): string => {
    const { bytes, ext } = dataUriToBytes(dataUri);
    const filename = `${name}.${ext}`;
    folder.file(filename, bytes);
    return `/samples/${bookId}/${filename}`;
  };

  // 处理封面
  let coverImage = book.coverImage;
  if (coverImage && isDataUri(coverImage)) {
    coverImage = writeAsset(coverImage, 'cover');
  }

  // 处理每张卡片
  const cards = book.cards.map((card) => {
    let { wordImage, wordAudio, sentenceImage, sentenceAudio } = card;
    if (wordImage && isDataUri(wordImage))         wordImage     = writeAsset(wordImage,     `${card.id}-word`);
    if (wordAudio && isDataUri(wordAudio))          wordAudio     = writeAsset(wordAudio,     `${card.id}-word-audio`);
    if (sentenceImage && isDataUri(sentenceImage)) sentenceImage = writeAsset(sentenceImage, `${card.id}-sentence`);
    if (sentenceAudio && isDataUri(sentenceAudio)) sentenceAudio = writeAsset(sentenceAudio, `${card.id}-sentence-audio`);
    return { ...card, wordImage, wordAudio, sentenceImage, sentenceAudio };
  });

  return { ...book, coverImage, cards };
}

/**
 * 导出指定绘本为 ZIP（包含图片/音频文件 + manifest.json）
 * ZIP 结构：
 *   <bookId>/cover.png
 *   <bookId>/<cardId>-word.png
 *   <bookId>/<cardId>-word-audio.wav
 *   ...
 *   manifest.json  ← 全量，合并已有 manifest
 */
export async function exportBookAsZip(
  book: Book,
  existingManifest: Book[] = []
): Promise<void> {
  const zip = new JSZip();

  const cleanBook = packBookIntoZip(zip, book, existingManifest);

  // 合并到现有 manifest（同 id 替换，否则追加）
  const merged = existingManifest.filter((b) => b.id !== cleanBook.id);
  merged.push(cleanBook);

  zip.file('manifest.json', JSON.stringify(merged, null, 2));

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `samples-${book.id}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
