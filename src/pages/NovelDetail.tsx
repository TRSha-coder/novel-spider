import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Novel, Chapter } from '../types';
import { getNovelById, getChaptersByNovelId } from '../api';
import { ArrowLeft, Eye, Star, Calendar, BookOpen, Loader2, BookMarked } from 'lucide-react';

export const NovelDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [novelData, chaptersData] = await Promise.all([
          getNovelById(id),
          getChaptersByNovelId(id),
        ]);
        setNovel(novelData);
        setChapters(chaptersData);
      } catch (error) {
        console.error('Failed to fetch novel details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <span className="ml-2 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">小説が見つかりませんでした</p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 mt-4 text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>ホームに戻る</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/"
        className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>戻る</span>
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3 p-6">
            <img
              src={novel.cover}
              alt={novel.title}
              className="w-full h-80 object-cover rounded-lg shadow-md"
            />
          </div>
          <div className="md:w-2/3 p-6">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                novel.status === 'ongoing'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {novel.status === 'ongoing' ? '連載中' : '完結'}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{novel.title}</h1>
            <p className="text-lg text-gray-600 mb-4">作者: {novel.author}</p>

            <div className="flex flex-wrap gap-4 mb-6 text-gray-600">
              <div className="flex items-center space-x-1">
                <Eye className="h-5 w-5" />
                <span>{novel.views.toLocaleString()} pt</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-5 w-5 text-yellow-500" />
                <span>{novel.rating}</span>
              </div>
              {novel.chapterCount !== undefined && novel.chapterCount > 0 && (
                <div className="flex items-center space-x-1">
                  <BookMarked className="h-5 w-5" />
                  <span>{novel.chapterCount} 話</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Calendar className="h-5 w-5" />
                <span>{novel.lastUpdate}</span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">あらすじ</h2>
              <p className="text-gray-700 leading-relaxed">{novel.description}</p>
            </div>

            {chapters.length > 0 && (
              <Link
                to={`/novel/${novel.id}/chapter/${chapters[0].id}`}
                className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <BookOpen className="h-5 w-5" />
                <span>読み始める</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {chapters.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">章一覧</h2>
          <div className="space-y-3">
            {chapters.map((chapter) => (
              <Link
                key={chapter.id}
                to={`/novel/${novel.id}/chapter/${chapter.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      第{chapter.number}話　{chapter.title}
                    </h3>
                    <p className="text-sm text-gray-500">{chapter.publishDate}</p>
                  </div>
                  <ArrowLeft className="h-5 w-5 text-gray-400 transform rotate-180" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};