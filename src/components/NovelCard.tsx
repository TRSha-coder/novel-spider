import { Link, useNavigate } from 'react-router-dom';
import { Novel } from '../types';
import { Star, Calendar, BookOpen } from 'lucide-react';
import { getNovelProgress } from '../hooks/useReadingProgress';

interface NovelCardProps {
  novel: Novel;
}

export const NovelCard = ({ novel }: NovelCardProps) => {
  const navigate = useNavigate();
  const progress = getNovelProgress(novel.id);

  const firstChapterId = (novel.chapterCount && novel.chapterCount > 0)
    ? `${novel.id}-1`
    : `${novel.id}-0`;

  const readTarget = progress
    ? `/novel/${novel.id}/chapter/${progress.chapterId}`
    : `/novel/${novel.id}/chapter/${firstChapterId}`;

  const readLabel = progress ? `从第${progress.chapterNumber}话继续阅读` : '阅读';

  const handleRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(readTarget);
  };

  return (
    <div className="group flex flex-col bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <Link to={`/novel/${novel.id}`} className="block">
        <div className="relative">
          <img
            src={novel.cover}
            alt={novel.title}
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = `https://placehold.co/300x400/4f46e5/ffffff?text=${encodeURIComponent((novel.title || '').slice(0, 6))}`;
            }}
          />
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              novel.status === 'ongoing'
                ? 'bg-green-500 text-white'
                : 'bg-gray-500 text-white'
            }`}>
              {novel.status === 'ongoing' ? '连载中' : '已完结'}
            </span>
          </div>
        </div>
        <div className="p-4 pb-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {novel.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {novel.author}
          </p>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-orange-400" />
              <span>{novel.views.toLocaleString()}pt</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{novel.lastUpdate}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* 阅读按钮 */}
      <div className="px-4 pb-4 pt-2 mt-auto">
        <button
          onClick={handleRead}
          className="w-full flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
        >
          <BookOpen className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{readLabel}</span>
        </button>
      </div>
    </div>
  );
};
