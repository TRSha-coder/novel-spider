import { Link } from 'react-router-dom';
import { BookOpen, Search, Home } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8" />
            <span className="text-xl font-bold">日本小説クローラー</span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-1 hover:text-indigo-200 transition-colors">
              <Home className="h-5 w-5" />
              <span>ホーム</span>
            </Link>
            <Link to="/search" className="flex items-center space-x-1 hover:text-indigo-200 transition-colors">
              <Search className="h-5 w-5" />
              <span>検索</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};