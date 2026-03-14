import React, { useState } from 'react';
import { Book, Flashcard, STYLES } from '../types';
import { ArrowLeft, Plus, Trash2, Wand2, Save, Image as ImageIcon, Volume2, Settings, BookOpen, Key, Eye, EyeOff } from 'lucide-react';
import { generateImage, generateAudio } from '../services/ai';

interface BookEditorProps {
  initialBook?: Book;
  onSave: (book: Book) => void;
  onCancel: () => void;
}

export const BookEditor: React.FC<BookEditorProps> = ({ initialBook, onSave, onCancel }) => {
  const [book, setBook] = useState<Book>(
    initialBook || {
      id: Date.now().toString(),
      title: '',
      style: 'cartoon',
      cards: [],
    }
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('user_gemini_api_key') || '');
  const [showKey, setShowKey] = useState(false);

  const handleSaveApiKey = (value: string) => {
    setApiKey(value);
    if (value.trim()) {
      localStorage.setItem('user_gemini_api_key', value.trim());
    } else {
      localStorage.removeItem('user_gemini_api_key');
    }
  };

  const handleAddCard = () => {
    setBook({
      ...book,
      cards: [
        ...book.cards,
        { id: Date.now().toString(), word: '', sentence: '' },
      ],
    });
  };

  const handleUpdateCard = (id: string, field: keyof Flashcard, value: string) => {
    setBook({
      ...book,
      cards: book.cards.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    });
  };

  const handleRemoveCard = (id: string) => {
    setBook({
      ...book,
      cards: book.cards.filter((c) => c.id !== id),
    });
  };

  const handleGenerateContent = async () => {
    setIsGenerating(true);
    let currentBook = { ...book };
    try {
      // Generate cover if missing
      if (!currentBook.coverImage && currentBook.title) {
        setProgress('正在生成封面图片...');
        try {
          currentBook.coverImage = await generateImage(currentBook.title, currentBook.style);
          setBook({ ...currentBook });
        } catch (e: any) {
          if (e.message === 'API_KEY_ERROR') throw e;
          console.error('Failed to generate cover image', e);
        }
      }

      for (let i = 0; i < currentBook.cards.length; i++) {
        const card = { ...currentBook.cards[i] };
        let cardUpdated = false;
        
        if (card.word && !card.wordImage) {
          setProgress(`正在生成卡片 ${i + 1} 的单词图片...`);
          try {
            card.wordImage = await generateImage(card.word, currentBook.style);
            cardUpdated = true;
          } catch (e: any) {
            if (e.message === 'API_KEY_ERROR') throw e;
            console.error(`Failed to generate word image for card ${i + 1}`, e);
          }
        }
        if (card.word && !card.wordAudio) {
          setProgress(`正在生成卡片 ${i + 1} 的单词发音...`);
          try {
            card.wordAudio = await generateAudio(card.word);
            cardUpdated = true;
          } catch (e: any) {
            if (e.message === 'API_KEY_ERROR') throw e;
            console.error(`Failed to generate word audio for card ${i + 1}`, e);
          }
        }
        if (card.sentence && !card.sentenceImage) {
          setProgress(`正在生成卡片 ${i + 1} 的句子图片...`);
          try {
            card.sentenceImage = await generateImage(card.sentence, currentBook.style);
            cardUpdated = true;
          } catch (e: any) {
            if (e.message === 'API_KEY_ERROR') throw e;
            console.error(`Failed to generate sentence image for card ${i + 1}`, e);
          }
        }
        if (card.sentence && !card.sentenceAudio) {
          setProgress(`正在生成卡片 ${i + 1} 的句子发音...`);
          try {
            card.sentenceAudio = await generateAudio(card.sentence);
            cardUpdated = true;
          } catch (e: any) {
            if (e.message === 'API_KEY_ERROR') throw e;
            console.error(`Failed to generate sentence audio for card ${i + 1}`, e);
          }
        }

        if (cardUpdated) {
          const newCards = [...currentBook.cards];
          newCards[i] = card;
          currentBook = { ...currentBook, cards: newCards };
          setBook(currentBook);
        }
      }

      setProgress('生成完成！');
      setTimeout(() => setProgress(''), 2000);
    } catch (error: any) {
      console.error(error);
      if (error.message === 'API_KEY_ERROR') {
        setProgress('API Key 无效或未配置，请刷新页面重新选择。');
      } else {
        setProgress('生成中断，部分内容可能未生成。请稍后再试。');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-[#ff006e] opacity-5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-[#00d9ff] opacity-5 rounded-full blur-3xl pointer-events-none"></div>

      <header className="bg-white/80 backdrop-blur-md shadow-sm p-4 sticky top-0 z-20 flex items-center justify-between border-b border-slate-100">
        <button onClick={onCancel} className="p-2 text-slate-500 hover:bg-slate-100 hover:text-[#ff006e] rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">{initialBook ? '编辑绘本' : '新建绘本'}</h1>
        <button
          onClick={() => onSave(book)}
          disabled={!book.title || isGenerating}
          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#ff006e] to-[#ff8c00] text-white rounded-full font-medium shadow-md shadow-[#ff006e]/20 disabled:opacity-50 hover:shadow-lg hover:shadow-[#ff006e]/40 transition-all"
        >
          <Save className="w-4 h-4" /> 保存
        </button>
      </header>

      <main className="p-6 max-w-2xl mx-auto space-y-8 relative z-10">
        {/* API Key 配置 */}
        <section className="bg-amber-50 border border-amber-200 p-5 rounded-3xl space-y-3">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
            <Key className="w-4 h-4" />
            配置 Google Gemini API Key（生成图片和发音必填）
          </div>
          <p className="text-xs text-amber-600 leading-relaxed">
            需要使用 Gemini API 才能生成配图和发音。请前往{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline font-medium">
              Google AI Studio
            </a>{' '}
            获取免费 API Key，输入后自动保存在本地浏览器中。
          </p>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => handleSaveApiKey(e.target.value)}
              className="w-full p-3 pr-12 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none bg-white text-sm font-mono"
              placeholder="粘贴你的 API Key，例如：AIzaSy..."
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600 transition-colors"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {apiKey && (
            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
              API Key 已保存到本地
            </p>
          )}
        </section>

        {/* Book Settings */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#00d9ff]" /> 绘本设置
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">绘本主题 (例如: At the Market)</label>
            <input
              type="text"
              value={book.title}
              onChange={(e) => setBook({ ...book, title: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00d9ff] focus:border-[#00d9ff] outline-none transition-all bg-slate-50 focus:bg-white"
              placeholder="输入绘本主题..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">配图风格</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setBook({ ...book, style: style.id })}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all duration-300 ${
                    book.style === style.id
                      ? 'border-[#ff006e] bg-[#ff006e]/5 text-[#ff006e] shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-[#00d9ff]/50 hover:bg-[#00d9ff]/5'
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Flashcards */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#ff8c00]" /> 闪卡内容 ({book.cards.length})
            </h2>
            {book.cards.length === 0 && (
              <button
                onClick={handleAddCard}
                className="flex items-center gap-1 px-4 py-2 bg-[#00d9ff]/10 text-[#00d9ff] rounded-xl text-sm font-bold hover:bg-[#00d9ff]/20 transition-colors"
              >
                <Plus className="w-4 h-4" /> 添加卡片
              </button>
            )}
          </div>

          {book.cards.map((card, index) => (
            <div key={card.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative group transition-all duration-300 hover:shadow-md hover:border-[#00d9ff]/30">
              <button
                onClick={() => handleRemoveCard(card.id)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-[#ff006e] hover:bg-[#ff006e]/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg mb-3 group-hover:bg-[#00d9ff]/10 group-hover:text-[#00d9ff] transition-colors">
                  卡片 {index + 1}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">核心词汇 (正面)</label>
                  <input
                    type="text"
                    value={card.word}
                    onChange={(e) => handleUpdateCard(card.id, 'word', e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#ff006e] outline-none transition-all bg-slate-50 focus:bg-white"
                    placeholder="例如: fruit"
                  />
                  <div className="flex gap-3 mt-2 text-xs text-slate-400 font-medium">
                    <span className={`flex items-center gap-1 transition-colors ${card.wordImage ? 'text-[#00d9ff]' : ''}`}><ImageIcon className="w-3 h-3" /> 图片</span>
                    <span className={`flex items-center gap-1 transition-colors ${card.wordAudio ? 'text-[#ff006e]' : ''}`}><Volume2 className="w-3 h-3" /> 发音</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">教材原句 (背面)</label>
                  <input
                    type="text"
                    value={card.sentence}
                    onChange={(e) => handleUpdateCard(card.id, 'sentence', e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#ff8c00] outline-none transition-all bg-slate-50 focus:bg-white"
                    placeholder="例如: Look at the fruits."
                  />
                  <div className="flex gap-3 mt-2 text-xs text-slate-400 font-medium">
                    <span className={`flex items-center gap-1 transition-colors ${card.sentenceImage ? 'text-[#00d9ff]' : ''}`}><ImageIcon className="w-3 h-3" /> 图片</span>
                    <span className={`flex items-center gap-1 transition-colors ${card.sentenceAudio ? 'text-[#ff006e]' : ''}`}><Volume2 className="w-3 h-3" /> 发音</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {book.cards.length === 0 && (
            <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">还没有添加任何卡片，点击上方添加吧！</p>
            </div>
          )}

          {book.cards.length > 0 && (
            <button
              onClick={handleAddCard}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#00d9ff]/10 text-[#00d9ff] rounded-2xl text-sm font-bold hover:bg-[#00d9ff]/20 transition-colors border-2 border-dashed border-[#00d9ff]/30 hover:border-[#00d9ff]/60"
            >
              <Plus className="w-4 h-4" /> 添加卡片
            </button>
          )}
        </section>

        {/* AI Generation Action */}
        <section className="bg-gradient-to-br from-[#ff006e]/10 via-[#ff8c00]/10 to-[#00d9ff]/10 p-8 rounded-3xl border border-white/50 text-center relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-black text-slate-800 mb-2">AI 智能生成</h3>
            <p className="text-sm text-slate-600 mb-6 font-medium">
              一键为所有卡片生成可爱的配图和纯正的英语发音。
            </p>
            <button
              onClick={handleGenerateContent}
              disabled={isGenerating || book.cards.length === 0}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#ff006e] via-[#ff8c00] to-[#00d9ff] hover:opacity-90 text-white rounded-2xl font-bold shadow-lg shadow-[#ff006e]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto transform hover:scale-105 active:scale-95"
            >
              {isGenerating ? (
                <span className="animate-pulse">{progress || '生成中...'}</span>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" /> 一键生成缺失的图片和发音
                </>
              )}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
