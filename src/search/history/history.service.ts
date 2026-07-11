import { Injectable, Logger } from '@nestjs/common';
import { HistoryRepository } from './history.repository';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);
  private readonly maxHistory = 20;

  constructor(private readonly historyRepository: HistoryRepository) {}

  async saveSearch(userId: string, keyword: string) {
    const normalized = keyword.trim().toLowerCase();

    const existing = await this.historyRepository.findByUserAndQuery(
      userId,
      normalized,
    );
    if (existing) {
      await this.historyRepository.updateTimestamp(existing.id);
    } else {
      const count = await this.historyRepository.countByUser(userId);
      if (count >= this.maxHistory) {
        await this.historyRepository.deleteOldest(userId, this.maxHistory - 1);
      }
      await this.historyRepository.create(userId, normalized);
    }

    await this.historyRepository.upsertPopular(normalized);

    this.logger.log(`Search saved: user=${userId} query=${normalized}`);
    return { message: 'Search saved.' };
  }

  async getHistory(userId: string) {
    const items = await this.historyRepository.findRecentByUser(userId);
    return {
      items: items.map((h) => ({
        id: h.id,
        query: h.query,
        searchedAt: h.searched_at,
      })),
    };
  }

  async deleteHistory(userId: string) {
    await this.historyRepository.deleteByUser(userId);
    this.logger.log(`Search history cleared: user=${userId}`);
    return { message: 'Search history cleared.' };
  }

  async getRecent(userId: string) {
    const items = await this.historyRepository.findRecentByUser(userId, 10);
    return {
      items: items.map((h) => ({
        id: h.id,
        query: h.query,
        searchedAt: h.searched_at,
      })),
    };
  }

  async deleteRecent(userId: string) {
    return this.deleteHistory(userId);
  }

  async getPopular() {
    const [keywords, categories, tags] = await Promise.all([
      this.historyRepository.findPopular(10),
      this.historyRepository.findPopularCategories(10),
      this.historyRepository.findTrendingTags(10),
    ]);

    return {
      keywords: keywords.map((k) => ({
        query: k.query,
        searchCount: k.search_count,
      })),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        videoCount: c._count.video_categories,
      })),
      tags: tags.map((t) => ({
        id: t.id,
        name: t.name,
        videoCount: t._count.videos,
      })),
    };
  }
}
