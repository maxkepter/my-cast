import { CreateCommentReqDto } from '../../dtos/req.dto';
import { CommentItemResDto } from '../../dtos/res.dto';

export interface CreateCommentUseCase {
  /**
   * Tạo bình luận gốc hoặc reply dưới video.
   *
   * @param authorId - ID người đăng bình luận.
   * @param dto - Thông tin tạo bình luận.
   * @returns CommentItemResDto vừa được tạo.
   */
  execute(
    authorId: string,
    dto: CreateCommentReqDto,
  ): Promise<CommentItemResDto> | CommentItemResDto;
}
