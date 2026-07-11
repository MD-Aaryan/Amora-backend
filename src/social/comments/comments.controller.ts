import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { ReplyCommentDto } from '../dto/reply-comment.dto';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Comments')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get('videos/:videoId/comments')
  @ApiOperation({
    summary: 'Get video comments - top-level comments with replies',
  })
  @ApiParam({
    name: 'videoId',
    required: true,
    description: 'UUID of the video',
  })
  @ApiResponse({ status: 200, description: 'Comments returned successfully.' })
  @ApiResponse({ status: 404, description: 'Video not found.' })
  async getComments(@Param('videoId', ParseUUIDPipe) videoId: string) {
    return this.commentsService.getComments(videoId);
  }

  @Post('videos/:videoId/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a comment on a video' })
  @ApiParam({
    name: 'videoId',
    required: true,
    description: 'UUID of the video',
  })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: 201, description: 'Comment created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Video not found.' })
  async createComment(
    @GetUser('id') userId: string,
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(userId, videoId, dto.content);
  }

  @Post('comments/:commentId/reply')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reply to a comment (max depth: 1)' })
  @ApiParam({
    name: 'commentId',
    required: true,
    description: 'UUID of the parent comment',
  })
  @ApiBody({ type: ReplyCommentDto })
  @ApiResponse({ status: 201, description: 'Reply created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  @ApiResponse({ status: 400, description: 'Cannot reply to a reply.' })
  async replyToComment(
    @GetUser('id') userId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: ReplyCommentDto,
  ) {
    return this.commentsService.replyToComment(userId, commentId, dto.content);
  }

  @Patch('comments/:commentId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit own comment' })
  @ApiParam({
    name: 'commentId',
    required: true,
    description: 'UUID of the comment to edit',
  })
  @ApiBody({ type: UpdateCommentDto })
  @ApiResponse({ status: 200, description: 'Comment updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Not the comment owner.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  async updateComment(
    @GetUser('id') userId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(userId, commentId, dto.content);
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own comment (soft delete)' })
  @ApiParam({
    name: 'commentId',
    required: true,
    description: 'UUID of the comment to delete',
  })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Not the comment owner.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  async deleteComment(
    @GetUser('id') userId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return this.commentsService.deleteComment(userId, commentId);
  }
}
