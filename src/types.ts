export interface Novel {
  id: string;
  title: string;
  author: string;
  description: string;
  cover: string;
  status: 'ongoing' | 'completed';
  views: number;
  rating: number;
  lastUpdate: string;
}

export interface Chapter {
  id: string;
  title: string;
  number: number;
  content: string;
  publishDate: string;
}

export interface SearchResult {
  novels: Novel[];
  total: number;
  hasMore: boolean;
}