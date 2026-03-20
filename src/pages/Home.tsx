import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Novel } from '../types';
import { NovelCard } from '../components/NovelCard';
import { getPopularNovels, getLatestNovels } from '../api';
import { TrendingUp, Clock, BookOpen, Trash2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { getHistory, clearHistory, ReadingRecord } from '../hooks/useReadingProgress';

export const Home = () => {
  const [popularNovels, setPopularNovels] = useState<Novel[]>([]);
  const [latestNovels, setLatestNovels] = useState<Novel[]>([]);
  const [history, setHistory] = useState<ReadingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [popular, latest] = await Promise.all([
        getPopularNovels(),
        getLatestNovels(),
      ]);
      setPopularNovels(popular);
      setLatestNovels(latest);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('数据加载失败，请检查网络连接后重试。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setHistory(getHistory());
    fetchData();
  }, []);

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
        <p className="text-gray-500 text-lg">正在加载小说列表...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-gray-700 text-lg font-semibold">加载失败</p>
        <p className="text-gray-500 text-sm text-center max-w-md">{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>重新加载</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

      {/* 最近阅读 */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-emerald-600" />
              <h2 className="text-2xl font-bold text-gray-800">最近阅读</h2>
            </div>
            <button
              onClick={handleClearHistory}
              className="flex items-center space-x-1 text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>清除历史</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {history.slice(0, 8).map((record) => (
              <Link
                key={record.novelId}
                to={`/novel/${record.novelId}/chapter/${record.chapterId}`}
                className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 hover:border-emerald-300"
              >
                <img
                  src={record.novelCover}
                  alt={record.novelTitle}
                  className="w-12 h-16 object-cover rounded flex-shrink-0"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = `https://placehold.co/48x64/4f46e5/ffffff?text=${encodeURIComponent((record.novelTitle || '').slice(0, 4))}`;
                  }}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm line-clamp-2">{record.novelTitle}</p>
                  <p className="text-xs text-gray-500 mt-1">{record.novelAuthor}</p>
                  <p className="text-xs text-emerald-600 mt-1 font-medium">已读至第{record.chapterNumber}话</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 热门小说 */}
      <div>
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="h-8 w-8 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-800">热门小说</h2>
        </div>
        {popularNovels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {popularNovels.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">暂无数据</p>
        )}
      </div>

      {/* 最新更新 */}
      <div>
        <div className="flex items-center space-x-2 mb-6">
          <Clock className="h-8 w-8 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">最新更新</h2>
        </div>
        {latestNovels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {latestNovels.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">暂无数据</p>
        )}
      </div>

    </div>
  );
};
