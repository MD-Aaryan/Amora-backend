import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  async uploadImage(file: Express.Multer.File): Promise<string> {
    this.validateFile(file);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'amora/avatars', resource_type: 'image' },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary upload failed: ${error.message}`);
            reject(new InternalServerErrorException({
              success: false,
              message: 'Failed to upload image.',
              error: { code: 'UPLOAD_FAILED' },
            }));
          } else {
            resolve(result!.secure_url);
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
      this.logger.error(`Cloudinary delete failed for ${publicId}: ${error.message}`);
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
        message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
        error: { code: 'INVALID_FILE_TYPE' },
      });
    }
  }

  private extractPublicId(url: string): string | null {
    const parts = url.split('/');
    const filePart = parts.pop() || '';
    const extensionIndex = filePart.lastIndexOf('.');
    const file = extensionIndex !== -1 ? filePart.substring(0, extensionIndex) : filePart;
    if (!file) return null;
    const folder = parts.slice(-2).join('/');
    return `${folder}/${file}`;
  }
}
