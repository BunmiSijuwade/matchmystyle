import { describe, it, expect } from "vitest";
import { dropColor, dropSize, hasColor } from "@/lib/loosenSearch";

describe("loosen search", () => {
  it("drops color words first", () => {
    expect(dropColor("black leather jacket size M")).toBe("leather jacket size M");
    expect(dropColor("dark navy wool coat")).toBe("wool coat");
    expect(hasColor("linen dress")).toBe(false);
  });
  it("then drops the size", () => {
    expect(dropSize(dropColor("cream linen dress size 8"))).toBe("linen dress");
  });
});
