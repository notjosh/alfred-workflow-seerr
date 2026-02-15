// Seerr media status codes
// https://github.com/seerr-team/seerr/blob/develop/server/constants/media.ts
export const MediaStatus = {
  UNKNOWN: 1,
  PENDING: 2,
  PROCESSING: 3,
  PARTIALLY_AVAILABLE: 4,
  AVAILABLE: 5,
} as const;

export type MediaStatusCode = (typeof MediaStatus)[keyof typeof MediaStatus];

export function mediaStatusLabel(status: number): string {
  switch (status) {
    case MediaStatus.UNKNOWN:
      return "Unknown";
    case MediaStatus.PENDING:
      return "Pending";
    case MediaStatus.PROCESSING:
      return "Processing";
    case MediaStatus.PARTIALLY_AVAILABLE:
      return "Partially Available";
    case MediaStatus.AVAILABLE:
      return "Available";
    default:
      return "Unknown";
  }
}
