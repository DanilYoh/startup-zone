import {
  signIn,
  signUp,
  type SignInActionState,
  type SignUpActionState,
} from "@/features/auth/server/actions";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClientMock,
  headersMock,
  logRequestErrorMock,
  redirectMock,
  signInWithPasswordMock,
  signUpMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  headersMock: vi.fn(),
  logRequestErrorMock: vi.fn(),
  redirectMock: vi.fn((pathname: string): never => {
    throw new Error(`REDIRECT:${pathname}`);
  }),
  signInWithPasswordMock: vi.fn(),
  signUpMock: vi.fn(),
}));

vi.mock("@/lib/utils", () => ({ hasEnvVars: true }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("@/lib/logger", () => ({ logRequestError: logRequestErrorMock }));
vi.mock("next/headers", () => ({ headers: headersMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

const initialSignUpState: SignUpActionState = { status: "idle" };
const initialSignInState: SignInActionState = { status: "idle" };

function validSignUpForm() {
  const formData = new FormData();
  formData.set("full_name", "Taylor Jordan");
  formData.set("email", "taylor@example.test");
  formData.set("role", "founder");
  formData.set("password", "safe-password");
  formData.set("repeat_password", "safe-password");
  return formData;
}

function validSignInForm() {
  const formData = new FormData();
  formData.set("email", "taylor@example.test");
  formData.set("password", "safe-password");
  return formData;
}

beforeEach(() => {
  createClientMock.mockReset();
  headersMock.mockReset();
  logRequestErrorMock.mockReset();
  redirectMock.mockClear();
  signInWithPasswordMock.mockReset();
  signUpMock.mockReset();

  headersMock.mockResolvedValue(new Headers({ origin: "https://request.example" }));
  createClientMock.mockResolvedValue({
    auth: {
      signInWithPassword: signInWithPasswordMock,
      signUp: signUpMock,
    },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("auth Server Actions", () => {
  it("uses the repository callback for hosted email confirmation", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://startup.example/some-path");
    signUpMock.mockResolvedValue({ data: { session: null }, error: null });

    await expect(signUp(initialSignUpState, validSignUpForm())).rejects.toThrow(
      "REDIRECT:/auth/sign-up-success",
    );

    expect(signUpMock).toHaveBeenCalledWith({
      email: "taylor@example.test",
      password: "safe-password",
      options: {
        data: { full_name: "Taylor Jordan", role: "founder" },
        emailRedirectTo:
          "https://startup.example/auth/confirm?next=%2Fdashboard%2Fprofile",
      },
    });
  });

  it("returns field errors without contacting Auth", async () => {
    const state = await signUp(initialSignUpState, new FormData());

    expect(state.status).toBe("error");
    expect(state.errors?.email).toBeDefined();
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("returns a stable rate-limit error and records only safe Auth metadata", async () => {
    signUpMock.mockResolvedValue({
      data: { session: null },
      error: { code: "over_request_rate_limit", status: 429 },
    });

    const state = await signUp(initialSignUpState, validSignUpForm());

    expect(state.message).toBe("Too many sign-up attempts. Wait a moment and try again.");
    expect(logRequestErrorMock).toHaveBeenCalledWith("auth.signup_failed", {
      code: "over_request_rate_limit",
      status: 429,
    });
  });

  it("redirects only after a successful password sign-in", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });

    await expect(signIn(initialSignInState, validSignInForm())).rejects.toThrow(
      "REDIRECT:/dashboard",
    );
    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "taylor@example.test",
      password: "safe-password",
    });
  });

  it("returns a stable sign-in error instead of exposing Auth details", async () => {
    signInWithPasswordMock.mockResolvedValue({
      error: { code: "invalid_credentials", status: 400 },
    });

    const state = await signIn(initialSignInState, validSignInForm());

    expect(state.message).toBe("Email or password is incorrect.");
    expect(state.message).not.toContain("invalid_credentials");
  });
});
