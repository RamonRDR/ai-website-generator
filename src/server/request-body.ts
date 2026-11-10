// Stream request bodies with a strict byte ceiling, even for chunked transfers.
// A Content-Length header is only an early rejection hint, never the sole limit.
export class BodyTooLargeError extends Error {
  constructor() {
    super("Request too large.");
    this.name = "BodyTooLargeError";
  }
}

export async function readLimitedBody(request: Request, maxBytes: number): Promise<string> {
  const advertisedLength = request.headers.get("content-length");
  if (
    advertisedLength !== null &&
    /^\d+$/.test(advertisedLength) &&
    Number(advertisedLength) > maxBytes
  ) {
    throw new BodyTooLargeError();
  }

  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let received = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return text + decoder.decode();

      received += value.byteLength;
      if (received > maxBytes) {
        // Stop consuming as soon as the limit is breached, without buffering
        // subsequent chunks or waiting for the remote sender to finish.
        void reader.cancel().catch(() => {});
        throw new BodyTooLargeError();
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}
