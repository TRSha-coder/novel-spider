import { useEffect, useState } from 'react';
import { Novel } from '../types';
import { NovelCard } from '../components/NovelCard';
import { getPopularNovels, getLatestNovels } from '../api';
import { TrendingUp, Clock } from 'lucide-react';

export const Home = () => {
  const [popularNovels, setPopularNovels] = useState<Novel[]>([]);
  const [latestNovels, setLatestNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-12">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="h-8 w-8 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-800">人気小説</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {popularNovels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      </div>

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