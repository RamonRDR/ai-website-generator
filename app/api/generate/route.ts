import { NextResponse } from "next/server";
import { generateInputSchema } from "@/src/domain/schema";
import { generateDemo } from "@/src/domain/demo";
import { generateLive, ProviderError } from "@/src/server/provider";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 8000) {
      return NextResponse.json({ error: "Request too large." }, { status: 413 });
    }
    const result = generateInputSchema.safeParse(JSON.parse(raw));
    if (!result.success) {
      return NextResponse.json({ error: "Invalid generation request." }, { status: 400 });
    }
    const site =
      result.data.mode === "demo" ? generateDemo(result.data) : await generateLive(result.data);
    return NextResponse.json(
      { site, mode: result.data.mode },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof ProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unable to generate website." }, { status: 400 });
  }
}
