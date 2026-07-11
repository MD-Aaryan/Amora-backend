import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  UseInterceptors,
  UseGuards,
  UploadedFiles,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { VideoService } from './video.service';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ActiveRole } from '../common/decorators/active-role.decorator';
import { ActiveRoleGuard } from '../common/guards/active-role.guard';
import { RoleName } from '../common/enums/role.enum';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';

@ApiTags('Videos')
@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  @Roles(RoleName.CREATOR, RoleName.SALON)
  @UseGuards(ActiveRoleGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a video with thumbnail' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Video upload payload',
    schema: {
      type: 'object',
      required: ['title', 'category_ids', 'video', 'thumbnail'],
      properties: {
        title: { type: 'string', description: 'Video title' },
        description: { type: 'string', description: 'Video description' },
        category_ids: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          description: 'Category IDs',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tag names',
        },
        language: {
          type: 'string',
          description: 'Language code (default: en)',
        },
        visibility: {
          type: 'string',
          enum: ['PUBLIC', 'PRIVATE'],
          description: 'Video visibility',
        },
        video: {
          type: 'string',
          format: 'binary',
          description: 'Video file (MP4, MOV, WEBM)',
        },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Thumbnail image (JPG, PNG, WEBP)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Video uploaded successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      { limits: { fileSize: 200 * 1024 * 1024 } },
    ),
  )
  async upload(
    @GetUser('id') userId: string,
    @ActiveRole() activeRole: string,
    @Body() dto: CreateVideoDto,
    @UploadedFiles()
    files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
  ) {
    const videoFile = files?.video?.[0];
    const thumbnailFile = files?.thumbnail?.[0];

    if (!videoFile) {
      throw new BadRequestException({
        success: false,
        message: 'Video file is required.',
        error: { code: 'VIDEO_FILE_REQUIRED' },
      });
    }

    if (!thumbnailFile) {
      throw new BadRequestException({
        success: false,
        message: 'Thumbnail file is required.',
        error: { code: 'THUMBNAIL_FILE_REQUIRED' },
      });
    }

    return this.videoService.upload(
      userId,
      activeRole,
      dto,
      videoFile,
      thumbnailFile,
    );
  }

  @Post('draft')
  @Roles(RoleName.CREATOR, RoleName.SALON)
  @UseGuards(ActiveRoleGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save a video as draft' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Draft video payload (video and thumbnail optional)',
    schema: {
      type: 'object',
      required: ['title', 'category_ids'],
      properties: {
        title: { type: 'string', description: 'Video title' },
        description: { type: 'string', description: 'Video description' },
        category_ids: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          description: 'Category IDs',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tag names',
        },
        language: {
          type: 'string',
          description: 'Language code (default: en)',
        },
        visibility: {
          type: 'string',
          enum: ['PUBLIC', 'PRIVATE'],
          description: 'Video visibility',
        },
        video: {
          type: 'string',
          format: 'binary',
          description: 'Video file (optional for drafts)',
        },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Thumbnail image (optional for drafts)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Draft saved successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      { limits: { fileSize: 200 * 1024 * 1024 } },
    ),
  )
  async createDraft(
    @GetUser('id') userId: string,
    @ActiveRole() activeRole: string,
    @Body() dto: CreateVideoDto,
    @UploadedFiles()
    files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
  ) {
    return this.videoService.uploadDraft(
      userId,
      activeRole,
      dto,
      files?.video?.[0],
      files?.thumbnail?.[0],
    );
  }

  @Patch(':id/draft')
  @Roles(RoleName.CREATOR, RoleName.SALON)
  @UseGuards(ActiveRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a draft video' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update draft payload (all fields optional)',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Video title' },
        description: { type: 'string', description: 'Video description' },
        category_ids: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          description: 'Category IDs',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tag names',
        },
        language: { type: 'string', description: 'Language code' },
        visibility: {
          type: 'string',
          enum: ['PUBLIC', 'PRIVATE'],
          description: 'Video visibility',
        },
        video: {
          type: 'string',
          format: 'binary',
          description: 'New video file',
        },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'New thumbnail image',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Draft updated successfully.' })
  @ApiResponse({ status: 404, description: 'Draft not found.' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      { limits: { fileSize: 200 * 1024 * 1024 } },
    ),
  )
  async updateDraft(
    @GetUser('id') userId: string,
    @ActiveRole() activeRole: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVideoDto,
    @UploadedFiles()
    files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
  ) {
    return this.videoService.updateDraft(
      userId,
      activeRole,
      id,
      dto,
      files?.video?.[0],
      files?.thumbnail?.[0],
    );
  }

  @Post(':id/publish')
  @Roles(RoleName.CREATOR, RoleName.SALON)
  @UseGuards(ActiveRoleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a draft video' })
  @ApiResponse({ status: 200, description: 'Draft published successfully.' })
  @ApiResponse({ status: 400, description: 'Draft missing required fields.' })
  @ApiResponse({ status: 404, description: 'Draft not found.' })
  async publishDraft(
    @GetUser('id') userId: string,
    @ActiveRole() activeRole: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.videoService.publishDraft(userId, activeRole, id);
  }

  @Get('my')
  @Roles(RoleName.CREATOR, RoleName.SALON)
  @UseGuards(ActiveRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my uploaded videos' })
  @ApiResponse({ status: 200, description: 'List of my videos returned.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getMyVideos(
    @GetUser('id') userId: string,
    @ActiveRole() activeRole: string,
  ) {
    return this.videoService.getMyVideos(userId, activeRole);
  }

  @Public()
  @Get('public/:id')
  @ApiOperation({ summary: 'Get public video details' })
  @ApiResponse({ status: 200, description: 'Video details returned.' })
  @ApiResponse({ status: 404, description: 'Video not found.' })
  async getPublicVideo(@Param('id', ParseUUIDPipe) id: string) {
    return this.videoService.getPublicVideo(id);
  }

  @Get(':id')
  @Roles(RoleName.CREATOR, RoleName.SALON)
  @UseGuards(ActiveRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get owned video details' })
  @ApiResponse({ status: 200, description: 'Video details returned.' })
  @ApiResponse({ status: 404, description: 'Video not found.' })
  async getVideoById(
    @GetUser('id') userId: string,
    @ActiveRole() activeRole: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.videoService.getVideoById(userId, activeRole, id);
  }

  @Patch(':id')
  @Roles(RoleName.CREATOR, RoleName.SALON)
  @UseGuards(ActiveRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update video metadata' })
  @ApiBody({ type: UpdateVideoDto })
  @ApiResponse({ status: 200, description: 'Video updated successfully.' })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 404, description: 'Video not found.' })
  async updateVideo(
    @GetUser('id') userId: string,
    @ActiveRole() activeRole: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVideoDto,
  ) {
    return this.videoService.updateVideo(userId, activeRole, id, dto);
  }

  @Delete(':id')
  @Roles(RoleName.CREATOR, RoleName.SALON)
  @UseGuards(ActiveRoleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete video (soft delete)' })
  @ApiResponse({ status: 200, description: 'Video deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Video not found.' })
  async deleteVideo(
    @GetUser('id') userId: string,
    @ActiveRole() activeRole: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.videoService.deleteVideo(userId, activeRole, id);
  }

  @Patch(':id/thumbnail')
  @Roles(RoleName.CREATOR, RoleName.SALON)
  @UseGuards(ActiveRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replace video thumbnail' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['thumbnail'],
      properties: {
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'New thumbnail image (JPG, PNG, WEBP)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Thumbnail replaced successfully.' })
  @ApiResponse({ status: 404, description: 'Video not found.' })
  @UseInterceptors(
    FileInterceptor('thumbnail', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async replaceThumbnail(
    @GetUser('id') userId: string,
    @ActiveRole() activeRole: string,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException({
        success: false,
        message: 'Thumbnail file is required.',
        error: { code: 'THUMBNAIL_FILE_REQUIRED' },
      });
    }

    return this.videoService.replaceThumbnail(userId, activeRole, id, file);
  }

  @Patch(':id/file')
  @Roles(RoleName.CREATOR, RoleName.SALON)
  @UseGuards(ActiveRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Replace video file (optional - MVP basic implementation)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['video'],
      properties: {
        video: {
          type: 'string',
          format: 'binary',
          description: 'New video file (MP4, MOV, WEBM)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Video file replaced successfully.',
  })
  @ApiResponse({ status: 404, description: 'Video not found.' })
  @UseInterceptors(
    FileInterceptor('video', { limits: { fileSize: 200 * 1024 * 1024 } }),
  )
  async replaceVideoFile(
    @GetUser('id') userId: string,
    @ActiveRole() activeRole: string,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException({
        success: false,
        message: 'Video file is required.',
        error: { code: 'VIDEO_FILE_REQUIRED' },
      });
    }

    return this.videoService.replaceVideoFile(userId, activeRole, id, file);
  }
}
