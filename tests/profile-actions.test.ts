import {
  updateProfile,
  updateProfileContact,
  type ProfileActionState,
  type ProfileContactActionState,
} from "@/features/profiles/server/actions";
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
const profileState: ProfileActionState = { status: "idle" };
const contactState: ProfileContactActionState = { status: "idle" };
const user = { id: "profile-id" };

function profileForm(role: "founder" | "investor" = "founder") {
  const form = new FormData();
  form.set("full_name", role === "founder" ? "Demo Founder" : "Demo Investor");
  form.set("headline", "A concise professional headline");
  form.set("bio", "Profile context");
  form.set("location", "Yekaterinburg");
  form.set("avatar_url", "");
  form.set("linkedin_url", "https://linkedin.com/in/demo-profile");
  form.set("founder_experience", role === "founder" ? "Built two products" : "");
  form.set("investor_organization", role === "investor" ? "Seed Fund" : "");
  form.set("investment_thesis", role === "investor" ? "B2B software" : "");
  if (role === "investor") form.append("preferred_stages", "seed");
  form.set("ticket_min", role === "investor" ? "100000" : "");
  form.set("ticket_max", role === "investor" ? "500000" : "");
  form.set("website_url", role === "investor" ? "https://seed-fund.example" : "");
  return form;
}

function contactForm(sharing = true) {
  const form = new FormData();
  form.set("contact_email", "contact@example.test");
  form.set("contact_url", "https://t.me/demo-contact");
  if (sharing) form.set("sharing_enabled", "on");
  return form;
}

beforeEach(() => {
  database.reset();
  database.getUser.mockResolvedValue({ data: { user } });
  createClientMock.mockReset().mockResolvedValue(database.client);
  logRequestErrorMock.mockReset();
  redirectMock.mockClear();
  revalidatePathMock.mockReset();
});

describe("profile Server Actions", () => {
  it("redirects unauthenticated profile updates", async () => {
    database.getUser.mockResolvedValue({ data: { user: null } });
    await expect(updateProfile(profileState, profileForm())).rejects.toThrow(
      "REDIRECT:/auth/login",
    );
  });

  it("rejects invalid profile input before database reads", async () => {
    const state = await updateProfile(profileState, new FormData());
    expect(state.errors?.full_name).toBeDefined();
    expect(database.from).not.toHaveBeenCalled();
  });

  it("updates founder fields while clearing investor-only fields", async () => {
    database.queue(
      "profiles",
      { data: { role: "founder" }, error: null },
      { data: { id: user.id }, error: null },
    );
    const state = await updateProfile(profileState, profileForm("founder"));
    expect(state.status).toBe("success");
    expect(database.latest("profiles")?.update).toHaveBeenCalledWith(
      expect.objectContaining({
        founder_experience: "Built two products",
        investment_thesis: null,
        preferred_stages: [],
        ticket_min: null,
      }),
    );
    expect(database.latest("profiles")?.eq).toHaveBeenCalledWith("id", user.id);
  });

  it("updates investor decision fields while clearing founder experience", async () => {
    database.queue(
      "profiles",
      { data: { role: "investor" }, error: null },
      { data: { id: user.id }, error: null },
    );
    const state = await updateProfile(profileState, profileForm("investor"));
    expect(state.status).toBe("success");
    expect(database.latest("profiles")?.update).toHaveBeenCalledWith(
      expect.objectContaining({
        founder_experience: null,
        investor_organization: "Seed Fund",
        preferred_stages: ["seed"],
        ticket_min: 100000,
        ticket_max: 500000,
      }),
    );
  });

  it.each([
    ["authorization failure", { data: null, error: { code: "08006" } }],
    ["obsolete role", { data: { role: "specialist" }, error: null }],
  ])("rejects profile %s", async (_name, response) => {
    database.queue("profiles", response);
    const state = await updateProfile(profileState, profileForm());
    expect(state.status).toBe("error");
  });

  it.each([
    ["write failure", { data: null, error: { code: "42501" } }, true],
    ["missing row", { data: null, error: null }, false],
  ])("handles profile %s", async (_name, response, logged) => {
    database.queue(
      "profiles",
      { data: { role: "founder" }, error: null },
      response,
    );
    const state = await updateProfile(profileState, profileForm());
    expect(state.status).toBe("error");
    expect(logRequestErrorMock).toHaveBeenCalledTimes(logged ? 1 : 0);
  });

  it("validates contact sharing before database reads", async () => {
    const form = new FormData();
    form.set("sharing_enabled", "on");
    const state = await updateProfileContact(contactState, form);
    expect(state.errors?.contact_email).toBeDefined();
    expect(database.from).not.toHaveBeenCalled();
  });

  it("saves explicitly shared private contacts", async () => {
    database.queue(
      "profiles",
      { data: { role: "investor" }, error: null },
    );
    database.queue("profile_contacts", { data: { profile_id: user.id }, error: null });
    const state = await updateProfileContact(contactState, contactForm());
    expect(state.status).toBe("success");
    expect(database.latest("profile_contacts")?.update).toHaveBeenCalledWith({
      contact_email: "contact@example.test",
      contact_url: "https://t.me/demo-contact",
      sharing_enabled: true,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/applications/inbox");
  });

  it("can disable sharing while retaining the private contact", async () => {
    database.queue("profiles", { data: { role: "founder" }, error: null });
    database.queue("profile_contacts", { data: { profile_id: user.id }, error: null });
    const state = await updateProfileContact(contactState, contactForm(false));
    expect(state.status).toBe("success");
    expect(database.latest("profile_contacts")?.update).toHaveBeenCalledWith(
      expect.objectContaining({ sharing_enabled: false }),
    );
  });

  it.each([
    ["authorization failure", { data: null, error: { code: "08006" } }],
    ["obsolete role", { data: { role: "specialist" }, error: null }],
  ])("rejects contact %s", async (_name, response) => {
    database.queue("profiles", response);
    const state = await updateProfileContact(contactState, contactForm());
    expect(state.status).toBe("error");
  });

  it.each([
    ["write failure", { data: null, error: { code: "42501" } }, true],
    ["missing row", { data: null, error: null }, false],
  ])("handles contact %s", async (_name, response, logged) => {
    database.queue("profiles", { data: { role: "founder" }, error: null });
    database.queue("profile_contacts", response);
    const state = await updateProfileContact(contactState, contactForm());
    expect(state.status).toBe("error");
    expect(logRequestErrorMock).toHaveBeenCalledTimes(logged ? 1 : 0);
  });
});
