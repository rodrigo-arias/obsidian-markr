// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createPostProcessor } from "@/post-processor";

function render(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  const ctx = {} as Parameters<ReturnType<typeof createPostProcessor>>[1];
  createPostProcessor()(root, ctx);
  return root;
}

describe("post-processor — color class", () => {
  it("classifies a green emoji highlight", () => {
    const root = render("<mark>🟢 hello</mark>");
    const mark = root.querySelector("mark")!;
    expect(mark.classList.contains("markr-green")).toBe(true);
  });

  it("classifies a no-emoji highlight as default", () => {
    const root = render("<mark>plain text</mark>");
    expect(root.querySelector("mark")!.classList.contains("markr-default")).toBe(true);
  });

  it("classifies a non-palette emoji as default", () => {
    const root = render("<mark>🐸 frog</mark>");
    expect(root.querySelector("mark")!.classList.contains("markr-default")).toBe(true);
  });
});

describe("post-processor — emoji prefix", () => {
  it("strips the emoji prefix from the visible text", () => {
    const root = render("<mark>🟢 hello</mark>");
    expect(root.querySelector("mark")!.textContent).toBe("hello");
  });

  it("leaves a no-emoji highlight unchanged", () => {
    const root = render("<mark>plain</mark>");
    expect(root.querySelector("mark")!.textContent).toBe("plain");
  });
});

describe("post-processor — idempotence", () => {
  it("does not strip twice on repeated calls", () => {
    const root = document.createElement("div");
    root.innerHTML = "<mark>🟢 hello</mark>";
    const ctx = {} as Parameters<ReturnType<typeof createPostProcessor>>[1];
    const proc = createPostProcessor();
    proc(root, ctx);
    proc(root, ctx);
    proc(root, ctx);
    expect(root.querySelector("mark")!.textContent).toBe("hello");
  });
});
