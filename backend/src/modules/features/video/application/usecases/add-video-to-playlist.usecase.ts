import { AddVideoToPlaylistReq } from '../../dtos/req.dto';
import { PlaylistRes } from '../../dtos/res.dto';

export interface AddVideoToPlaylistUseCase {
  /**
   * Adds a video to a playlist for a specific author.
   *
   * 1. Validates the authorId and request data.
   * 2. Checks if the video and playlist exist and belong to the author.
   * 3. Adds the video to the specified playlist.
   *
   * @param authorId - The ID of the author adding the video to the playlist
   * @param req - The request object containing the video and playlist information
   */
  execute(
    authorId: string,
    req: AddVideoToPlaylistReq,
  ): Promise<PlaylistRes> | PlaylistRes;
}
