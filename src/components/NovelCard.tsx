import { Link, useNavigate } from 'react-router-dom';
import { Novel } from '../types';
import { Star, Calendar, BookOpen } from 'lucide-react';
import { getNovelProgress } from '../hooks/useReadingProgress';

interface NovelCardProps {
  novel: Novel;
}

// 根据小说 ID 生成固定的渐变色
function getCoverGradient(id: string): [string, string] {
  const palettes: [string, string][] = [
    ['#1a1a2e', '#16213e'],
    ['#2d1b69', '#11998e'],
    ['#141e30', '#243b55'],
    ['#200122', '#6f0000'],
    ['#0f2027', '#203a43'],
    ['#1f4037', '#99f2c8'],
    ['#4b134f', '#c94b4b'],
    ['#0f0c29', '#302b63'],
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  return palettes[Math.abs(hash) % palettes.length];
}

const CoverPlaceholder = ({ novel }: { novel: Novel }) => {
  const [from, to] = getCoverGradient(novel.id);
  // 取标题前两个字作为封面文字
  const label = (novel.title || '').slice(0, 2);
  return (
    <svg
      viewBox="0 0 300 400"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`g-${novel.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill={`url(#g-${novel.id})`} />
      {/* 装饰线条 */}
      <rect x="20" y="20" width="260" height="360" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" rx="4" />
      <rect x="28" y="28" width="244" height="344" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" rx="3" />
      {/* 书本图标 */}
      <text x="150" y="170" textAnchor="middle" fontSize="48" fill="rgba(255,255,255,0.25)">📖</text>
      {/* 标题文字 */}
      <text x="150" y="240" textAnchor="middle" fontSize="36" fontWeight="bold" fill="rgba(255,255,255,0.9)" fontFamily="serif">
        {label}
      </text>
      {/* 作者 */}
      <text x="150" y="280" textAnchor="middle" fontSize="14" fill="rgba(255,255,255,0.5)" fontFamily="sans-serif">
        {(novel.author || '').slice(0, 8)}
      </text>
    </svg>
  );
};

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
        <div className="relative overflow-hidden">
          <CoverPlaceholder novel={novel} />
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
