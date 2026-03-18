import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Book, Flashcard } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, RotateCcw, Volume2, Trophy, CheckCircle2, XCircle } from 'lucide-react';
import { createWavDataUri } from '../services/ai';
import { getGameMedia, getPlayableGameCards } from '../utils/game';

interface GameViewProps {
  book: Book;
  onBack: () => void;
  backLabel?: string;
}

interface GameQuestion {
  card: Flashcard;
  options: Flashcard[];
}

const shuffle = <T,>(items: T[]): T[] => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const getCardImage = (card: Flashcard) => getGameMedia(card)?.image;
const getCardAudio = (card: Flashcard) => getGameMedia(card)?.audio;
const getPromptText = (card: Flashcard) => getGameMedia(card)?.text || card.word || card.sentence;

const buildQuestions = (book: Book): GameQuestion[] => {
  const playableCards = getPlayableGameCards(book);

  return shuffle(playableCards).map((card) => {
    const distractors = shuffle(
      playableCards.filter((candidate) => candidate.id !== card.id)
    ).slice(0, Math.min(3, Math.max(0, playableCards.length - 1)));

    return {
      card,
      options: shuffle([card, ...distractors]),
    };
  });
};

export const GameView: React.FC<GameViewProps> = ({ book, onBack, backLabel = '返回首页' }) => {
  const questions = useMemo(() => buildQuestions(book), [book]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

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
    audio.play().catch((e) => console.error('Audio play error:', e));
  };

  const handleReplayAudio = () => {
    playAudio(currentQuestion ? getCardAudio(currentQuestion.card) : undefined);
  };

  const moveToNextQuestion = () => {
    setSelectedId(null);
    setWrongId(null);

    if (currentIndex >= questions.length - 1) {
      setIsFinished(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const handleSelectOption = (option: Flashcard) => {
    if (!currentQuestion || selectedId) return;

    if (option.id === currentQuestion.card.id) {
      setSelectedId(option.id);
      setCorrectCount((prev) => prev + 1);
      window.setTimeout(() => {
        moveToNextQuestion();
      }, 900);
      return;
    }

    setWrongId(option.id);
    window.setTimeout(() => {
      setWrongId(null);
    }, 600);
  };

  const handleRestart = () => {
    stopAudio();
    setCurrentIndex(0);
    setSelectedId(null);
    setWrongId(null);
    setCorrectCount(0);
    setIsFinished(false);
  };

  useEffect(() => {
    if (isFinished || !currentQuestion) return;
    handleReplayAudio();
  }, [currentIndex, isFinished]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  if (questions.length < 2) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-slate-500 mb-4 font-medium">这本绘本至少需要 2 张同时带图片和音频的卡片，才能开始游戏哦~</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gradient-to-r from-[#ff006e] to-[#ff8c00] text-white rounded-full font-bold shadow-md hover:shadow-lg transition-all"
        >
          {backLabel}
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#ff006e] opacity-5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-[#00d9ff] opacity-5 rounded-full blur-3xl pointer-events-none"></div>

        <header className="p-4 flex items-center justify-between bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20 border-b border-slate-100">
          <button onClick={onBack} className="p-2 text-[#ff8c00] hover:bg-[#ff8c00]/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-slate-800 truncate px-4">{book.title} 游戏完成</h1>
          <div className="w-10" />
        </header>

        <main className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border-4 border-[#ff8c00]/15 p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#ff8c00] to-[#ff006e] text-white flex items-center justify-center shadow-lg shadow-[#ff8c00]/30 mb-5">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-3">太棒啦！</h2>
            <p className="text-slate-500 font-medium mb-2">你完成了这本绘本的小挑战</p>
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff006e] to-[#00d9ff] mb-8">
              {correctCount} / {questions.length}
            </p>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={handleRestart}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#00d9ff] to-[#0088ff] text-white font-bold shadow-lg shadow-[#00d9ff]/25 active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> 再玩一次
              </button>
              <button
                onClick={onBack}
                className="w-full py-4 rounded-full bg-white text-slate-600 font-bold border border-slate-200 shadow-sm active:scale-95 transition-transform"
              >
                {backLabel}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#ff006e] opacity-5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-[#00d9ff] opacity-5 rounded-full blur-3xl pointer-events-none"></div>

      <header className="p-4 bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button onClick={onBack} className="p-2 text-[#ff8c00] hover:bg-[#ff8c00]/10 rounded-full transition-colors shrink-0">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="min-w-0 text-center flex-1">
            <h1 className="text-lg font-bold text-slate-800 truncate">{book.title}</h1>
            <p className="text-sm text-slate-400 font-medium">听一听，点对图片</p>
          </div>
          <div className="text-sm font-bold text-slate-500 bg-slate-50 rounded-full px-4 py-2 border border-slate-100 shrink-0">
            {currentIndex + 1} / {questions.length}
          </div>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#ff006e] via-[#ff8c00] to-[#00d9ff]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto p-6 relative z-10 flex flex-col items-center">
        <div className="w-full max-w-md text-center mb-6">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleReplayAudio}
            className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-[#ff8c00] to-[#ff006e] text-white shadow-xl shadow-[#ff8c00]/25 flex items-center justify-center"
          >
            <Volume2 className="w-12 h-12" />
          </motion.button>
          <p className="mt-4 text-xl font-black text-slate-800">听一听，找出对的图片</p>
          <p className="mt-2 text-sm text-slate-400 font-medium">不会的话，可以再点一次喇叭</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.card.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className={`grid grid-cols-2 gap-4 w-full ${currentQuestion.options.length === 2 ? 'max-w-2xl' : 'max-w-3xl'}`}
          >
            {currentQuestion.options.map((option) => {
              const image = getCardImage(option);
              const isCorrect = selectedId === option.id;
              const isWrong = wrongId === option.id;

              return (
                <motion.button
                  key={option.id}
                  whileTap={{ scale: selectedId ? 1 : 0.97 }}
                  animate={isWrong ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
                  transition={{ duration: 0.35 }}
                  onClick={() => handleSelectOption(option)}
                  disabled={!!selectedId}
                  className={`relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-white border-4 shadow-lg transition-all ${
                    isCorrect
                      ? 'border-emerald-400 shadow-emerald-200/60'
                      : isWrong
                        ? 'border-rose-400 shadow-rose-200/60'
                        : 'border-white hover:border-[#00d9ff]/40 hover:shadow-xl active:scale-[0.99]'
                  } ${selectedId ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {image ? (
                    <img src={image} alt={getPromptText(option)} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-black text-slate-200">?</div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-left">
                    <p className="text-white font-bold text-lg truncate">{option.word}</p>
                  </div>

                  {isCorrect && (
                    <div className="absolute inset-0 bg-emerald-500/18 flex items-center justify-center">
                      <div className="px-4 py-2 rounded-full bg-white text-emerald-600 font-black shadow-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> 答对啦
                      </div>
                    </div>
                  )}

                  {isWrong && (
                    <div className="absolute inset-0 bg-rose-500/12 flex items-center justify-center">
                      <div className="px-4 py-2 rounded-full bg-white text-rose-500 font-black shadow-lg flex items-center gap-2">
                        <XCircle className="w-5 h-5" /> 再试一次
                      </div>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
