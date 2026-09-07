export async function readStream(bodyStream) {
  const reader = bodyStream.getReader();
  const decoder = new TextDecoder();
  let body = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    body += decoder.decode(value, { stream: true });
  }

  body += decoder.decode();
  return body;
}
