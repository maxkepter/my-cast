import { UpdateCommentReqDto } from '../../dtos/req.dto';
import { CommentItemResDto } from '../../dtos/res.dto';

export interface UpdateCommentUseCase {
  /**
   * Tác giả chỉnh sửa nội dung bình luận.
   *
   * @param commentId - ID bình luận cần sửa.
   * @param authorId - ID tác giả thực hiện sửa.
   * @param dto - Nội dung mới.
   * @returns CommentItemResDto sau khi cập nhật.
   */
  execute(
    commentId: string,
    authorId: string,
    dto: UpdateCommentReqDto,
  ): Promise<CommentItemResDto> | CommentItemResDto;
}
