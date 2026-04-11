/**
 * 生成样例绘本的图片和音频资源
 * 运行: node scripts/generate-samples.mjs
 * 需要 .env 中有 GEMINI_API_KEY
 */

import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'public', 'samples');

// 读取 .env
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) process.env[k.trim()] = v.trim();
  });
}

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
if (!API_KEY) {
  console.error('❌ 缺少 GEMINI_API_KEY，请检查 .env 文件');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const delay = ms => new Promise(r => setTimeout(r, ms));

// ========== 样例绘本定义 ==========
const SAMPLE_BOOKS = [
  {
    id: 'sample-market',
    title: 'At the Market',
    style: 'cartoon',
    cards: [
      { id: 'market-1', word: 'fruit',     sentence: 'Look at the fruits.' },
      { id: 'market-2', word: 'vegetable', sentence: 'Look at the vegetables.' },
      { id: 'market-3', word: 'egg',       sentence: 'Look at the eggs.' },
      { id: 'market-4', word: 'fish',      sentence: 'Look at the fish.' },
      { id: 'market-5', word: 'meat',      sentence: 'Look at the meat.' },
      { id: 'market-6', word: 'candy',     sentence: 'Look at the candies.' },
      { id: 'market-7', word: 'toy',       sentence: 'Look at the toys.' },
    ],
  },
];

// ========== 风格 Prompt ==========
const STYLE_PROMPTS = {
  cartoon: 'Cute, colorful 2D cartoon illustration for toddlers, soft lines, bright pastel colors, simple background.',
  clay: 'Cute 3D claymation style, soft lighting, vibrant colors, tactile texture, simple composition for kids.',
  felt: 'Cozy felt craft style, soft fabric texture, warm colors, handmade look, simple and cute for toddlers.',
  watercolor: "Gentle watercolor painting, soft edges, pastel colors, dreamy and cute, suitable for a children's book.",
  realistic: 'High quality realistic photography, bright lighting, suitable for children, clear subject, vibrant colors.',
  lineart: 'Warm hand-drawn children\'s book illustration, soft sketch lines, gentle brush or crayon texture, cute and cozy atmosphere, sweet expressions, simple but full scene composition, storybook feeling.',
};

// ========== 生成图片 ==========
async function generateImage(prompt, style, retries = 3) {
  const styleInstruction = STYLE_PROMPTS[style] || STYLE_PROMPTS.cartoon;
  const fullPrompt = `A cute illustration for a 3-year-old child's flashcard. Subject: ${prompt}. Style: ${styleInstruction}. No text in the image.`;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts: [{ text: fullPrompt }] },
        config: {
          imageConfig: { aspectRatio: '1:1', imageSize: '512px' },
        },
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return Buffer.from(part.inlineData.data, 'base64');
        }
      }
      throw new Error('No image in response');
    } catch (e) {
      if (i < retries - 1) {
        console.warn(`  重试 (${i + 1}/${retries})...`);
        await delay(3000 * (i + 1));
      } else {
        throw e;
      }
    }
  }
}

// ========== 生成音频 ==========
function pcmToWav(pcmBuffer, sampleRate = 24000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

async function generateAudio(text, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: `Say cheerfully and clearly for a toddler: ${text}` }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return pcmToWav(Buffer.from(base64Audio, 'base64'));
      }
      throw new Error('No audio in response');
    } catch (e) {
      if (i < retries - 1) {
        console.warn(`  重试 (${i + 1}/${retries})...`);
        await delay(3000 * (i + 1));
      } else {
        throw e;
      }
    }
  }
}

// ========== 主流程 ==========
async function main() {
  console.log('🚀 开始生成样例绘本资源...\n');

  const manifest = [];

  for (const book of SAMPLE_BOOKS) {
    console.log(`📚 绘本: ${book.title}`);
    const bookDir = path.join(OUTPUT_DIR, book.id);
    fs.mkdirSync(bookDir, { recursive: true });

    const bookData = { ...book, coverImage: null, cards: [] };

    // 生成封面
    console.log(`  🖼  生成封面...`);
    try {
      const imgBuf = await generateImage(book.title, book.style);
      const coverFile = `cover.png`;
      fs.writeFileSync(path.join(bookDir, coverFile), imgBuf);
      bookData.coverImage = `samples/${book.id}/${coverFile}`;
      console.log(`  ✅ 封面已保存`);
    } catch (e) {
      console.error(`  ❌ 封面生成失败: ${e.message}`);
    }
    await delay(1000);

    // 生成每张卡片
    for (const card of book.cards) {
      console.log(`\n  🃏 卡片: ${card.word}`);
      const cardData = { ...card, wordImage: null, wordAudio: null, sentenceImage: null, sentenceAudio: null };

      // 单词图片
      try {
        process.stdout.write(`    🖼  单词图片...`);
        const buf = await generateImage(card.word, book.style);
        const file = `${card.id}-word.png`;
        fs.writeFileSync(path.join(bookDir, file), buf);
        cardData.wordImage = `samples/${book.id}/${file}`;
        console.log(` ✅`);
      } catch (e) {
        console.log(` ❌ ${e.message}`);
      }
      await delay(800);

      // 单词发音
      try {
        process.stdout.write(`    🔊 单词发音...`);
        const buf = await generateAudio(card.word);
        const file = `${card.id}-word.wav`;
        fs.writeFileSync(path.join(bookDir, file), buf);
        cardData.wordAudio = `samples/${book.id}/${file}`;
        console.log(` ✅`);
      } catch (e) {
        console.log(` ❌ ${e.message}`);
      }
      await delay(800);

      // 句子图片
      try {
        process.stdout.write(`    🖼  句子图片...`);
        const buf = await generateImage(card.sentence, book.style);
        const file = `${card.id}-sentence.png`;
        fs.writeFileSync(path.join(bookDir, file), buf);
        cardData.sentenceImage = `samples/${book.id}/${file}`;
        console.log(` ✅`);
      } catch (e) {
        console.log(` ❌ ${e.message}`);
      }
      await delay(800);

      // 句子发音
      try {
        process.stdout.write(`    🔊 句子发音...`);
        const buf = await generateAudio(card.sentence);
        const file = `${card.id}-sentence.wav`;
        fs.writeFileSync(path.join(bookDir, file), buf);
        cardData.sentenceAudio = `samples/${book.id}/${file}`;
        console.log(` ✅`);
      } catch (e) {
        console.log(` ❌ ${e.message}`);
      }
      await delay(800);

      bookData.cards.push(cardData);
    }

    manifest.push(bookData);
    console.log(`\n✅ 绘本 "${book.title}" 完成\n`);
  }

  // 写入 manifest JSON
  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\n📄 manifest.json 已写入: ${manifestPath}`);
  console.log('\n🎉 所有样例生成完成！');
}

main().catch(err => {
  console.error('❌ 生成失败:', err);
  process.exit(1);
});
