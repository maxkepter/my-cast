export interface DeleteVideoUseCase {
  /**
   *
   * Deletes a video by its ID for a given author.
   *
   * 1. Validates that the video exists and belongs to the author.
   * 2. Deletes the video from the database.
   * 3. Returns a promise that resolves when the deletion is complete.
   *
   * @param authorId - The ID of the author who owns the video
   * @param videoId - The ID of the video to be deleted
   * @throws NotFoundException if the video does not exist
   * @throws ForbiddenException if the user is not the owner of the video
   * @throws BadRequestException if the request data is invalid
   */
  execute(authorId: string, videoId: string): Promise<void> | void;
}
