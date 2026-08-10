import {
  createApplication,
  moderateApplication,
  type ApplicationActionState,
  type ModerationActionState,
} from "@/features/applications/server/actions";
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
const applicationState: ApplicationActionState = { status: "idle" };
const moderationState: ModerationActionState = { status: "idle" };
const investor = { id: "investor-id" };
const founder = { id: "founder-id" };

function applicationForm() {
  const form = new FormData();
  form.set("startup_id", "42");
  form.set("message", "I would like to discuss this investment opportunity.");
  return form;
}

function moderationForm(decision: "accepted" | "rejected" = "accepted") {
  const form = new FormData();
  form.set("application_id", "7");
  form.set("decision", decision);
  return form;
}

beforeEach(() => {
  database.reset();
  createClientMock.mockReset().mockResolvedValue(database.client);
  logRequestErrorMock.mockReset();
  redirectMock.mockClear();
  revalidatePathMock.mockReset();
});

describe("application Server Actions", () => {
  it("redirects unauthenticated submissions", async () => {
    database.getUser.mockResolvedValue({ data: { user: null } });
    await expect(createApplication(applicationState, applicationForm())).rejects.toThrow(
      "REDIRECT:/auth/login",
    );
  });

  it("rejects malformed applications before authorization reads", async () => {
    database.getUser.mockResolvedValue({ data: { user: investor } });
    const state = await createApplication(applicationState, new FormData());
    expect(state.status).toBe("error");
    expect(state.errors?.message).toBeDefined();
    expect(database.from).not.toHaveBeenCalled();
  });

  it("creates an investor application with server-derived ownership", async () => {
    database.getUser.mockResolvedValue({ data: { user: investor } });
    database.queue("profiles", { data: { role: "investor" }, error: null });
    database.queue("startups", {
      data: { id: 42, founder_id: founder.id, is_active: true },
      error: null,
    });
    database.queue("applications", { error: null });

    const state = await createApplication(applicationState, applicationForm());

    expect(state.status).toBe("success");
    expect(database.latest("applications")?.insert).toHaveBeenCalledWith({
      startup_id: 42,
      applicant_id: investor.id,
      type: "investor",
      message: "I would like to discuss this investment opportunity.",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/applications");
  });

  it.each([
    ["founder role", { role: "founder" }, { id: 42, founder_id: founder.id, is_active: true }],
    ["inactive startup", { role: "investor" }, { id: 42, founder_id: founder.id, is_active: false }],
    ["own startup", { role: "investor" }, { id: 42, founder_id: investor.id, is_active: true }],
  ])("rejects %s", async (_name, profile, startup) => {
    database.getUser.mockResolvedValue({ data: { user: investor } });
    database.queue("profiles", { data: profile, error: null });
    database.queue("startups", { data: startup, error: null });
    const state = await createApplication(applicationState, applicationForm());
    expect(state.status).toBe("error");
    expect(database.latest("applications")).toBeUndefined();
  });

  it("sanitizes authorization query failures", async () => {
    database.getUser.mockResolvedValue({ data: { user: investor } });
    database.queue("profiles", { data: null, error: { code: "08006" } });
    database.queue("startups", { data: null, error: null });
    const state = await createApplication(applicationState, applicationForm());
    expect(state.status).toBe("error");
    expect(logRequestErrorMock).toHaveBeenCalledWith("application.authorization_failed", {
      profileCode: "08006",
      startupCode: undefined,
    });
  });

  it.each([
    ["23505", /уже|Р’С‹ СѓР¶Рµ/u, false],
    ["P0001", /лимит|Р»РёРјРёС‚/u, false],
    ["08006", /Не удалось|РќРµ СѓРґР°Р»РѕСЃСЊ/u, true],
  ])("maps application write error %s", async (code, message, logged) => {
    database.getUser.mockResolvedValue({ data: { user: investor } });
    database.queue("profiles", { data: { role: "investor" }, error: null });
    database.queue("startups", {
      data: { id: 42, founder_id: founder.id, is_active: true },
      error: null,
    });
    database.queue("applications", { error: { code } });
    const state = await createApplication(applicationState, applicationForm());
    expect(state.message).toMatch(message);
    expect(logRequestErrorMock).toHaveBeenCalledTimes(logged ? 1 : 0);
  });

  it("accepts a pending application owned by the founder", async () => {
    database.getUser.mockResolvedValue({ data: { user: founder } });
    database.queue("profiles", { data: { role: "founder" }, error: null });
    database.queue(
      "applications",
      {
        data: { id: 7, status: "pending", startup: { founder_id: founder.id } },
        error: null,
      },
      { data: { id: 7 }, error: null },
    );
    const state = await moderateApplication(moderationState, moderationForm());
    expect(state.status).toBe("success");
    expect(database.latest("applications")?.update).toHaveBeenCalledWith({
      status: "accepted",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/applications/inbox");
  });

  it.each([
    ["non-founder", { role: "investor" }, null],
    ["unowned", { role: "founder" }, { id: 7, status: "pending", startup: { founder_id: "other" } }],
    ["terminal", { role: "founder" }, { id: 7, status: "accepted", startup: { founder_id: founder.id } }],
  ])("rejects moderation by %s", async (_name, profile, application) => {
    database.getUser.mockResolvedValue({ data: { user: founder } });
    database.queue("profiles", { data: profile, error: null });
    if (application) database.queue("applications", { data: application, error: null });
    const state = await moderateApplication(moderationState, moderationForm());
    expect(state.status).toBe("error");
  });

  it("handles a concurrent moderation decision", async () => {
    database.getUser.mockResolvedValue({ data: { user: founder } });
    database.queue("profiles", { data: { role: "founder" }, error: null });
    database.queue(
      "applications",
      {
        data: { id: 7, status: "pending", startup: { founder_id: founder.id } },
        error: null,
      },
      { data: null, error: null },
    );
    const state = await moderateApplication(moderationState, moderationForm("rejected"));
    expect(state.status).toBe("error");
  });

  it("logs and sanitizes moderation write failures", async () => {
    database.getUser.mockResolvedValue({ data: { user: founder } });
    database.queue("profiles", { data: { role: "founder" }, error: null });
    database.queue(
      "applications",
      {
        data: { id: 7, status: "pending", startup: { founder_id: founder.id } },
        error: null,
      },
      { data: null, error: { code: "42501" } },
    );
    const state = await moderateApplication(moderationState, moderationForm());
    expect(state.status).toBe("error");
    expect(logRequestErrorMock).toHaveBeenCalledWith(
      "application.moderation_write_failed",
      { code: "42501" },
    );
  });
});
