import { Novel, Chapter, SearchResult } from './types';

const mockNovels: Novel[] = [
  {
    id: '1',
    title: '転生したらスライムだった件',
    author: '伏瀬',
    description: '三上悟は普通のサラリーマンだった。だが、突如異世界へと召喚され、スライムとして生まれ変わる。その後、数々の困難に立ち向かいながら、最強の存在へと成長していく。',
    cover: 'https://placehold.co/300x400/1a1a2e/ffffff?text=Slime',
    status: 'ongoing',
    views: 1234567,
    rating: 4.8,
    lastUpdate: '2024-01-15',
  },
  {
    id: '2',
    title: '無職転生 〜異世界行ったら本気だす〜',
    author: '理不尽な孫の手',
    description: '34歳童貞のニートが、交通事故で命を落とす。目を覚ますと、剣と魔法の異世界に赤ん坊として生まれ変わっていた。前世の後悔を胸に、今度こそ真剣に生きることを決意する。',
    cover: 'https://placehold.co/300x400/16213e/ffffff?text=Mushoku',
    status: 'completed',
    views: 2345678,
    rating: 4.9,
    lastUpdate: '2023-06-20',
  },
  {
    id: '3',
    title: 'Re:ゼロから始める異世界生活',
    author: '長月達平',
    description: 'ある日、突如異世界へと召喚された高校生・ナツキ・スバル。そこで待っていたのは、「死に戻り」の能力だった。死んでは過去に戻り、何度も同じ時間を繰り返しながら、重要な人々を救うために戦う。',
    cover: 'https://placehold.co/300x400/0f3460/ffffff?text=Re:Zero',
    status: 'ongoing',
    views: 3456789,
    rating: 4.7,
    lastUpdate: '2024-01-10',
  },
  {
    id: '4',
    title: 'ソードアート・オンライン',
    author: '川原礫',
    description: '2022年、VRMMORPG「ソードアート・オンライン」がサービス開始。プレイヤーたちは、ゲーム世界に閉じ込められ、ゲームをクリアしないと現実世界に戻れなくなる。主人公・キリトは、単独行動を貫きながら、クリアを目指す。',
    cover: 'https://placehold.co/300x400/533483/ffffff?text=SAO',
    status: 'completed',
    views: 4567890,
    rating: 4.6,
    lastUpdate: '2022-12-25',
  },
];

const mockChapters: Chapter[] = [
  {
    id: '1-1',
    title: '第一章 異世界への転生',
    number: 1,
    content: '三上悟は、突然の異世界召喚に戸惑いながらも、自分がスライムになっていることを理解する。周りは暗い洞窟の中。「まずは、この状況を把握しなければ…」そう思いながら、スライムとしての最初の一歩を踏み出す。\n\n洞窟の壁には、不思議な模様が描かれている。三上悟は、その模様に近づいてみる。すると、突然、頭の中に情報が流れ込んできた。「これは…大賢者の力か？」',
    publishDate: '2023-01-01',
  },
  {
    id: '1-2',
    title: '第二章 大賢者との出会い',
    number: 2,
    content: '三上悟は、頭の中に現れた「大賢者」という存在と対話する。大賢者は、彼にこの世界の基本的な知識を教えてくれる。「スライムは、どんなものでも吸収し、その能力を得ることができるのです」\n\nそう言われた三上悟は、早速、洞窟の中に落ちている鉱石を吸収してみる。すると、体が固くなり、鉱石のように輝き始めた。「おお、これはすごい！」',
    publishDate: '2023-01-02',
  },
  {
    id: '1-3',
    title: '第三章 最初の仲間',
    number: 3,
    content: '洞窟を進んでいくと、三上悟は一人の少女に出会う。少女は、鬼族の末裔で、「嵐のヴェルドラ」という名前だった。ヴェルドラは、三上悟に興味を持ち、「お前、面白いスライムだ。一緒に旅をしないか？」と誘う。\n\n三上悟は、喜んで承諾する。こうして、スライムと鬼族の少女の冒険が始まった。',
    publishDate: '2023-01-03',
  },
];

export const searchNovels = async (query: string = '', page: number = 1, limit: number = 10): Promise<SearchResult> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filtered = mockNovels;
  if (query) {
    filtered = mockNovels.filter(novel => 
      novel.title.toLowerCase().includes(query.toLowerCase()) ||
      novel.author.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginated = filtered.slice(start, end);
  
  return {
    novels: paginated,
    total: filtered.length,
    hasMore: end < filtered.length,
  };
};

export const getNovelById = async (id: string): Promise<Novel | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockNovels.find(novel => novel.id === id) || null;
};

export const getChaptersByNovelId = async (novelId: string): Promise<Chapter[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  if (novelId === '1') {
    return mockChapters;
  }
  return [];
};

export const getChapterById = async (novelId: string, chapterId: string): Promise<Chapter | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  if (novelId === '1') {
    return mockChapters.find(chapter => chapter.id === chapterId) || null;
  }
  return null;
};

export const getPopularNovels = async (limit: number = 5): Promise<Novel[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...mockNovels].sort((a, b) => b.views - a.views).slice(0, limit);
};

export const getLatestNovels = async (limit: number = 5): Promise<Novel[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...mockNovels].sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime()).slice(0, limit);
};