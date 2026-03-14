import React, { useState } from 'react';
import { Book } from '../types';
import { Plus, BookOpen, Settings, Download, Shield, ShieldOff } from 'lucide-react';
import { motion } from 'motion/react';
import { exportBookAsZip } from '../utils/exportSamples';

interface HomeProps {
  books: Book[];
  onAddBook: () => void;
  onEditBook: (id: string) => void;
  onViewBook: (id: string) => void;
  isAdminMode: boolean;
  onToggleAdmin: () => void;
  allBooks: Book[];
}

// 浮动装饰元素
const FloatingShape = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <motion.div
    className={className}
    animate={{ y: [0, -12, 0], rotate: [0, 8, -8, 0] }}
    transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

export const Home: React.FC<HomeProps> = ({
  books,
  onAddBook,
  onEditBook,
  onViewBook,
  isAdminMode,
  onToggleAdmin,
  allBooks,
}) => {
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleExport = async (e: React.MouseEvent, book: Book) => {
    e.stopPropagation();
    setExportingId(book.id);
    try {
      let existingManifest: Book[] = [];
      try {
        const res = await fetch('/samples/manifest.json');
        if (res.ok) existingManifest = await res.json();
      } catch {}
      await exportBookAsZip(book, existingManifest);
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="min-h-screen font-sans relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #f0f4ff 0%, #fdf6ff 50%, #f0fbff 100%)' }}
    >
      {/* 页面级背景光晕 */}
      <div className="absolute top-[-20%] left-[-15%] w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,0,110,0.07) 0%, transparent 70%)' }} />
      <div className="absolute top-[10%] right-[-10%] w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,217,255,0.07) 0%, transparent 70%)' }} />

      <header className="mb-10 text-center relative z-10 pt-12 pb-6 px-6 overflow-hidden" style={{ minHeight: 220 }}>
        {/* ===== header 内装饰层 ===== */}

        {/* 浮动几何图形 */}
        <FloatingShape delay={0}
          className="absolute top-4 left-6 w-9 h-9 rounded-2xl opacity-50 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, #ff006e, #ff8c00)' } as React.CSSProperties}
        />
        <FloatingShape delay={1.2}
          className="absolute top-6 right-8 w-6 h-6 rounded-full opacity-60 pointer-events-none"
          style={{ background: '#00d9ff' } as React.CSSProperties}
        />
        <FloatingShape delay={2}
          className="absolute bottom-10 left-10 w-5 h-5 rotate-45 opacity-45 pointer-events-none"
          style={{ background: '#ff8c00' } as React.CSSProperties}
        />
        <FloatingShape delay={0.7}
          className="absolute bottom-8 right-10 w-7 h-7 rounded-xl opacity-45 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, #00d9ff, #ff006e)' } as React.CSSProperties}
        />
        <FloatingShape delay={1.8}
          className="absolute top-1/2 left-4 w-3 h-3 rounded-full opacity-50 pointer-events-none"
          style={{ background: '#ff006e' } as React.CSSProperties}
        />
        <FloatingShape delay={2.5}
          className="absolute top-1/2 right-5 w-4 h-4 rotate-12 rounded opacity-40 pointer-events-none"
          style={{ background: '#ff8c00' } as React.CSSProperties}
        />

        {/* 星点装饰 - 围绕标题区域 */}
        {[
          { top: '12%', left: '18%',  color: '#ff006e' },
          { top: '15%', left: '78%',  color: '#00d9ff' },
          { top: '38%', left: '12%',  color: '#ff8c00' },
          { top: '42%', left: '85%',  color: '#ff006e' },
          { top: '65%', left: '22%',  color: '#00d9ff' },
          { top: '68%', left: '72%',  color: '#ff8c00' },
          { top: '82%', left: '45%',  color: '#ff006e' },
          { top: '20%', left: '50%',  color: '#00d9ff' },
        ].map((s, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
            style={{ top: s.top, left: s.left, background: s.color }}
            animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.7, 1.4, 0.7] }}
            transition={{ duration: 2.2 + i * 0.35, repeat: Infinity, delay: i * 0.25 }}
          />
        ))}

        {/* 标题装饰条 */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6 }}
          className="w-16 h-1 mx-auto mb-4 rounded-full"
          style={{ background: 'linear-gradient(90deg, #ff006e, #00d9ff)' }}
        />

        <motion.h1
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-black mb-1 leading-tight"
          style={{
            background: 'linear-gradient(90deg, #ff006e 0%, #ff8c00 45%, #00d9ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 12px rgba(255,0,110,0.25))',
          }}
        >
          低幼宝宝英语启蒙
        </motion.h1>

        <motion.p
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-sm font-medium tracking-widest mt-2"
          style={{ color: 'rgba(0,180,210,0.85)' }}
        >
          ✦ 海尼曼分级阅读陪伴 ✦
        </motion.p>

        {/* 彩色分隔线 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-1.5 mt-4"
        >
          {['#ff006e', '#ff8c00', '#00d9ff', '#ff8c00', '#ff006e'].map((c, i) => (
            <div key={i} className="rounded-full"
              style={{ width: i === 2 ? 20 : 6, height: 4, background: c, opacity: 0.7 }} />
          ))}
        </motion.div>

        {/* 管理员模式切换 */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={onToggleAdmin}
          className={`mt-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
            isAdminMode
              ? 'bg-violet-100 text-violet-600 border-violet-300 hover:bg-violet-200'
              : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 hover:text-slate-500'
          }`}
        >
          {isAdminMode ? (
            <><ShieldOff className="w-3 h-3" /> 退出管理员模式</>
          ) : (
            <><Shield className="w-3 h-3" /> 管理员</>
          )}
        </motion.button>

        {isAdminMode && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-xs text-violet-500 font-medium"
          >
            管理员模式：点击绘本上的导出按钮，下载 ZIP 后解压放入 public/samples/
          </motion.p>
        )}
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 max-w-4xl mx-auto px-4 pb-12 relative z-10">
        {books.map((book, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            whileHover={{ scale: 1.04, y: -4 }}
            whileTap={{ scale: 0.97 }}
            key={book.id}
            className="rounded-3xl overflow-hidden flex flex-col cursor-pointer relative group"
            style={{
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
            onClick={() => onViewBook(book.id)}
          >
            {/* 悬停时的霓虹边框光效 */}
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ boxShadow: 'inset 0 0 0 1.5px rgba(255,0,110,0.5), 0 0 20px rgba(255,0,110,0.15)' }} />

            <div className="aspect-[3/4] bg-black/20 flex items-center justify-center relative overflow-hidden">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover scale-110 transition-transform duration-500 group-hover:scale-125"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <BookOpen className="w-12 h-12 text-white/20 transition-transform duration-300 group-hover:scale-110 group-hover:text-[#00d9ff]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* 编辑按钮 */}
              <button
                onClick={(e) => { e.stopPropagation(); onEditBook(book.id); }}
                className="absolute top-3 right-3 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                style={{ background: 'rgba(255,0,110,0.8)', backdropFilter: 'blur(4px)' }}
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* 管理员导出按钮 */}
              {isAdminMode && (
                <button
                  onClick={(e) => handleExport(e, book)}
                  disabled={exportingId === book.id}
                  className="absolute bottom-3 right-3 p-2 rounded-full text-white shadow-md transition-all hover:scale-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(109,40,217,0.85)' }}
                  title="导出为样例资源 ZIP"
                >
                  {exportingId === book.id ? (
                    <span className="w-4 h-4 block rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            <div className="p-3 relative z-10">
              <h3 className="font-bold text-center truncate mb-0.5 text-sm transition-colors text-slate-800 group-hover:text-[#ff006e]">
                {book.title}
              </h3>
              <p className="text-xs text-center text-slate-400">
                {book.cards.length} 张卡片
              </p>
              {isAdminMode && (
                <p className="text-xs text-violet-400 text-center mt-0.5 font-mono truncate">{book.id}</p>
              )}
            </div>
          </motion.div>
        ))}

        {/* 添加新绘本 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: books.length * 0.06 }}
          whileHover={{ scale: 1.04, y: -4 }}
          whileTap={{ scale: 0.97 }}
          onClick={onAddBook}
          className="rounded-3xl aspect-[3/4] flex flex-col items-center justify-center cursor-pointer group transition-all duration-300"
          style={{
            background: 'rgba(255,255,255,0.6)',
            border: '1.5px dashed rgba(0,217,255,0.4)',
          }}
        >
          <motion.div
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300"
            style={{
              background: 'rgba(0,217,255,0.1)',
              border: '1px solid rgba(0,217,255,0.3)',
              boxShadow: '0 0 0 0 rgba(0,217,255,0)',
            }}
          >
            <Plus className="w-7 h-7 transition-colors" style={{ color: 'rgba(0,217,255,0.5)' }} />
          </motion.div>
          <span className="text-sm font-medium text-[#00b8d4]/70 transition-colors group-hover:text-[#00b8d4]">
            添加新绘本
          </span>
        </motion.div>
      </div>
    </div>
  );
};
