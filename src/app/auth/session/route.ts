import { NextRequest, NextResponse } from "next/server";

function isUsableToken(token: string | undefined) {
  return Boolean(token && !token.startsWith("google.") && token.length > 20);
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("axiom_access_token")?.value;
  const raw = request.cookies.get("axiom_google_user")?.value;
  if (!isUsableToken(token) || !raw) return NextResponse.json({ user: null });
  try {
    const user = JSON.parse(raw) as { id?: string; email?: string; name?: string };
    if (!user.id || !user.email || !user.name) return NextResponse.json({ user: null });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ user: null });
  response.cookies.set("axiom_google_user", "", { path: "/", maxAge: 0 });
  response.cookies.set("axiom_access_token", "", { path: "/", maxAge: 0 });
  return response;
}
