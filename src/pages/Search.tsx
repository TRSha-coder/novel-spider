import { useEffect, useState } from 'react';
import { Novel } from '../types';
import { NovelCard } from '../components/NovelCard';
import { searchNovels } from '../api';
import { Search as SearchIcon, Loader2 } from 'lucide-react';

export const Search = () => {
  const [query, setQuery] = useState('');
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const result = await searchNovels(query);
      setNovels(result.novels);
    } catch (error) {
      console.error('Failed to search novels:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const result = await searchNovels();
        setNovels(result.novels);
      } catch (error) {
        console.error('Failed to fetch novels:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">小説を検索</h1>
        <form onSubmit={handleSearch} className="max-w-2xl">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="タイトルや作者名で検索..."
              className="w-full px-4 py-3 pl-12 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span>検索</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {loading && !hasSearched ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      ) : novels.length > 0 ? (
        <div>
          <p className="text-gray-600 mb-6">
            {hasSearched ? `${novels.length}件見つかりました` : '全ての小説'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {novels.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">小説が見つかりませんでした</p>
        </div>
      )}
    </div>
  );
};