import React, { useState, useEffect } from 'react';
import { Book } from './types';
import { getBooks, saveBooks } from './services/db';
import { Home } from './components/Home';
import { BookEditor } from './components/BookEditor';
import { FlashcardViewer } from './components/FlashcardViewer';
import { GameView } from './components/GameView';
import { canPlayBookGame } from './utils/game';

type ViewState = 'home' | 'editor' | 'viewer' | 'game';
type GameSource = 'home' | 'viewer';

// 管理员密码（仅用于本地开发导出，不涉及安全场景）
const ADMIN_PASSWORD = 'letstalk2025';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [gameSource, setGameSource] = useState<GameSource>('home');

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedBooks = await getBooks();
        
        // 如果数据库为空，尝试从 public/samples/manifest.json 加载预置数据
        if (storedBooks.length === 0) {
          try {
            const response = await fetch('./samples/manifest.json');
            if (response.ok) {
              const manifestBooks = await response.json();
              if (Array.isArray(manifestBooks) && manifestBooks.length > 0) {
                setBooks(manifestBooks);
                // 同时保存到本地数据库，方便后续离线使用或修改
                await saveBooks(manifestBooks);
                return;
              }
            }
          } catch (e) {
            console.warn('No manifest.json found or failed to load preset books');
          }
        }
        
        setBooks(storedBooks);
      } catch (error) {
        console.error('Failed to load books:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const handleToggleAdmin = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      return;
    }
    const pwd = prompt('请输入管理员密码：');
    if (pwd === ADMIN_PASSWORD) {
      setIsAdminMode(true);
    } else if (pwd !== null) {
      alert('密码错误');
    }
  };

  const handleSaveBook = async (updatedBook: Book) => {
    const existingIndex = books.findIndex((b) => b.id === updatedBook.id);
    let newBooks;
    if (existingIndex >= 0) {
      newBooks = [...books];
      newBooks[existingIndex] = updatedBook;
    } else {
      newBooks = [...books, updatedBook];
    }
    setBooks(newBooks);
    await saveBooks(newBooks);
    setCurrentView('home');
    setActiveBookId(null);
  };

  const handleAddBook = () => {
    setActiveBookId(null);
    setCurrentView('editor');
  };

  const handleEditBook = (id: string) => {
    setActiveBookId(id);
    setCurrentView('editor');
  };

  const handleViewBook = (id: string) => {
    setActiveBookId(id);
    setCurrentView('viewer');
  };

  const handlePlayGame = (id: string, source: GameSource = 'home') => {
    setActiveBookId(id);
    setGameSource(source);
    setCurrentView('game');
  };

  const handleBackFromGame = () => {
    if (gameSource === 'viewer' && activeBookId) {
      setCurrentView('viewer');
      return;
    }

    handleBackToHome();
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setActiveBookId(null);
  };

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#ff006e] opacity-5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-[#00d9ff] opacity-5 rounded-full blur-3xl pointer-events-none"></div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff006e] to-[#ff8c00] mb-4 relative z-10">需要配置 API Key</h1>
        <p className="text-slate-600 mb-8 max-w-md relative z-10 font-medium leading-relaxed">
          为了生成高质量的绘本配图，我们需要使用 Gemini 的高级图像生成模型。请选择一个关联了有效结算账号的 Google Cloud 项目的 API Key。
        </p>
        <button
          onClick={handleSelectKey}
          className="px-8 py-4 bg-gradient-to-r from-[#ff006e] to-[#ff8c00] text-white rounded-full font-bold hover:shadow-lg hover:shadow-[#ff006e]/20 transition-all transform hover:-translate-y-1 active:scale-95 relative z-10"
        >
          选择 API Key
        </button>
      </div>
    );
  }

  if (isLoading || hasKey === null) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#ff006e] opacity-5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-[#00d9ff] opacity-5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00d9ff] border-t-transparent relative z-10"></div>
      </div>
    );
  }

  const activeBook = books.find((b) => b.id === activeBookId);

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-[#00d9ff]/20">
      {currentView === 'home' && (
        <Home
          books={books}
          onAddBook={handleAddBook}
          onEditBook={handleEditBook}
          onViewBook={handleViewBook}
          onPlayGame={handlePlayGame}
          isAdminMode={isAdminMode}
          onToggleAdmin={handleToggleAdmin}
          allBooks={books}
        />
      )}
      {currentView === 'editor' && (
        <BookEditor
          initialBook={activeBook}
          onSave={handleSaveBook}
          onCancel={handleBackToHome}
        />
      )}
      {currentView === 'viewer' && activeBook && (
        <FlashcardViewer
          book={activeBook}
          onBack={handleBackToHome}
          onPlayGame={canPlayBookGame(activeBook) ? () => handlePlayGame(activeBook.id, 'viewer') : undefined}
        />
      )}
      {currentView === 'game' && activeBook && (
        <GameView
          book={activeBook}
          onBack={handleBackFromGame}
          backLabel={gameSource === 'viewer' ? '返回绘本' : '返回首页'}
        />
      )}
    </div>
  );
}
