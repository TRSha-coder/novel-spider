import { useEffect, useState, useCallback } from 'react';
import { Novel } from '../types';
import { NovelCard } from '../components/NovelCard';
import { searchNovels } from '../api';
import { Search as SearchIcon, Loader2, AlertCircle, ChevronDown } from 'lucide-react';

export const Search = () => {
  const [query, setQuery] = useState('');
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentQuery, setCurrentQuery] = useState('');

  const doSearch = useCallback(async (q: string, pg: number, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }
    try {
      const result = await searchNovels(q, pg, 10);
      if (append) {
        setNovels(prev => [...prev, ...result.novels]);
      } else {
        setNovels(result.novels);
      }
      setHasMore(result.hasMore);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to search novels:', err);
      setError('搜索失败，请检查网络连接后重试。');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasSearched(true);
    setPage(1);
    setCurrentQuery(query.trim());
    await doSearch(query.trim(), 1, false);
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await doSearch(currentQuery, nextPage, true);
  };

  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      setCurrentQuery('');
      try {
        const result = await searchNovels('', 1, 10);
        setNovels(result.novels);
        setHasMore(result.hasMore);
        setTotal(result.total);
      } catch (err) {
        console.error('Failed to fetch novels:', err);
        setError('加载失败，请稍后重试。');
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">搜索小说</h1>
        <form onSubmit={handleSearch} className="max-w-2xl">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="按标题或作者名搜索..."
              className="w-full px-4 py-3 pl-12 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && hasSearched ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span>搜索</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {loading && !hasSearched ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="ml-2 text-gray-600">加载中...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-gray-600">{error}</p>
        </div>
      ) : novels.length > 0 ? (
        <div>
          <p className="text-gray-500 mb-6 text-sm">
            {hasSearched
              ? `"${currentQuery}" 共找到 ${total.toLocaleString()} 条结果，当前显示 ${novels.length} 条`
              : `共 ${total.toLocaleString()} 部小说，当前显示 ${novels.length} 条`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {novels.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-10">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center space-x-2 bg-white border-2 border-indigo-300 text-indigo-600 px-8 py-3 rounded-lg hover:bg-indigo-50 hover:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>加载中...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-5 w-5" />
                    <span>加载更多</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">
            {hasSearched ? `未找到与"${currentQuery}"相关的小说` : '暂无小说数据'}
          </p>
        </div>
      )}
    </div>
  );
};
