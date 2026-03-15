import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Chapter, Novel } from '../types';
import { getChapterById, getNovelById, getChaptersByNovelId } from '../api';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Home,
  Loader2, List, X, ChevronUp,
} from 'lucide-react';
import { saveProgress } from '../hooks/useReadingProgress';

export const Reader = () => {
  const { novelId, chapterId } = useParams<{ novelId: string; chapterId: string }>();
  const navigate = useNavigate();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [tocOpen, setTocOpen] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const tocRef = useRef<HTMLDivElement>(null);
  const currentItemRef = useRef<HTMLButtonElement>(null);

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

  const currentIndex = chapters.findIndex(c => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    );
  }

  if (!novel || !chapter) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">未找到该章节</p>
          <Link to={`/novel/${novelId}`} className="inline-flex items-center space-x-2 mt-4 text-indigo-600 hover:text-indigo-700">
            <ArrowLeft className="h-4 w-4" />
            <span>返回小说详情</span>
          </Link>
        </div>
      </div>
    );
  }

  const paragraphs = chapter.content.split('\n\n').filter(p => p.trim());

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 阅读进度条 */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
        <div
          className="h-full bg-indigo-500 transition-all duration-100"
          style={{ width: `${scrollPct}%` }}
        />
      </div>

      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm sticky top-1 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link
              to={`/novel/${novelId}`}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline text-sm">目录</span>
            </Link>

            {/* 章节标题（居中） */}
            <p className="text-sm font-medium text-gray-700 truncate max-w-[40%] text-center">
              第{chapter.number}话
            </p>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setFontSize(f => Math.max(12, f - 2))}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-sm font-bold"
              >A-</button>
              <button
                onClick={() => setFontSize(f => Math.min(28, f + 2))}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-sm font-bold"
              >A+</button>
              <button
                onClick={() => setTocOpen(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                title="目录"
              >
                <List className="h-5 w-5" />
              </button>
              <Link to="/" className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg" title="首页">
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
          <div className="flex-1 bg-black/40" onClick={() => setTocOpen(false)} />
          {/* 抽屉主体 */}
          <div ref={tocRef} className="w-80 max-w-[90vw] bg-white h-full flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{novel.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">共{chapters.length}话</p>
              </div>
              <button onClick={() => setTocOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5 text-gray-500" />
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
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                      isCurrent
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-sm line-clamp-1">第{ch.number}话　{ch.title}</p>
                    {ch.publishDate && (
                      <p className="text-xs text-gray-400 mt-0.5">{ch.publishDate}</p>
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
          <h1 className="text-xl font-bold text-gray-700 mb-1">{novel.title}</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">第{chapter.number}话　{chapter.title}</h2>
          {chapter.publishDate && <p className="text-sm text-gray-400">{chapter.publishDate}</p>}
        </header>

        <article className="bg-white rounded-lg shadow-sm p-8">
          <div
            className="max-w-none text-gray-800 leading-loose"
            style={{ fontSize: `${fontSize}px`, lineHeight: 2.2 }}
          >
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="mb-6 indent-8">
                {paragraph}
              </p>
            ))}
          </div>
        </article>

        {/* 上一话/下一话导航 */}
        <div className="flex items-center justify-between mt-8 gap-4">
          {prevChapter ? (
            <Link
              to={`/novel/${novelId}/chapter/${prevChapter.id}`}
              className="flex items-center space-x-2 flex-1 bg-white px-5 py-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-gray-700"
            >
              <ChevronLeft className="h-5 w-5 flex-shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-xs text-gray-400">上一话</p>
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
                className="inline-flex items-center space-x-2 bg-white px-5 py-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium text-sm">返回目录</span>
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">← → 方向键切换章节</p>
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
