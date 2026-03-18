import React, { useState, useEffect, useRef } from 'react';
import { Book, Flashcard } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, ArrowLeft, ArrowRight, RotateCcw, Home, Sparkles } from 'lucide-react';
import { createWavDataUri } from '../services/ai';

interface FlashcardViewerProps {
  book: Book;
  onBack: () => void;
  onPlayGame?: () => void;
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({ book, onBack, onPlayGame }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentCard = book.cards[currentIndex];

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const playAudio = (audioData?: string) => {
    if (!audioData) return;
    stopAudio();

    let finalAudioData = audioData;
    if (audioData.startsWith('data:audio/pcm')) {
      const base64 = audioData.split('base64,')[1];
      if (base64) {
        finalAudioData = createWavDataUri(base64, 24000);
      }
    }

    const audio = new Audio(finalAudioData);
    audioRef.current = audio;
    audio.play().catch(e => console.error("Audio play error:", e));
  };

  const handleNext = () => {
    if (currentIndex < book.cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!currentCard) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
        <p className="text-slate-500 mb-4 font-medium">这本绘本还没有卡片哦~</p>
        <button onClick={onBack} className="px-6 py-3 bg-gradient-to-r from-[#ff006e] to-[#ff8c00] text-white rounded-full font-bold shadow-md hover:shadow-lg transition-all">
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#ff006e] opacity-5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-[#00d9ff] opacity-5 rounded-full blur-3xl pointer-events-none"></div>

      <header className="p-4 flex items-center justify-between bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20 border-b border-slate-100">
        <button onClick={onBack} className="p-2 text-[#ff8c00] hover:bg-[#ff8c00]/10 rounded-full transition-colors">
          <Home className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 min-w-0 px-4">
          <h1 className="text-lg font-bold text-slate-800 truncate">{book.title}</h1>
          {onPlayGame && (
            <button
              onClick={onPlayGame}
              className="w-10 h-10 bg-gradient-to-br from-[#00d9ff] to-[#0088ff] hover:opacity-90 rounded-full flex items-center justify-center text-white shadow-md shadow-[#00d9ff]/20 transition-transform active:scale-95 shrink-0"
              title="开始游戏"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto relative z-10 [perspective:1000px]">
        <div className="w-full aspect-[3/4] relative cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
          <AnimatePresence initial={false} mode="wait">
            {!isFlipped ? (
              <motion.div
                key="front"
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: 90, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border-4 border-[#ff8c00]/20 flex flex-col overflow-hidden group-hover:border-[#ff8c00]/40 transition-colors"
              >
                <div className="flex-1 bg-gradient-to-b from-[#ff8c00]/5 to-transparent p-6 flex items-center justify-center relative">
                  {currentCard.wordImage ? (
                    <img src={currentCard.wordImage} alt={currentCard.word} className="w-full h-full object-contain rounded-xl" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-[#ff8c00]/30 text-6xl font-black">?</div>
                  )}
                </div>
                <div className="h-1/3 bg-white p-6 flex items-center justify-between border-t-4 border-[#ff8c00]/10">
                  <h2 className="text-4xl font-black text-slate-800 tracking-tight">{currentCard.word}</h2>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(currentCard.wordAudio);
                    }}
                    className="w-14 h-14 bg-gradient-to-br from-[#ff8c00] to-[#ff006e] hover:opacity-90 rounded-full flex items-center justify-center text-white shadow-lg shadow-[#ff8c00]/30 transition-transform active:scale-95"
                  >
                    <Volume2 className="w-7 h-7" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="back"
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: 90, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border-4 border-[#00d9ff]/20 flex flex-col overflow-hidden group-hover:border-[#00d9ff]/40 transition-colors"
              >
                <div className="flex-1 bg-gradient-to-b from-[#00d9ff]/5 to-transparent p-6 flex items-center justify-center relative">
                  {currentCard.sentenceImage ? (
                    <img src={currentCard.sentenceImage} alt={currentCard.sentence} className="w-full h-full object-contain rounded-xl" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-[#00d9ff]/30 text-6xl font-black">?</div>
                  )}
                </div>
                <div className="h-1/3 bg-white p-6 flex items-center justify-between border-t-4 border-[#00d9ff]/10">
                  <p className="text-2xl font-bold text-slate-800 leading-tight flex-1 pr-4">{currentCard.sentence}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(currentCard.sentenceAudio);
                    }}
                    className="w-14 h-14 bg-gradient-to-br from-[#00d9ff] to-[#0088ff] hover:opacity-90 rounded-full flex items-center justify-center text-white shadow-lg shadow-[#00d9ff]/30 transition-transform active:scale-95 shrink-0"
                  >
                    <Volume2 className="w-7 h-7" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-10 flex items-center justify-center gap-6 w-full">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#ff006e] hover:shadow-lg transition-all active:scale-95"
          >
            <ArrowLeft className="w-8 h-8" />
          </button>
          
          <div className="text-slate-500 font-bold bg-white px-6 py-3 rounded-full shadow-sm border border-slate-100">
            {currentIndex + 1} / {book.cards.length}
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === book.cards.length - 1}
            className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#00d9ff] hover:shadow-lg transition-all active:scale-95"
          >
            <ArrowRight className="w-8 h-8" />
          </button>
        </div>
        
        <div className="mt-6 text-slate-400 text-sm flex items-center gap-2 font-medium">
          <RotateCcw className="w-4 h-4" /> 点击卡片翻面
        </div>
      </main>
    </div>
  );
};
