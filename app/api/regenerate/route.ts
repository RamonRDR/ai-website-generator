import { NextResponse } from "next/server";
import { regenerateDemo } from "@/src/domain/demo";
import { regenerationInputSchema } from "@/src/domain/schema";
import { regenerateLive, ProviderError } from "@/src/server/provider";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 110000) {
      return NextResponse.json({ error: "Request too large." }, { status: 413 });
    }
    const result = regenerationInputSchema.safeParse(JSON.parse(raw));
    if (!result.success) {
      return NextResponse.json({ error: "Invalid regeneration request." }, { status: 400 });
    }
    const site = result.data.mode === "demo"
      ? regenerateDemo(result.data.site, result.data.sectionId, result.data.instruction)
      : await regenerateLive(result.data);
    return NextResponse.json({ site, mode: result.data.mode }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unable to regenerate section." }, { status: 400 });
  }
}
