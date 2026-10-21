import { Comment } from '../entities/comment.entity';

export class CommentAuthorizationPolicy {
  /**
   * Kiểm tra quyền xóa bình luận:
   * - Tác giả bình luận có quyền tự xóa (`currentUserId === comment.authorId`)
   * - Chủ sở hữu video có quyền kiểm duyệt xóa bình luận trên video của mình (`currentUserId === videoAuthorId`)
   *
   * @param comment - Entity bình luận cần xóa
   * @param currentUserId - ID người dùng đang yêu cầu xóa
   * @param videoAuthorId - ID chủ video sở hữu bình luận đó (lấy qua VideoQueryContract)
   * @returns boolean - true nếu được phép xóa, ngược lại false
   */
  static canDelete(
    comment: Comment,
    currentUserId: string,
    videoAuthorId: string,
  ): boolean {
    if (!comment || !currentUserId || !videoAuthorId) {
      return false;
    }
    const isAuthor = comment.authorId === currentUserId;
    const isVideoOwner = videoAuthorId === currentUserId;
    return isAuthor || isVideoOwner;
  }
}
