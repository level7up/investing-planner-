import { NextResponse, type NextRequest } from "next/server";
import { getActionSession } from "@/lib/data/action";
import { loadFundList } from "@/lib/funds/fetch";
import { searchFunds } from "@/lib/funds/startamarkets";

const MAX_QUERY_LENGTH = 60;
const RESULT_LIMIT = 20;

export async function GET(request: NextRequest) {
  const session = await getActionSession();
  if (!session) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const query = (request.nextUrl.searchParams.get("q") ?? "").slice(0, MAX_QUERY_LENGTH);
  const funds = await loadFundList();
  if (funds === null) return NextResponse.json({ error: "تعذّر جلب قائمة الصناديق الآن" }, { status: 502 });
  return NextResponse.json({ funds: searchFunds(funds, query, RESULT_LIMIT) });
}
