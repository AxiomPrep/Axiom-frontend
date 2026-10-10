import { NextResponse } from "next/server";
import {
  listPolicyAcceptances,
  recordPolicyAcceptance,
} from "@/lib/policy-acceptances";

function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const acceptances = await listPolicyAcceptances({ email });
  return NextResponse.json({
    acceptances,
    count: acceptances.length,
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      name?: string;
      userId?: string;
      planId?: string;
      planName?: string;
      track?: string;
      termsAccepted?: boolean;
      refundAccepted?: boolean;
      privacyAcknowledged?: boolean;
    };

    const row = await recordPolicyAcceptance({
      email: String(body.email || ""),
      name: body.name,
      userId: body.userId,
      planId: body.planId,
      planName: body.planName,
      track: body.track,
      termsAccepted: Boolean(body.termsAccepted),
      refundAccepted: Boolean(body.refundAccepted),
      privacyAcknowledged: Boolean(body.privacyAcknowledged),
      userAgent: req.headers.get("user-agent"),
      ip: clientIp(req),
    });

    return NextResponse.json({ acceptance: row, ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        error: "invalid",
        message: err instanceof Error ? err.message : "Could not save acceptance.",
      },
      { status: 400 },
    );
  }
}
