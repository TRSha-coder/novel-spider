import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Chapter, Novel } from '../types';
import { getChapterById, getNovelById, getChaptersByNovelId } from '../api';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Home,
  Loader2, List, X, ChevronUp, Moon, Sun,
} from 'lucide-react';
import { saveProgress } from '../hooks/useReadingProgress';

const FONT_SIZE_KEY = 'reader_font_size';
const DARK_MODE_KEY = 'reader_dark_mode';

export const Reader = () => {
  const { novelId, chapterId } = useParams<{ novelId: string; chapterId: string }>();
  const navigate = useNavigate();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    return saved ? parseInt(saved) : 18;
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem(DARK_MODE_KEY) === 'true';
  });
  const [tocOpen, setTocOpen] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const tocRef = useRef<HTMLDivElement>(null);
  const currentItemRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  // 持久化字体大小
  const changeFontSize = (delta: number) => {
    setFontSize(f => {
      const next = Math.min(28, Math.max(12, f + delta));
      localStorage.setItem(FONT_SIZE_KEY, String(next));
      return next;
    });
  };

  // 持久化夜间模式
  const toggleDarkMode = () => {
    setDarkMode(d => {
      const next = !d;
      localStorage.setItem(DARK_MODE_KEY, String(next));
      return next;
    });
  };

  // 获取数据
  useEffect(() => {
    if (!novelId || !chapterId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [novelData, chapterData, chaptersData] = await Promise.all([
          getNovelById(novelId),
          getChapterById(novelId, chapterId),
          getChaptersByNovelId(novelId),
        ]);
        setNovel(novelData);
        setChapter(chapterData);
        setChapters(chaptersData);
      } catch (err) {
        console.error('Failed to fetch chapter:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [novelId, chapterId]);

  // 切换章节时滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTocOpen(false);
  }, [chapterId]);

  // 保存阅读进度
  useEffect(() => {
    if (!novel || !chapter || !novelId || !chapterId) return;
    saveProgress({
      novelId,
      novelTitle: novel.title,
      novelCover: novel.cover,
      novelAuthor: novel.author,
      chapterId,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
    });
  }, [novel, chapter, novelId, chapterId]);

  // 滚动进度条 + 返回顶部按钮
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight) * 100;
      setScrollPct(Math.min(100, pct || 0));
      setShowTop(el.scrollTop > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 打开目录时滚动到当前章节
  useEffect(() => {
    if (tocOpen && currentItemRef.current) {
      setTimeout(() => {
        currentItemRef.current?.scrollIntoView({ block: 'center' });
      }, 50);
    }
  }, [tocOpen]);

  // 键盘左右键切换章节
  useEffect(() => {
    if (!novelId || chapters.length === 0) return;
    const currentIndex = chapters.findIndex(c => c.id === chapterId);
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const next = chapters[currentIndex + 1];
        if (next) navigate(`/novel/${novelId}/chapter/${next.id}`);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const prev = chapters[currentIndex - 1];
        if (prev) navigate(`/novel/${novelId}/chapter/${prev.id}`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chapters, chapterId, novelId, navigate]);

  // 触摸滑动切换章节
  useEffect(() => {
    if (!novelId || chapters.length === 0) return;
    const currentIndex = chapters.findIndex(c => c.id === chapterId);
    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;
      if (Math.abs(dx) < 60) return; // 忽略小幅滑动
      if (dx < 0) {
        // 向左滑 → 下一话
        const next = chapters[currentIndex + 1];
        if (next) navigate(`/novel/${novelId}/chapter/${next.id}`);
      } else {
        // 向右滑 → 上一话
        const prev = chapters[currentIndex - 1];
        if (prev) navigate(`/novel/${novelId}/chapter/${prev.id}`);
      }
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [chapters, chapterId, novelId, navigate]);

  const currentIndex = chapters.findIndex(c => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>加载中...</span>
      </div>
    );
  }

  if (!novel || !chapter) {
    return (
      <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900 min-h-screen' : ''}`}>
        <div className="text-center py-12">
          <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>未找到该章节</p>
          <Link to={`/novel/${novelId}`} className="inline-flex items-center space-x-2 mt-4 text-indigo-500 hover:text-indigo-400">
            <ArrowLeft className="h-4 w-4" />
            <span>返回小说详情</span>
          </Link>
        </div>
      </div>
    );
  }

  const paragraphs = chapter.content.split('\n\n').filter(p => p.trim());

  const bg = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const navBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white';
  const navText = darkMode ? 'text-gray-200' : 'text-gray-600';
  const navHover = darkMode ? 'hover:text-white hover:bg-gray-700' : 'hover:text-gray-900 hover:bg-gray-100';
  const articleBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = darkMode ? 'text-gray-200' : 'text-gray-800';
  const headerText = darkMode ? 'text-gray-300' : 'text-gray-700';
  const progressBg = darkMode ? 'bg-gray-700' : 'bg-gray-200';

  return (
    <div className={`min-h-screen ${bg}`}>

      {/* 阅读进度条 */}
      <div className={`fixed top-0 left-0 right-0 z-50 h-1 ${progressBg}`}>
        <div
          className="h-full bg-indigo-500 transition-all duration-100"
          style={{ width: `${scrollPct}%` }}
        />
      </div>

      {/* 顶部导航栏 */}
      <nav className={`${navBg} shadow-sm sticky top-1 z-40`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link
              to={`/novel/${novelId}`}
              className={`flex items-center space-x-1 ${navText} ${navHover} rounded-lg p-2`}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline text-sm">目录</span>
            </Link>

            {/* 章节标题（居中） */}
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} truncate max-w-[40%] text-center`}>
              第{chapter.number}话
            </p>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => changeFontSize(-2)}
                className={`p-2 ${navText} ${navHover} rounded-lg text-sm font-bold`}
                title="缩小字体"
              >A-</button>
              <button
                onClick={() => changeFontSize(2)}
                className={`p-2 ${navText} ${navHover} rounded-lg text-sm font-bold`}
                title="放大字体"
              >A+</button>
              <button
                onClick={toggleDarkMode}
                className={`p-2 ${navText} ${navHover} rounded-lg`}
                title={darkMode ? '切换日间模式' : '切换夜间模式'}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setTocOpen(true)}
                className={`p-2 ${navText} ${navHover} rounded-lg`}
                title="目录"
              >
                <List className="h-5 w-5" />
              </button>
              <Link
                to="/"
                className={`p-2 ${navText} ${navHover} rounded-lg`}
                title="首页"
              >
                <Home className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 目录抽屉 */}
      {tocOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* 遮罩 */}
          <div className="flex-1 bg-black/50" onClick={() => setTocOpen(false)} />
          {/* 抽屉主体 */}
          <div ref={tocRef} className={`w-80 max-w-[90vw] ${darkMode ? 'bg-gray-800' : 'bg-white'} h-full flex flex-col shadow-xl`}>
            <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div>
                <h3 className={`font-bold text-sm line-clamp-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{novel.title}</h3>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>共{chapters.length}话</p>
              </div>
              <button onClick={() => setTocOpen(false)} className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <X className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chapters.map((ch) => {
                const isCurrent = ch.id === chapterId;
                return (
                  <button
                    key={ch.id}
                    ref={isCurrent ? currentItemRef : null}
                    onClick={() => navigate(`/novel/${novelId}/chapter/${ch.id}`)}
                    className={`w-full text-left px-4 py-3 border-b transition-colors ${
                      darkMode
                        ? `border-gray-700 ${isCurrent ? 'bg-indigo-900 text-indigo-300 font-semibold' : 'text-gray-300 hover:bg-gray-700'}`
                        : `border-gray-100 ${isCurrent ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`
                    }`}
                  >
                    <p className="text-sm line-clamp-1">第{ch.number}话　{ch.title}</p>
                    {ch.publishDate && (
                      <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{ch.publishDate}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 正文区域 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 text-center">
          <h1 className={`text-xl font-bold mb-1 ${headerText}`}>{novel.title}</h1>
          <h2 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            第{chapter.number}话　{chapter.title}
          </h2>
          {chapter.publishDate && (
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{chapter.publishDate}</p>
          )}
        </header>

        <article className={`${articleBg} rounded-lg shadow-sm p-6 sm:p-8`}>
          <div
            className={`max-w-none leading-loose ${textColor}`}
            style={{ fontSize: `${fontSize}px`, lineHeight: 2.2 }}
          >
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => (
                <p key={index} className="mb-6 indent-8">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                本章内容为空
              </p>
            )}
          </div>
        </article>

        {/* 上一话/下一话导航 */}
        <div className="flex items-center justify-between mt-8 gap-4">
          {prevChapter ? (
            <Link
              to={`/novel/${novelId}/chapter/${prevChapter.id}`}
              className={`flex items-center space-x-2 flex-1 ${darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-700 hover:shadow-md'} px-5 py-4 rounded-lg shadow-sm transition-all`}
            >
              <ChevronLeft className="h-5 w-5 flex-shrink-0" />
              <div className="text-left min-w-0">
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>上一话</p>
                <p className="font-medium text-sm truncate">第{prevChapter.number}话　{prevChapter.title}</p>
              </div>
            </Link>
          ) : <div className="flex-1" />}

          {nextChapter ? (
            <Link
              to={`/novel/${novelId}/chapter/${nextChapter.id}`}
              className="flex items-center space-x-2 flex-1 bg-indigo-600 px-5 py-4 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors text-white"
            >
              <div className="text-right flex-1 min-w-0">
                <p className="text-xs text-indigo-200">下一话</p>
                <p className="font-medium text-sm truncate">第{nextChapter.number}话　{nextChapter.title}</p>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0" />
            </Link>
          ) : (
            <div className="flex-1 text-center">
              <Link
                to={`/novel/${novelId}`}
                className={`inline-flex items-center space-x-2 ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:shadow-md'} px-5 py-4 rounded-lg shadow-sm transition-all`}
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium text-sm">返回目录</span>
              </Link>
            </div>
          )}
        </div>

        <p className={`text-center text-xs mt-6 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>
          ← → 方向键 / 左右滑动 切换章节
        </p>
      </div>

      {/* 返回顶部按钮 */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
          title="返回顶部"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};
