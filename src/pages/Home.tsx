import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Novel } from '../types';
import { NovelCard } from '../components/NovelCard';
import { getPopularNovels, getLatestNovels } from '../api';
import { TrendingUp, Clock, BookOpen, Trash2 } from 'lucide-react';
import { getHistory, clearHistory, ReadingRecord } from '../hooks/useReadingProgress';

export const Home = () => {
  const [popularNovels, setPopularNovels] = useState<Novel[]>([]);
  const [latestNovels, setLatestNovels] = useState<Novel[]>([]);
  const [history, setHistory] = useState<ReadingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHistory(getHistory());
    const fetchData = async () => {
      try {
        const [popular, latest] = await Promise.all([
          getPopularNovels(),
          getLatestNovels(),
        ]);
        setPopularNovels(popular);
        setLatestNovels(latest);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">加载中...</div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {popularNovels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      </div>

      {/* 最新更新 */}
      <div>
        <div className="flex items-center space-x-2 mb-6">
          <Clock className="h-8 w-8 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">最新更新</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {latestNovels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      </div>

    </div>
  );
};
