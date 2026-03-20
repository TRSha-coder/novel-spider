import { NavLink } from 'react-router-dom';
import { BookOpen, Search, Home } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity">
            <BookOpen className="h-8 w-8" />
            <span className="text-xl font-bold">日文小说阅读器</span>
          </NavLink>
          <nav className="flex items-center space-x-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white font-semibold'
                    : 'hover:bg-white/10 text-indigo-100'
                }`
              }
            >
              <Home className="h-5 w-5" />
              <span>首页</span>
            </NavLink>
            <NavLink
              to="/search"
              className={({ isActive }) =>
                `flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white font-semibold'
                    : 'hover:bg-white/10 text-indigo-100'
                }`
              }
            >
              <Search className="h-5 w-5" />
              <span>搜索</span>
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
};
