import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ADMIN_COOKIE_NAME, adminCookieOptions, signAdminSession } from "@/lib/auth/session";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminHash) {
    return NextResponse.json(
      { error: "Admin not configured" },
      { status: 500 },
    );
  }

  if (email.toLowerCase() !== adminEmail.toLowerCase()) {
    // Run a dummy compare to keep response time consistent
    await bcrypt.compare(password, "$2a$12$" + "x".repeat(53));
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, adminHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signAdminSession(email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, adminCookieOptions());
  return res;
}
