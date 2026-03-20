import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Novel, Chapter } from '../types';
import { getNovelById, getChaptersByNovelId } from '../api';
import { ArrowLeft, Star, Calendar, BookOpen, Loader2, BookMarked, RotateCcw, AlertCircle, Search } from 'lucide-react';
import { getNovelProgress, ReadingRecord } from '../hooks/useReadingProgress';

export const NovelDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ReadingRecord | null>(null);
  const [chapterFilter, setChapterFilter] = useState('');

  useEffect(() => {
    if (!id) return;
    setProgress(getNovelProgress(id));

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [novelData, chaptersData] = await Promise.all([
          getNovelById(id),
          getChaptersByNovelId(id),
        ]);
        setNovel(novelData);
        setChapters(chaptersData);
      } catch (err) {
        console.error('Failed to fetch novel details:', err);
        setError('加载小说详情失败，请稍后重试。');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    );
  }

  if (error || !novel) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <p className="text-xl text-gray-600">{error || '未找到该小说'}</p>
          <Link to="/" className="inline-flex items-center space-x-2 mt-2 text-indigo-600 hover:text-indigo-700">
            <ArrowLeft className="h-4 w-4" />
            <span>返回首页</span>
          </Link>
        </div>
      </div>
    );
  }

  const filteredChapters = chapterFilter.trim()
    ? chapters.filter(ch =>
        ch.title.includes(chapterFilter) ||
        String(ch.number).includes(chapterFilter)
      )
    : chapters;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        <span>返回首页</span>
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3 p-6">
            <img
              src={novel.cover}
              alt={novel.title}
              className="w-full h-80 object-cover rounded-lg shadow-md"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = `https://placehold.co/300x400/4f46e5/ffffff?text=${encodeURIComponent((novel.title || '').slice(0, 6))}`;
              }}
            />
          </div>
          <div className="md:w-2/3 p-6">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                novel.status === 'ongoing' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {novel.status === 'ongoing' ? '连载中' : '已完结'}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{novel.title}</h1>
            <p className="text-lg text-gray-600 mb-4">作者：{novel.author}</p>

            <div className="flex flex-wrap gap-4 mb-6 text-gray-600">
              <div className="flex items-center space-x-1">
                <Star className="h-5 w-5 text-yellow-500" />
                <span>{novel.views.toLocaleString()} pt</span>
              </div>
              {novel.chapterCount !== undefined && novel.chapterCount > 0 && (
                <div className="flex items-center space-x-1">
                  <BookMarked className="h-5 w-5" />
                  <span>共{novel.chapterCount}话</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Calendar className="h-5 w-5" />
                <span>最近更新：{novel.lastUpdate}</span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">简介</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{novel.description}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {progress && chapters.length > 0 ? (
                <>
                  <Link
                    to={`/novel/${novel.id}/chapter/${progress.chapterId}`}
                    className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <RotateCcw className="h-5 w-5" />
                    <span>从第{progress.chapterNumber}话继续阅读</span>
                  </Link>
                  <Link
                    to={`/novel/${novel.id}/chapter/${chapters[0].id}`}
                    className="inline-flex items-center space-x-2 bg-white text-indigo-600 px-6 py-3 rounded-lg border border-indigo-300 hover:bg-indigo-50 transition-colors"
                  >
                    <BookOpen className="h-5 w-5" />
                    <span>从头开始阅读</span>
                  </Link>
                </>
              ) : chapters.length > 0 ? (
                <Link
                  to={`/novel/${novel.id}/chapter/${chapters[0].id}`}
                  className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <BookOpen className="h-5 w-5" />
                  <span>开始阅读</span>
                </Link>
              ) : (
                <p className="text-gray-400 text-sm">章节加载中...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {chapters.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              章节列表
              <span className="ml-2 text-base font-normal text-gray-400">（共{chapters.length}话）</span>
            </h2>
            {chapters.length > 20 && (
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={chapterFilter}
                  onChange={(e) => setChapterFilter(e.target.value)}
                  placeholder="搜索章节..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
                />
              </div>
            )}
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredChapters.length > 0 ? filteredChapters.map((chapter) => {
              const isCurrent = progress?.chapterId === chapter.id;
              return (
                <Link
                  key={chapter.id}
                  to={`/novel/${novel.id}/chapter/${chapter.id}`}
                  className={`block p-4 border rounded-lg transition-colors ${
                    isCurrent
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-gray-200 hover:bg-gray-50 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      {isCurrent && (
                        <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full flex-shrink-0">阅读中</span>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">
                          第{chapter.number}话　{chapter.title}
                        </h3>
                        {chapter.publishDate && (
                          <p className="text-sm text-gray-500">{chapter.publishDate}</p>
                        )}
                      </div>
                    </div>
                    <ArrowLeft className="h-5 w-5 text-gray-400 transform rotate-180 flex-shrink-0 ml-2" />
                  </div>
                </Link>
              );
            }) : (
              <p className="text-center text-gray-400 py-8">未找到匹配的章节</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
