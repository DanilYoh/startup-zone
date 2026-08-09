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
vi.mock("server-only", () => ({}));
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
  formData.set("legal_document_version", "local-development-v1");
  formData.set("personal_data_consent", "accepted");
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
        data: {
          full_name: "Taylor Jordan",
          legal_consent: true,
          legal_document_version: "local-development-v1",
          role: "founder",
        },
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

  it("fails closed when production legal documents are not approved", async () => {
    vi.stubEnv("APP_ENVIRONMENT", "production");
    vi.stubEnv("LEGAL_DOCUMENT_APPROVED", "false");

    const state = await signUp(initialSignUpState, validSignUpForm());

    expect(state).toEqual({
      status: "error",
      message: "Регистрация временно закрыта: документы об обработке персональных данных ещё не утверждены.",
    });
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("rejects a stale legal document version before contacting Auth", async () => {
    const formData = validSignUpForm();
    formData.set("legal_document_version", "outdated-v1");

    const state = await signUp(initialSignUpState, formData);

    expect(state.message).toBe(
      "Версия документов изменилась. Обновите страницу и подтвердите согласие снова.",
    );
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("returns a stable rate-limit error and records only safe Auth metadata", async () => {
    signUpMock.mockResolvedValue({
      data: { session: null },
      error: { code: "over_request_rate_limit", status: 429 },
    });

    const state = await signUp(initialSignUpState, validSignUpForm());

    expect(state.message).toBe("Слишком много попыток регистрации. Подождите и попробуйте снова.");
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

    expect(state.message).toBe("Неверная электронная почта или пароль.");
    expect(state.message).not.toContain("invalid_credentials");
  });
});
