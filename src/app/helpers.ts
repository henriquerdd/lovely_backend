import baseSlugify from "slugify";

export function slugify(str: string): string {
  return baseSlugify(str, { lower: true });
}
