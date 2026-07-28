import { PartCodeInvalidException } from "../../../src/part/domain/exceptions/part-code-invalid.exception";
import { PartCode } from "../../../src/part/domain/value-objects/part-code.vo";

describe("PartCode", () => {
  it("normalizes valid codes", () => {
    const code = PartCode.create(" oil-123 ");

    expect(code.rawValue).toBe("OIL-123");
    expect(code.format()).toBe("OIL-123");
    expect(code.toString()).toBe("OIL-123");
    expect(code.equals(PartCode.create("OIL-123"))).toBe(true);
  });

  it("rejects invalid code formats", () => {
    expect(PartCode.isValid("O-12")).toBe(false);
    expect(() => PartCode.create("O-12")).toThrow(PartCodeInvalidException);
    expect(() => PartCode.create("")).toThrow(PartCodeInvalidException);
    expect(PartCode.create("OIL-123").equals(null)).toBe(false);
  });
});
