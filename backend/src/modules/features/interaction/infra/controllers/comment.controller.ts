import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, JwtGuard } from '../../../auth/contracts/auth.contract';
import { CommentService } from '../../application/services/comment.service';
import { CreateCommentReqDto, UpdateCommentReqDto } from '../../dtos/req.dto';
import { CommentItemResDto } from '../../dtos/res.dto';

@Controller(['comments', 'api/comments'])
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get('video/:videoId')
  async viewComments(
    @Param('videoId') videoId: string,
    @Query('parentId') parentId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<CommentItemResDto[]> {
    return this.commentService.viewComments(
      videoId,
      parentId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Post()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateCommentReqDto,
  ): Promise<CommentItemResDto> {
    return this.commentService.createComment(userId, dto);
  }

  @Patch(':commentId')
  @UseGuards(JwtGuard)
  async updateComment(
    @Param('commentId') commentId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateCommentReqDto,
  ): Promise<CommentItemResDto> {
    return this.commentService.updateComment(commentId, userId, dto);
  }

  @Delete(':commentId')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<void> {
    await this.commentService.deleteComment(commentId, userId);
  }
}
