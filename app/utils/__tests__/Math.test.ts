import {
  convertAndMaintainRatio,
  getDecimalSeparator,
  parseFloatWithSeparator,
  roundToNumber,
} from "../Math";

describe("Math Utils", () => {
  describe("roundToNumber", () => {
    it("should round to default 4 decimal places", () => {
      expect(roundToNumber(1.234567)).toBe(1.2346);
      expect(roundToNumber(10.987654)).toBe(10.9877);
    });

    it("should round to specified decimal places", () => {
      expect(roundToNumber(1.234567, 2)).toBe(1.23);
      expect(roundToNumber(10.987654, 0)).toBe(11);
      expect(roundToNumber(5, 3)).toBe(5);
    });

    it("should handle zero", () => {
      expect(roundToNumber(0, 2)).toBe(0);
    });

    it("should handle negative numbers", () => {
      expect(roundToNumber(-1.234567, 2)).toBe(-1.23);
      expect(roundToNumber(-10.987654)).toBe(-10.9877);
    });
  });

  describe("getDecimalSeparator", () => {
    it("should return the locale's decimal separator", () => {
      const separator = getDecimalSeparator();
      // We can't know the exact locale, but it should be either '.' or ','
      expect([".", ","]).toContain(separator);
    });
  });

  describe("parseFloatWithSeparator", () => {
    it("should parse float with default dot separator", () => {
      expect(parseFloatWithSeparator("123.45")).toBe(123.45);
      expect(parseFloatWithSeparator("abc123.45xyz")).toBe(123.45);
      expect(parseFloatWithSeparator("-10.5")).toBe(-10.5);
    });

    it("should parse float with comma separator", () => {
      expect(parseFloatWithSeparator("123,45", ",")).toBe(123.45);
      expect(parseFloatWithSeparator("abc123,45xyz", ",")).toBe(123.45);
      expect(parseFloatWithSeparator("-10,5", ",")).toBe(-10.5);
    });

    it("should handle strings with no valid number", () => {
      expect(parseFloatWithSeparator("abc")).toBeNaN();
      expect(parseFloatWithSeparator("")).toBeNaN();
      expect(parseFloatWithSeparator("-")).toBeNaN();
      expect(parseFloatWithSeparator(".", ".")).toBeNaN();
      expect(parseFloatWithSeparator(",", ",")).toBeNaN();
    });

    it("should handle negative sign correctly", () => {
      expect(parseFloatWithSeparator("-123.45")).toBe(-123.45);
      expect(parseFloatWithSeparator("abc-123.45xyz")).toBe(-123.45);
      expect(parseFloatWithSeparator("-123,45", ",")).toBe(-123.45);
      expect(parseFloatWithSeparator("abc-123,45xyz", ",")).toBe(-123.45);
    });
  });

  describe("convertAndMaintainRatio", () => {
    it("should map value from one range to another", () => {
      // Map 0.5 from [0, 1] to [0, 100] -> 50
      expect(convertAndMaintainRatio(0.5, 0, 1, 0, 100)).toBe(50);
      // Map 5 from [0, 10] to [-1, 1] -> 0
      expect(convertAndMaintainRatio(5, 0, 10, -1, 1)).toBe(0);
      // Map 25 from [0, 100] to [0, 1] -> 0.25
      expect(convertAndMaintainRatio(25, 0, 100, 0, 1)).toBe(0.25);
    });

    it("should handle negative ranges", () => {
      // Map -5 from [-10, 0] to [0, 100] -> 50
      expect(convertAndMaintainRatio(-5, -10, 0, 0, 100)).toBe(50);
      // Map 0 from [-1, 1] to [-50, 50] -> 0
      expect(convertAndMaintainRatio(0, -1, 1, -50, 50)).toBe(0);
    });

    it("should handle target range reversed", () => {
      // Map 0.5 from [0, 1] to [100, 0] -> 50
      expect(convertAndMaintainRatio(0.5, 0, 1, 100, 0)).toBe(50);
    });

    it("should handle source range reversed (should still work)", () => {
      // Map 0.5 from [1, 0] to [0, 100] -> 50
      expect(convertAndMaintainRatio(0.5, 1, 0, 0, 100)).toBe(50);
    });
  });
});
