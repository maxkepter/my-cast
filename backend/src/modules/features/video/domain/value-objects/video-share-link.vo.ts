import { ValueObject } from '../../../../../common/domain/value-object';
import { SharePlatform } from '../enums/share-platform.enum';

export class VideoShareLink implements ValueObject<VideoShareLink> {
  readonly url: string;
  readonly platform: SharePlatform;
  readonly embedCode?: string;

  constructor(url: string, platform: SharePlatform, embedCode?: string) {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      throw new Error('VideoShareLink: URL must be a valid non-empty string');
    }
    this.url = url.trim();
    this.platform = platform;
    this.embedCode = embedCode;
  }

  static create(
    baseUrl: string,
    videoId: string,
    platform: SharePlatform = SharePlatform.DIRECT_LINK,
  ): VideoShareLink {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const url = `${cleanBase}/watch/${videoId}?utm_source=${platform.toLowerCase()}&utm_medium=share`;
    const embedCode = `<iframe src="${cleanBase}/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
    return new VideoShareLink(url, platform, embedCode);
  }

  equals(vo?: ValueObject<VideoShareLink>): boolean {
    if (!vo) return false;
    if (!(vo instanceof VideoShareLink)) return false;
    return this.url === vo.url && this.platform === vo.platform;
  }
}
