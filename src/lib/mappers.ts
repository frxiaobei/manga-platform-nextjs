import { AssetCategory, CharacterStatus, CouponStatus } from "@prisma/client";

export function statusToApi(status: CharacterStatus) {
  return status.toLowerCase();
}

export function assetCategoryToApi(category: AssetCategory) {
  return category.toLowerCase();
}

export function couponStatusToApi(status: CouponStatus) {
  return status.toLowerCase();
}

export function slugifyTag(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function splitTags(tagsCsv: string | null) {
  if (!tagsCsv) return [];
  return tagsCsv
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}
