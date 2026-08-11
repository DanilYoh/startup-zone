import {
  deleteAccount,
  type AccountDeletionActionState,
} from "@/features/account/server/actions";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClientMock,
  getUserMock,
  logRequestErrorMock,
  redirectMock,
  rpcMock,
  signInWithPasswordMock,
  signOutMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getUserMock: vi.fn(),
  logRequestErrorMock: vi.fn(),
  redirectMock: vi.fn((path: string): never => {
    throw new Error(`REDIRECT:${path}`);
  }),
  rpcMock: vi.fn(),
  signInWithPasswordMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("@/lib/logger", () => ({ logRequestError: logRequestErrorMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

const initialState: AccountDeletionActionState = { status: "idle" };

function deletionForm() {
  const formData = new FormData();
  formData.set("current_password", "correct-horse-battery-staple");
  formData.set("confirmation", "УДАЛИТЬ");
  return formData;
}

beforeEach(() => {
  getUserMock.mockReset().mockResolvedValue({
    data: { user: { id: "account-id", email: "person@example.test" } },
  });
  signInWithPasswordMock.mockReset().mockResolvedValue({ error: null });
  rpcMock.mockReset().mockResolvedValue({ data: true, error: null });
  signOutMock.mockReset().mockResolvedValue({ error: null });
  logRequestErrorMock.mockReset();
  redirectMock.mockClear();
  createClientMock.mockReset().mockResolvedValue({
    auth: {
      getUser: getUserMock,
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
    },
    rpc: rpcMock,
  });
});

describe("account deletion", () => {
  it("requires both password and exact confirmation before contacting Supabase", async () => {
    const state = await deleteAccount(initialState, new FormData());

    expect(state.status).toBe("error");
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("does not delete when password reauthentication fails", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: { code: "invalid_credentials" } });

    await expect(deleteAccount(initialState, deletionForm())).resolves.toEqual({
      status: "error",
      message: "Текущий пароль не подтверждён.",
    });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("reauthenticates, deletes through the narrow RPC, and clears the local session", async () => {
    await expect(deleteAccount(initialState, deletionForm())).rejects.toThrow(
      "REDIRECT:/?account=deleted",
    );
    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "person@example.test",
      password: "correct-horse-battery-staple",
    });
    expect(rpcMock).toHaveBeenCalledWith("delete_my_account");
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
  });

  it("returns a stable deletion error and logs only its code", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: "P0002" } });

    const state = await deleteAccount(initialState, deletionForm());

    expect(state.message).toBe("Не удалось удалить аккаунт. Повторите позже.");
    expect(logRequestErrorMock).toHaveBeenCalledWith("account.deletion_failed", {
      code: "P0002",
    });
  });
});
