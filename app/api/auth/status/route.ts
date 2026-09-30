import { getSupabaseConfig } from "@/server/kickx/config";
import { json } from "@/server/kickx/http";
export const dynamic = "force-dynamic";
export async function GET() { return json({ enabled: !!getSupabaseConfig() }); }
