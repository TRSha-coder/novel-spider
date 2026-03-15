import axios from 'axios';
import { Novel, Chapter, SearchResult } from './types';

const BASE = import.meta.env.VITE_API_URL || '/api';

export const searchNovels = async (
  query: string = '',
  page: number = 1,
  limit: number = 10
): Promise<SearchResult> => {
  const res = await axios.get(`${BASE}/search`, { params: { q: query, page, limit } });
  return res.data;
};

export const getNovelById = async (id: string): Promise<Novel | null> => {
  try {
    const res = await axios.get(`${BASE}/novel/${id}`);
    return res.data;
  } catch {
    return null;
  }
};

export const getChaptersByNovelId = async (novelId: string): Promise<Chapter[]> => {
  try {
    const res = await axios.get(`${BASE}/novel/${novelId}/chapters`);
    return res.data;
  } catch {
    return [];
  }
};

export const getChapterById = async (novelId: string, chapterId: string): Promise<Chapter | null> => {
  try {
    // chapterId format: "{ncode}-{chapterNum}", extract the chapter number from the end
    const parts = chapterId.split('-');
    const num = parts[parts.length - 1];
    const res = await axios.get(`${BASE}/novel/${novelId}/chapter/${num}`);
    return res.data;
  } catch {
    return null;
  }
};

export const getPopularNovels = async (limit: number = 10): Promise<Novel[]> => {
  const res = await axios.get(`${BASE}/popular`, { params: { limit } });
  return res.data;
};

export const getLatestNovels = async (limit: number = 10): Promise<Novel[]> => {
  const res = await axios.get(`${BASE}/latest`, { params: { limit } });
  return res.data;
};
