import { GET } from "@/app/auth/confirm/route";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, exchangeCodeForSessionMock, logRequestErrorMock, verifyOtpMock } =
  vi.hoisted(() => ({
    createClientMock: vi.fn(),
    exchangeCodeForSessionMock: vi.fn(),
    logRequestErrorMock: vi.fn(),
    verifyOtpMock: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("@/lib/logger", () => ({ logRequestError: logRequestErrorMock }));

beforeEach(() => {
  createClientMock.mockReset();
  exchangeCodeForSessionMock.mockReset();
  logRequestErrorMock.mockReset();
  verifyOtpMock.mockReset();
  createClientMock.mockResolvedValue({
    auth: {
      exchangeCodeForSession: exchangeCodeForSessionMock,
      verifyOtp: verifyOtpMock,
    },
  });
});

describe("email confirmation callback", () => {
  it("exchanges a standard hosted PKCE code and removes it from the redirect URL", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });

    const response = await GET(
      new NextRequest(
        "https://startup.example/auth/confirm?code=one-time-secret&next=/dashboard/profile",
      ),
    );

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith("one-time-secret");
    expect(response.headers.get("location")).toBe("https://startup.example/dashboard/profile");
    expect(response.headers.get("location")).not.toContain("one-time-secret");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("rejects an expired PKCE code with a stable error redirect", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      error: { code: "bad_code", status: 400 },
    });

    const response = await GET(
      new NextRequest("https://startup.example/auth/confirm?code=expired"),
    );

    expect(response.headers.get("location")).toBe(
      "https://startup.example/auth/error?code=confirmation_failed",
    );
    expect(logRequestErrorMock).toHaveBeenCalledWith("auth.confirm_failed", {
      code: "bad_code",
      status: 400,
      flow: "pkce",
    });
  });

  it("keeps token-hash confirmation compatible with an SSR custom template", async () => {
    verifyOtpMock.mockResolvedValue({ error: null });

    const response = await GET(
      new NextRequest(
        "https://startup.example/auth/confirm?token_hash=hashed-token&type=signup&next=/dashboard",
      ),
    );

    expect(verifyOtpMock).toHaveBeenCalledWith({
      token_hash: "hashed-token",
      type: "signup",
    });
    expect(response.headers.get("location")).toBe("https://startup.example/dashboard");
  });

  it("handles an invalid token-hash link without exposing Auth details", async () => {
    verifyOtpMock.mockResolvedValue({
      error: { code: "otp_expired", status: 403 },
    });

    const response = await GET(
      new NextRequest(
        "https://startup.example/auth/confirm?token_hash=expired-hash&type=email",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://startup.example/auth/error?code=confirmation_failed",
    );
    expect(response.headers.get("location")).not.toContain("expired-hash");
    expect(logRequestErrorMock).toHaveBeenCalledWith("auth.confirm_failed", {
      code: "otp_expired",
      status: 403,
      flow: "otp",
    });
  });

  it("fails closed when a confirmation link mixes PKCE and token-hash credentials", async () => {
    const response = await GET(
      new NextRequest(
        "https://startup.example/auth/confirm?code=pkce-secret&token_hash=otp-secret&type=signup&next=/dashboard",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://startup.example/auth/error?code=invalid_confirmation_link",
    );
    expect(response.headers.get("location")).not.toContain("pkce-secret");
    expect(response.headers.get("location")).not.toContain("otp-secret");
    expect(createClientMock).not.toHaveBeenCalled();
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });

  it("rejects incomplete links and unsafe redirect destinations", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });

    const unsafeRedirect = await GET(
      new NextRequest(
        "https://startup.example/auth/confirm?code=valid&next=https://attacker.example",
      ),
    );
    const invalidLink = await GET(
      new NextRequest(
        "https://startup.example/auth/confirm?token_hash=hashed-token&type=unsupported",
      ),
    );

    expect(unsafeRedirect.headers.get("location")).toBe("https://startup.example/");
    expect(invalidLink.headers.get("location")).toBe(
      "https://startup.example/auth/error?code=invalid_confirmation_link",
    );
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });
});
