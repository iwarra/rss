export const SCHEDULE_AUTHORIZATION_HEADER = "x-ingestion-schedule-secret";

export function isScheduledIngestionRequestAuthorized(
  request: Request,
  expectedSecret: string | undefined,
): boolean {
  return (
    expectedSecret !== undefined &&
    request.headers.get(SCHEDULE_AUTHORIZATION_HEADER) === expectedSecret
  );
}
