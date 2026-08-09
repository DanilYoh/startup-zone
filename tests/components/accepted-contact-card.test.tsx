// @vitest-environment jsdom

import { AcceptedContactCard } from "@/features/applications/components/accepted-contact-card";
import { render, screen } from "../test-utils";
import { describe, expect, it } from "vitest";

describe("AcceptedContactCard", () => {
  it("renders private contact methods for an accepted match", () => {
    render(
      <AcceptedContactCard
        contactStatus="ready"
        counterpartLabel="founder"
        contact={{
          contact_email: "founder@example.test",
          contact_url: "https://t.me/founder",
          profile_id: "founder-1",
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "founder@example.test" })).toHaveAttribute(
      "href",
      "mailto:founder@example.test",
    );
    expect(screen.getByRole("link", { name: "Открыть ссылку для связи" })).toHaveAttribute(
      "href",
      "https://t.me/founder",
    );
  });

  it("shows a waiting state when the counterpart has not enabled sharing", () => {
    render(
      <AcceptedContactCard contactStatus="ready" counterpartLabel="investor" />,
    );

    expect(screen.getByText("Инвестор пока не включил обмен контактами после принятия заявки.")).toBeVisible();
  });

  it("keeps the accepted request visible when contact loading fails", () => {
    render(
      <AcceptedContactCard contactStatus="error" counterpartLabel="founder" />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Принятая заявка остаётся сохранённой.",
    );
  });
});
