import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly avatarFolder: string;
  private readonly thumbnailFolder: string;
  private readonly videoFolder: string;

  constructor(private readonly configService: ConfigService) {
    this.avatarFolder = this.configService.get<string>(
      'CLOUDINARY_AVATAR_FOLDER',
      'amora/avatars',
    );
    this.thumbnailFolder = this.configService.get<string>(
      'CLOUDINARY_THUMBNAIL_FOLDER',
      'amora/thumbnails',
    );
    this.videoFolder = this.configService.get<string>(
      'CLOUDINARY_VIDEO_FOLDER',
      'amora/videos',
    );
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    this.validateFile(file);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: this.avatarFolder, resource_type: 'image' },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary upload failed: ${error.message}`);
            reject(
              new InternalServerErrorException({
                success: false,
                message: 'Failed to upload image.',
                error: { code: 'UPLOAD_FAILED' },
              }),
            );
          } else {
            resolve(result!.secure_url);
          }
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  async uploadImageWithPublicId(
    file: Express.Multer.File,
  ): Promise<{ url: string; publicId: string }> {
    this.validateFile(file);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: this.thumbnailFolder, resource_type: 'image' },
        (error, result) => {
          if (error) {
            this.logger.error(
              `Cloudinary image upload failed: ${error.message}`,
            );
            reject(
              new InternalServerErrorException({
                success: false,
                message: 'Failed to upload image.',
                error: { code: 'UPLOAD_FAILED' },
              }),
            );
          } else {
            resolve({ url: result!.secure_url, publicId: result!.public_id });
          }
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  async uploadVideo(
    file: Express.Multer.File,
  ): Promise<{ url: string; publicId: string }> {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException({
        success: false,
        message: 'Invalid video file.',
        error: { code: 'INVALID_FILE' },
      });
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: this.videoFolder, resource_type: 'video' },
        (error, result) => {
          if (error) {
            this.logger.error(
              `Cloudinary video upload failed: ${error.message}`,
            );
            reject(
              new InternalServerErrorException({
                success: false,
                message: 'Failed to upload video.',
                error: { code: 'VIDEO_UPLOAD_FAILED' },
              }),
            );
          } else {
            resolve({ url: result!.secure_url, publicId: result!.public_id });
          }
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  async deleteImage(url: string): Promise<void> {
    const publicId = this.extractPublicId(url);
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error: any) {
      this.logger.error(
        `Cloudinary delete failed for ${publicId}: ${error.message}`,
      );
    }
  }

  async deleteByPublicId(
    publicId: string,
    resourceType?: string,
  ): Promise<void> {
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType || 'image',
      });
    } catch (error: any) {
      this.logger.error(
        `Cloudinary delete failed for ${publicId}: ${error.message}`,
      );
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException({
        success: false,
        message: 'Invalid file.',
        error: { code: 'INVALID_FILE' },
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
        error: { code: 'FILE_TOO_LARGE' },
      });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException({
        success: false,
        message:
          'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
        error: { code: 'INVALID_FILE_TYPE' },
      });
    }
  }

  extractPublicId(url: string): string | null {
    const parts = url.split('/');
    const filePart = parts.pop() || '';
    const extensionIndex = filePart.lastIndexOf('.');
    const file =
      extensionIndex !== -1 ? filePart.substring(0, extensionIndex) : filePart;
    if (!file) return null;
    const folder = parts.slice(-2).join('/');
    return `${folder}/${file}`;
  }
}
