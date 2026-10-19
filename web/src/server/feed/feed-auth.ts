export const FEED_AUTHORIZATION_HEADER = "x-api-key";

export function isFeedRequestAuthorized(
  request: Request,
  expectedApiKey: string | undefined,
): boolean {
  return (
    expectedApiKey !== undefined &&
    request.headers.get(FEED_AUTHORIZATION_HEADER) === expectedApiKey
  );
}
