import {
  createStartup,
  updateStartup,
  updateStartupStatus,
  type StartupActionState,
} from "@/features/startups/server/actions";
import { createSupabaseActionMock } from "./supabase-action-mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, logRequestErrorMock, redirectMock, revalidatePathMock } =
  vi.hoisted(() => ({
    createClientMock: vi.fn(),
    logRequestErrorMock: vi.fn(),
    redirectMock: vi.fn((path: string): never => {
      throw new Error(`REDIRECT:${path}`);
    }),
    revalidatePathMock: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("@/lib/logger", () => ({ logRequestError: logRequestErrorMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

const database = createSupabaseActionMock();
const initialState: StartupActionState = { status: "idle" };
const founder = { id: "founder-id" };

function startupForm() {
  const form = new FormData();
  form.set("title", "Risk Ledger");
  form.set("slug", "risk-ledger");
  form.set("one_pager", "A clear startup summary for investors.");
  form.set(
    "description",
    "A sufficiently detailed startup description covering the product, market, traction, and investment opportunity.",
  );
  form.set("stage", "mvp");
  form.set("niche", "B2B SaaS");
  form.set("funding_ask", "350000");
  form.set("equity_offered", "7.5");
  form.set("website_url", "https://risk-ledger.example");
  form.set("deck_url", "");
  return form;
}

function authorizeFounder() {
  database.getUser.mockResolvedValue({ data: { user: founder } });
  database.queue("profiles", { data: { role: "founder" }, error: null });
}

beforeEach(() => {
  database.reset();
  createClientMock.mockReset().mockResolvedValue(database.client);
  logRequestErrorMock.mockReset();
  redirectMock.mockClear();
  revalidatePathMock.mockReset();
});

describe("startup Server Actions", () => {
  it("redirects unauthenticated founders", async () => {
    database.getUser.mockResolvedValue({ data: { user: null } });
    await expect(createStartup(initialState, startupForm())).rejects.toThrow(
      "REDIRECT:/auth/login",
    );
  });

  it("rejects a non-founder", async () => {
    database.getUser.mockResolvedValue({ data: { user: founder } });
    database.queue("profiles", { data: { role: "investor" }, error: null });
    const state = await createStartup(initialState, startupForm());
    expect(state.status).toBe("error");
    expect(database.latest("startups")).toBeUndefined();
  });

  it("sanitizes profile authorization errors", async () => {
    database.getUser.mockResolvedValue({ data: { user: founder } });
    database.queue("profiles", { data: null, error: { code: "08006" } });
    const state = await createStartup(initialState, startupForm());
    expect(state.status).toBe("error");
    expect(logRequestErrorMock).toHaveBeenCalledWith("startup.authorization_failed", {
      code: "08006",
    });
  });

  it("rejects invalid startup input without writing", async () => {
    authorizeFounder();
    const state = await createStartup(initialState, new FormData());
    expect(state.errors?.title).toBeDefined();
    expect(database.latest("startups")).toBeUndefined();
  });

  it("creates a startup with the authenticated founder id", async () => {
    authorizeFounder();
    database.queue("startups", { error: null });

    await expect(createStartup(initialState, startupForm())).rejects.toThrow(
      "REDIRECT:/dashboard",
    );
    expect(database.latest("startups")?.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        founder_id: founder.id,
        slug: "risk-ledger",
        funding_ask: 350000,
        deck_url: null,
      }),
    );
  });

  it.each([
    ["23505", true],
    ["08006", false],
  ])("maps startup creation error %s", async (code, duplicate) => {
    authorizeFounder();
    database.queue("startups", { error: { code } });
    const state = await createStartup(initialState, startupForm());
    expect(state.status).toBe("error");
    expect(Boolean(state.errors?.slug)).toBe(duplicate);
    expect(logRequestErrorMock).toHaveBeenCalledTimes(duplicate ? 0 : 1);
  });

  it("rejects an invalid startup id during editing", async () => {
    authorizeFounder();
    const state = await updateStartup(initialState, startupForm());
    expect(state.status).toBe("error");
    expect(database.latest("startups")).toBeUndefined();
  });

  it("updates only a startup owned by the authenticated founder", async () => {
    authorizeFounder();
    database.queue(
      "startups",
      { data: { slug: "old-slug" }, error: null },
      { data: { id: 42 }, error: null },
    );
    const form = startupForm();
    form.set("startup_id", "42");

    await expect(updateStartup(initialState, form)).rejects.toThrow("REDIRECT:/dashboard");
    const updateBuilder = database.latest("startups");
    expect(updateBuilder?.update).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "risk-ledger", website_url: "https://risk-ledger.example" }),
    );
    expect(updateBuilder?.eq).toHaveBeenCalledWith("founder_id", founder.id);
    expect(revalidatePathMock).toHaveBeenCalledWith("/startups/old-slug");
  });

  it.each([
    ["read error", { data: null, error: { code: "08006" } }],
    ["not owned", { data: null, error: null }],
  ])("rejects update when the startup has a %s", async (_name, readResponse) => {
    authorizeFounder();
    database.queue("startups", readResponse);
    const form = startupForm();
    form.set("startup_id", "42");
    const state = await updateStartup(initialState, form);
    expect(state.status).toBe("error");
  });

  it("detects an ownership race during update", async () => {
    authorizeFounder();
    database.queue(
      "startups",
      { data: { slug: "old-slug" }, error: null },
      { data: null, error: null },
    );
    const form = startupForm();
    form.set("startup_id", "42");
    const state = await updateStartup(initialState, form);
    expect(state.status).toBe("error");
  });

  it("changes publication status with an ownership filter", async () => {
    authorizeFounder();
    database.queue("startups", { data: { slug: "risk-ledger" }, error: null });
    const form = new FormData();
    form.set("startup_id", "42");
    form.set("is_active", "false");
    const state = await updateStartupStatus(initialState, form);
    expect(state.status).toBe("success");
    expect(database.latest("startups")?.update).toHaveBeenCalledWith({ is_active: false });
    expect(database.latest("startups")?.eq).toHaveBeenCalledWith("founder_id", founder.id);
  });

  it("rejects malformed publication status", async () => {
    authorizeFounder();
    const state = await updateStartupStatus(initialState, new FormData());
    expect(state.status).toBe("error");
  });

  it.each([
    ["write failure", { data: null, error: { code: "42501" } }, true],
    ["missing row", { data: null, error: null }, false],
  ])("handles status %s", async (_name, response, logged) => {
    authorizeFounder();
    database.queue("startups", response);
    const form = new FormData();
    form.set("startup_id", "42");
    form.set("is_active", "true");
    const state = await updateStartupStatus(initialState, form);
    expect(state.status).toBe("error");
    expect(logRequestErrorMock).toHaveBeenCalledTimes(logged ? 1 : 0);
  });
});
