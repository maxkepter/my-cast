import { Page, PageReq } from '../../../../../common/dtos/page.dto';
import { WatchVideoRes } from '../../dtos/res.dto';

export interface ViewWatchHistoryUseCase {
  /**
   * Retrieves the watch history for a specific user.
   *
   * 1. Validates the provided userId to ensure it corresponds to an existing user.
   * 2. Fetches the watch history data associated with the userId from the database or relevant data source.
   *
   * @param userId - Identifier of the user whose watch history is to be retrieved.
   * @returns An array of WatchVideoRes objects representing the user's watch history.
   * @throws NotFoundException if the user with the specified userId does not exist.
   */
  viewWatchHistory(userId: string): Promise<WatchVideoRes[]> | WatchVideoRes[];

  /**
   * Retrieves the paginated watch history for a specific user.
   *
   * @param userId - Identifier of the user whose watch history is to be retrieved.
   * @param pageReq - Pagination parameters.
   * @returns A Page object representing the user's paginated watch history.
   * @throws NotFoundException if the user with the specified userId does not exist.
   */
  viewWatchHistory(
    userId: string,
    pageReq: PageReq,
  ): Promise<Page<WatchVideoRes>> | Page<WatchVideoRes>;
}
