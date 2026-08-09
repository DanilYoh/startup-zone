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
  rpcMock,
  signInWithPasswordMock,
  signUpMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  headersMock: vi.fn(),
  logRequestErrorMock: vi.fn(),
  redirectMock: vi.fn((pathname: string): never => {
    throw new Error(`REDIRECT:${pathname}`);
  }),
  rpcMock: vi.fn(),
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
const betaInvitationCode = "AbCdEfGhIjKlMnOpQrStUvWxYz012345";

function validSignUpForm() {
  const formData = new FormData();
  formData.set("full_name", "Taylor Jordan");
  formData.set("email", "taylor@example.test");
  formData.set("beta_invitation_code", betaInvitationCode);
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
  rpcMock.mockReset();
  signInWithPasswordMock.mockReset();
  signUpMock.mockReset();

  headersMock.mockResolvedValue(new Headers({ origin: "https://request.example" }));
  rpcMock.mockResolvedValue({ data: true, error: null });
  createClientMock.mockResolvedValue({
    auth: {
      signInWithPassword: signInWithPasswordMock,
      signUp: signUpMock,
    },
    rpc: rpcMock,
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
          beta_invitation_hash: "0ab93262e08b4a300dafed0e5f6e809388300db11ea5f0039eef5dfd2c322f41",
          full_name: "Taylor Jordan",
          legal_consent: true,
          legal_document_version: "local-development-v1",
          role: "founder",
        },
        emailRedirectTo:
          "https://startup.example/auth/confirm?next=%2Fdashboard%2Fprofile",
      },
    });
    expect(rpcMock).toHaveBeenCalledWith("is_beta_invitation_valid", {
      candidate_email: "taylor@example.test",
      candidate_hash: "0ab93262e08b4a300dafed0e5f6e809388300db11ea5f0039eef5dfd2c322f41",
      candidate_role: "founder",
    });
  });

  it("returns field errors without contacting Auth", async () => {
    const state = await signUp(initialSignUpState, new FormData());

    expect(state.status).toBe("error");
    expect(state.errors?.email).toBeDefined();
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("rejects malformed invitation codes before contacting Auth", async () => {
    const formData = validSignUpForm();
    formData.set("beta_invitation_code", "short-code");

    const state = await signUp(initialSignUpState, formData);

    expect(state.errors?.beta_invitation_code).toBeDefined();
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("returns a stable error for an invalid or mismatched invitation", async () => {
    rpcMock.mockResolvedValue({ data: false, error: null });

    const state = await signUp(initialSignUpState, validSignUpForm());

    expect(state.message).toBe(
      "Код приглашения недействителен, уже использован или не соответствует email и роли.",
    );
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("does not expose invitation lookup failures", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: "08006" } });

    const state = await signUp(initialSignUpState, validSignUpForm());

    expect(state.message).toBe("Регистрация временно недоступна. Попробуйте позже.");
    expect(logRequestErrorMock).toHaveBeenCalledWith("auth.invitation_validation_failed", {
      code: "08006",
    });
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
