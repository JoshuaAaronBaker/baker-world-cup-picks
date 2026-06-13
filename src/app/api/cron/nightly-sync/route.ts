import { NextResponse, type NextRequest } from "next/server";
import { runNightlyScoreSync } from "@/lib/scheduled-sync";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const authorization = request.headers.get("authorization");

    if (authorization !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await runNightlyScoreSync();

  return NextResponse.json(result);
}
