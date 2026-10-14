import { ValueObject } from '../../../../common/domain/value-object';

export class SocialLinks implements ValueObject<SocialLinks> {
  constructor(
    public readonly youtube?: string,
    public readonly twitter?: string,
    public readonly facebook?: string,
    public readonly website?: string,
    public readonly others?: Record<string, string>,
  ) {}

  static create(links?: {
    youtube?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
    others?: Record<string, string>;
  }): SocialLinks {
    if (!links) return new SocialLinks();
    return new SocialLinks(
      links.youtube,
      links.twitter,
      links.facebook,
      links.website,
      links.others,
    );
  }

  equals(vo?: ValueObject<SocialLinks>): boolean {
    if (!vo) return false;
    if (!(vo instanceof SocialLinks)) return false;
    return (
      this.youtube === vo.youtube &&
      this.twitter === vo.twitter &&
      this.facebook === vo.facebook &&
      this.website === vo.website &&
      JSON.stringify(this.others) === JSON.stringify(vo.others)
    );
  }
}
