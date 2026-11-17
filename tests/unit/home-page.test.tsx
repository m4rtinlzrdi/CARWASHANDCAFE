import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomePage from "../../app/page";

describe("scaffold home page", () => {
  it("clearly labels ordering as unavailable and exposes no decorative action", () => {
    const markup = renderToStaticMarkup(createElement(HomePage));

    expect(markup).toContain("Situs sedang disiapkan");
    expect(markup).toContain("Menu digital dan pemesanan belum tersedia.");
    expect(markup).toContain("memesan sebagai tamu dan membayar langsung di kasir");
    expect(markup).not.toMatch(/<(?:button|form|a)\b/i);
  });
});
