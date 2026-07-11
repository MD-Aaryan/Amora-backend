import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { VideoStatus, VideoVisibility } from '@prisma/client';

@Injectable()
export class VideoRepository {
  constructor(private readonly prisma: PrismaService) {}

  private videoInclude = {
    categories: { include: { category: true } },
    tags: { include: { tag: true } },
    creator: {
      include: { user: { select: { display_name: true, avatar_url: true } } },
    },
    salon: {
      include: { user: { select: { display_name: true, avatar_url: true } } },
    },
  } as const;

  async create(data: {
    creator_id?: string;
    salon_id?: string;
    cloudinary_public_id?: string;
    thumbnail_public_id?: string;
    title: string;
    description?: string;
    video_url: string;
    thumbnail_url: string;
    language?: string;
    visibility?: VideoVisibility;
    categoryIds: string[];
    tagNames: string[];
  }) {
    const tagRecords = await Promise.all(
      data.tagNames.map((name) =>
        this.prisma.tag.upsert({
          where: { name: name.toLowerCase().trim() },
          create: { name: name.toLowerCase().trim() },
          update: {},
        }),
      ),
    );

    return this.prisma.video.create({
      data: {
        creator_id: data.creator_id,
        salon_id: data.salon_id,
        cloudinary_public_id: data.cloudinary_public_id,
        thumbnail_public_id: data.thumbnail_public_id,
        title: data.title,
        description: data.description,
        video_url: data.video_url,
        thumbnail_url: data.thumbnail_url,
        language: data.language || 'en',
        visibility: data.visibility || VideoVisibility.PUBLIC,
        status: VideoStatus.ACTIVE,
        categories: {
          create: data.categoryIds.map((id) => ({ category_id: id })),
        },
        tags: {
          create: tagRecords.map((tag) => ({ tag_id: tag.id })),
        },
      },
      include: this.videoInclude,
    });
  }

  async findById(id: string) {
    return this.prisma.video.findUnique({
      where: { id, deleted_at: null },
      include: this.videoInclude,
    });
  }

  async findPublicById(id: string) {
    return this.prisma.video.findFirst({
      where: {
        id,
        visibility: VideoVisibility.PUBLIC,
        status: VideoStatus.ACTIVE,
        deleted_at: null,
      },
      include: this.videoInclude,
    });
  }

  async findMyVideos(creatorId?: string, salonId?: string) {
    const where: any = { deleted_at: null };
    if (creatorId) where.creator_id = creatorId;
    if (salonId) where.salon_id = salonId;

    return this.prisma.video.findMany({
      where,
      include: {
        categories: { include: { category: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOwnedVideo(id: string, creatorId?: string, salonId?: string) {
    if (!creatorId && !salonId) {
      return null;
    }

    const where: any = { id, deleted_at: null };
    if (creatorId) where.creator_id = creatorId;
    if (salonId) where.salon_id = salonId;

    return this.prisma.video.findFirst({
      where,
      include: this.videoInclude,
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      language?: string;
      visibility?: VideoVisibility;
      is_free?: boolean;
      price?: number | null;
      thumbnail_url?: string;
      thumbnail_public_id?: string;
      video_url?: string;
      cloudinary_public_id?: string;
      categoryIds?: string[];
      tagNames?: string[];
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.language !== undefined) updateData.language = data.language;
      if (data.visibility !== undefined)
        updateData.visibility = data.visibility;
      if (data.is_free !== undefined) updateData.is_free = data.is_free;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.thumbnail_url !== undefined)
        updateData.thumbnail_url = data.thumbnail_url;
      if (data.thumbnail_public_id !== undefined)
        updateData.thumbnail_public_id = data.thumbnail_public_id;
      if (data.video_url !== undefined) updateData.video_url = data.video_url;
      if (data.cloudinary_public_id !== undefined)
        updateData.cloudinary_public_id = data.cloudinary_public_id;

      if (data.categoryIds) {
        await tx.videoCategory.deleteMany({ where: { video_id: id } });
        updateData.categories = {
          create: data.categoryIds.map((catId) => ({ category_id: catId })),
        };
      }

      if (data.tagNames) {
        await tx.videoTag.deleteMany({ where: { video_id: id } });
        const tagRecords = await Promise.all(
          data.tagNames.map((name) =>
            tx.tag.upsert({
              where: { name: name.toLowerCase().trim() },
              create: { name: name.toLowerCase().trim() },
              update: {},
            }),
          ),
        );
        updateData.tags = {
          create: tagRecords.map((tag) => ({ tag_id: tag.id })),
        };
      }

      return tx.video.update({
        where: { id },
        data: updateData,
        include: this.videoInclude,
      });
    });
  }

  async softDelete(id: string) {
    return this.prisma.video.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async categoryExists(id: string): Promise<boolean> {
    const count = await this.prisma.category.count({ where: { id } });
    return count > 0;
  }
}
