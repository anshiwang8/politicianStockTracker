import { NextResponse } from "next/server";
import { refreshDisclosuresAndScores } from "@/lib/refresh";
import { broadcastRealtime } from "@/lib/realtime";

export async function POST() {
  const result = await refreshDisclosuresAndScores();
  broadcastRealtime("dashboard-refresh", result);
  return NextResponse.json(result);
}
