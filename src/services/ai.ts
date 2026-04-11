import { GoogleGenAI, Modality } from "@google/genai";

const getAI = () => {
  const apiKey =
    localStorage.getItem('user_gemini_api_key') ||
    process.env.API_KEY ||
    process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('API_KEY_ERROR');
  return new GoogleGenAI({ apiKey });
};

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return window.btoa(binary);
}

export function createWavDataUri(pcmBase64: string, sampleRate: number = 24000): string {
  const pcmData = base64ToUint8Array(pcmBase64);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const chunkSize = 36 + dataSize;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, chunkSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const pcmView = new Uint8Array(buffer, 44);
  pcmView.set(pcmData);

  const wavBase64 = uint8ArrayToBase64(new Uint8Array(buffer));
  return `data:audio/wav;base64,${wavBase64}`;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isApiKeyError = (message: string) =>
  message.includes('Requested entity was not found') ||
  message.includes('PERMISSION_DENIED');

const isNetworkConnectionError = (message: string) =>
  message.includes('failed to fetch') ||
  message.includes('err_connection_closed') ||
  message.includes('connection closed') ||
  message.includes('networkerror') ||
  message.includes('network error') ||
  message.includes('couldn\'t connect');

const isRateLimitError = (message: string) =>
  message.includes('too many request') ||
  message.includes('too many requests') ||
  message.includes('rate limit') ||
  message.includes('resource_exhausted') ||
  message.includes('quota');

const isRetryableError = (message: string) =>
  message.includes('timeout') ||
  message.includes('network') ||
  message.includes('fetch') ||
  message.includes('temporar') ||
  message.includes('unavailable') ||
  message.includes('internal');

const executeWithRetry = async <T>(operation: () => Promise<T>, maxRetries = 0): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const message = String(error?.message || '').toLowerCase();

      if (isApiKeyError(message)) {
        throw new Error('API_KEY_ERROR');
      }

      if (isNetworkConnectionError(message)) {
        throw new Error('NETWORK_ERROR');
      }

      if (isRateLimitError(message) || !isRetryableError(message) || attempt === maxRetries) {
        throw error;
      }

      const waitMs = 1500 * (attempt + 1);
      console.warn(`API call failed, retrying in ${waitMs}ms...`, error);
      await delay(waitMs);
    }
  }

  throw lastError;
};

export const generateImage = async (prompt: string, style: string): Promise<string> => {
  const ai = getAI();
  const stylePrompts: Record<string, string> = {
    'cartoon': 'Cute, colorful 2D cartoon illustration for toddlers, soft lines, bright pastel colors, simple background.',
    'clay': 'Cute 3D claymation style, soft lighting, vibrant colors, tactile texture, simple composition for kids.',
    'felt': 'Cozy felt craft style, soft fabric texture, warm colors, handmade look, simple and cute for toddlers.',
    'watercolor': "Gentle watercolor painting, soft edges, pastel colors, dreamy and cute, suitable for a children's book.",
    'realistic': 'High quality realistic photography, bright lighting, suitable for children, clear subject, vibrant colors.',
    'lineart': 'Warm hand-drawn children\'s book illustration, soft sketch lines, gentle brush or crayon texture, cute and cozy atmosphere, sweet expressions, simple but full scene composition, storybook feeling.'
  };

  const styleInstruction = stylePrompts[style] || stylePrompts['cartoon'];
  const fullPrompt = `A cute illustration for a 3-year-old child's flashcard. Subject: ${prompt}. Style: ${styleInstruction}. No text in the image. No white border, no padding, no frame, fill the entire image edge to edge.`;

  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "512px"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  });
};

export const generateAudio = async (text: string): Promise<string> => {
  const ai = getAI();
  return executeWithRetry(async () => {
    const chunks: Uint8Array[] = [];
    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say cheerfully and clearly for a toddler: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    for await (const chunk of stream) {
      const data = chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (data) {
        chunks.push(base64ToUint8Array(data));
      }
    }

    if (chunks.length === 0) {
      throw new Error("No audio generated");
    }

    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const pcmData = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      pcmData.set(chunk, offset);
      offset += chunk.length;
    }

    return createWavDataUri(uint8ArrayToBase64(pcmData), 24000);
  });
};
