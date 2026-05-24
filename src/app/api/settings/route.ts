import { NextResponse } from "next/server";
import { getScoreWeights, updateScoreWeights } from "@/lib/settings";

export async function GET() {
  return NextResponse.json({ weights: getScoreWeights() });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ weights: updateScoreWeights(body.weights ?? {}) });
}
