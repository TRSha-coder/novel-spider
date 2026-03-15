import { Link } from 'react-router-dom';
import { Novel } from '../types';
import { Star, Calendar } from 'lucide-react';

interface NovelCardProps {
  novel: Novel;
}

export const NovelCard = ({ novel }: NovelCardProps) => {
  return (
    <Link to={`/novel/${novel.id}`} className="group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <div className="relative">
          <img
            src={novel.cover}
            alt={novel.title}
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              novel.status === 'ongoing' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-500 text-white'
            }`}>
              {novel.status === 'ongoing' ? '連載中' : '完結'}
            </span>
          </div>
        </div>
        <div className="p-4">
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
      </div>
    </Link>
  );
};