export interface DeleteCommentUseCase {
  /**
   * Tác giả tự xóa bình luận hoặc Creator/chủ video xóa bình luận vi phạm.
   *
   * @param commentId - ID bình luận cần xóa.
   * @param currentUserId - ID người yêu cầu xóa.
   * @returns boolean - true nếu xóa thành công.
   */
  execute(commentId: string, currentUserId: string): Promise<boolean> | boolean;
}
