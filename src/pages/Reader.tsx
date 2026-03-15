import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Chapter, Novel } from '../types';
import { getChapterById, getNovelById, getChaptersByNovelId } from '../api';
import { ArrowLeft, ChevronLeft, ChevronRight, Home, Loader2, ExternalLink } from 'lucide-react';
import { saveProgress } from '../hooks/useReadingProgress';

const NAROU_BASE = 'https://ncode.syosetu.com';

export const Reader = () => {
  const { novelId, chapterId } = useParams<{ novelId: string; chapterId: string }>();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);

  useEffect(() => {
    if (!novelId || !chapterId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [novelData, chapterData, chaptersData] = await Promise.all([
          getNovelById(novelId),
          getChapterById(novelId, chapterId),
          getChaptersByNovelId(novelId),
        ]);
        setNovel(novelData);
        setChapter(chapterData);
        setChapters(chaptersData);
      } catch (error) {
        console.error('Failed to fetch chapter:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [novelId, chapterId]);

  // 自動保存：小説とチャプターが揃ったら進捗を記録
  useEffect(() => {
    if (!novel || !chapter || !novelId || !chapterId) return;
    saveProgress({
      novelId,
      novelTitle: novel.title,
      novelCover: novel.cover,
      novelAuthor: novel.author,
      chapterId,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
    });
  }, [novel, chapter, novelId, chapterId]);

  const currentIndex = chapters.findIndex(c => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  // 原文URL：短編(number=0)はルート、連載は /number/
  const originalUrl = chapter
    ? chapter.number === 0
      ? `${NAROU_BASE}/${novelId}/`
      : `${NAROU_BASE}/${novelId}/${chapter.number}/`
    : `${NAROU_BASE}/${novelId}/`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <span className="ml-2 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  if (!novel || !chapter) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">章が見つかりませんでした</p>
          <Link
            to={`/novel/${novelId}`}
            className="inline-flex items-center space-x-2 mt-4 text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>小説詳細に戻る</span>
          </Link>
        </div>
      </div>
    );
  }

  const paragraphs = chapter.content.split('\n\n').filter(p => p.trim());

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link
              to={`/novel/${novelId}`}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">戻る</span>
            </Link>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setFontSize(f => Math.max(12, f - 2))}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                title="文字を小さく"
              >
                <span className="text-lg font-bold">A-</span>
              </button>
              <button
                onClick={() => setFontSize(f => Math.min(28, f + 2))}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                title="文字を大きく"
              >
                <span className="text-lg font-bold">A+</span>
              </button>
              <a
                href={originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg border border-indigo-200"
                title="なろうで原文を読む"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">原文</span>
              </a>
              <Link
                to="/"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                title="ホーム"
              >
                <Home className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{novel.title}</h1>
          <h2 className="text-xl text-gray-600 mb-2">第{chapter.number}話　{chapter.title}</h2>
          <p className="text-sm text-gray-500">{chapter.publishDate}</p>
        </header>

        <article className="bg-white rounded-lg shadow-sm p-8">
          <div
            className="prose prose-lg max-w-none text-gray-800 leading-loose"
            style={{ fontSize: `${fontSize}px` }}
          >
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="mb-6 indent-8">
                {paragraph}
              </p>
            ))}
          </div>
        </article>

        {/* 原文リンク（本文下） */}
        <div className="mt-6 text-center">
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-5 py-2 text-sm text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>小説家になろうで原文を読む</span>
          </a>
        </div>

        <div className="flex items-center justify-between mt-6">
          {prevChapter ? (
            <Link
              to={`/novel/${novelId}/chapter/${prevChapter.id}`}
              className="flex items-center space-x-2 bg-white px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow text-gray-700"
            >
              <ChevronLeft className="h-5 w-5" />
              <div className="text-left">
                <p className="text-sm text-gray-500">前の話</p>
                <p className="font-medium truncate max-w-32">第{prevChapter.number}話</p>
              </div>
            </Link>
          ) : (
            <div></div>
          )}

          {nextChapter ? (
            <Link
              to={`/novel/${novelId}/chapter/${nextChapter.id}`}
              className="flex items-center space-x-2 bg-white px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow text-gray-700"
            >
              <div className="text-right">
                <p className="text-sm text-gray-500">次の話</p>
                <p className="font-medium truncate max-w-32">第{nextChapter.number}話</p>
              </div>
              <ChevronRight className="h-5 w-5" />
            </Link>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  );
};
