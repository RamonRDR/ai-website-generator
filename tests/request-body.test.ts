import { describe, expect, it, vi } from "vitest";
import { BodyTooLargeError, readLimitedBody } from "../src/server/request-body";

function requestFromChunks(chunks: Uint8Array[], headers = new Headers()) {
  let index = 0;
  const cancelled = vi.fn();
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) controller.enqueue(chunks[index++]);
      else controller.close();
    },
    cancel: cancelled,
  }, { highWaterMark: 0 });
  return {
    request: { headers, body: stream } as Request,
    cancelled,
    getReadCount: () => index,
  };
}

describe("streaming body byte limits", () => {
  const encode = (value: string) => new TextEncoder().encode(value);

  it("accepts a body exactly at the byte limit across chunks", async () => {
    const { request } = requestFromChunks([encode("hello"), encode(" world")]);
    await expect(readLimitedBody(request, 11)).resolves.toBe("hello world");
  });

  it("counts UTF-8 bytes rather than JavaScript characters", async () => {
    const { request, cancelled } = requestFromChunks([encode("á")]);
    await expect(readLimitedBody(request, 1)).rejects.toBeInstanceOf(BodyTooLargeError);
    expect(cancelled).toHaveBeenCalledTimes(1);
  });

  it("cancels as soon as a chunk crosses the limit", async () => {
    const { request, cancelled, getReadCount } = requestFromChunks([
      encode("1234"),
      encode("5678"),
      encode("must not be consumed"),
    ]);
    await expect(readLimitedBody(request, 7)).rejects.toBeInstanceOf(BodyTooLargeError);
    expect(cancelled).toHaveBeenCalledTimes(1);
    expect(getReadCount()).toBeLessThan(3);
  });

  it("rejects an excessive Content-Length before reading the stream", async () => {
    const { request, getReadCount } = requestFromChunks(
      [encode("small")],
      new Headers({ "content-length": "9000" }),
    );
    await expect(readLimitedBody(request, 8000)).rejects.toBeInstanceOf(BodyTooLargeError);
    expect(getReadCount()).toBe(0);
  });

  it("still enforces the stream limit when Content-Length is forged", async () => {
    const { request, cancelled } = requestFromChunks(
      [encode("12345"), encode("67890")],
      new Headers({ "content-length": "2" }),
    );
    await expect(readLimitedBody(request, 8)).rejects.toBeInstanceOf(BodyTooLargeError);
    expect(cancelled).toHaveBeenCalledTimes(1);
  });

  it("rejects malformed UTF-8 without silently normalizing it", async () => {
    const { request } = requestFromChunks([new Uint8Array([0xc3, 0x28])]);
    await expect(readLimitedBody(request, 20)).rejects.toThrow();
  });

  it("returns empty text for an empty body", async () => {
    const request = { headers: new Headers(), body: null } as Request;
    await expect(readLimitedBody(request, 8)).resolves.toBe("");
  });
});
