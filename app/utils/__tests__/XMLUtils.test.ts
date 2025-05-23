import { getInnerValueAsByteArray, splitPath } from "../ableton/XMLUtils";

describe("XMLUtils", () => {
  describe("splitPath", () => {
    const testPath = [
      "AudioEffectGroupDevice",
      "Branches",
      "AudioEffectBranch",
      "DeviceChain",
      "AudioToAudioDeviceChain",
      "Devices",
      "PluginDevice",
      "ParameterList",
      "PluginFloatParameter",
      "ParameterValue",
      "AutomationTarget",
    ];

    it("should split the path correctly when the pattern is found", () => {
      const { before, after } = splitPath(
        testPath,
        "Devices",
        "AutomationTarget"
      );
      expect(before).toEqual([
        "AudioEffectGroupDevice",
        "Branches",
        "AudioEffectBranch",
        "DeviceChain",
        "AudioToAudioDeviceChain",
      ]);
      expect(after).toEqual([
        "PluginDevice",
        "ParameterList",
        "PluginFloatParameter",
        "ParameterValue",
      ]);
    });

    it("should return original path arrays when the pattern is not found", () => {
      const { before, after } = splitPath(
        testPath,
        "NonExistent",
        "AutomationTarget"
      );
      expect(before).toEqual(testPath);
      expect(after).toEqual(testPath);
    });

    it("should split the path and remove the suffix when found", () => {
      const pathWithSuffix = ["Root", "Level1", "Level2", "SuffixToRemove"];
      const { before, after } = splitPath(
        pathWithSuffix,
        "Level1",
        "SuffixToRemove"
      );
      expect(before).toEqual(["Root"]);
      expect(after).toEqual(["Level2"]);
    });

    it("should split the path and not remove suffix if not present", () => {
      const pathWithoutSuffix = ["Root", "Level1", "Level2", "AnotherSuffix"];
      const { before, after } = splitPath(
        pathWithoutSuffix,
        "Level1",
        "SuffixToRemove"
      );
      expect(before).toEqual(["Root"]);
      expect(after).toEqual(["Level2", "AnotherSuffix"]);
    });

    it("should handle empty path array", () => {
      const { before, after } = splitPath([], "Pattern", "Suffix");
      expect(before).toEqual([]);
      expect(after).toEqual([]);
    });

    it("should handle pattern at the beginning", () => {
      const path = ["Pattern", "Segment1", "Segment2"];
      const { before, after } = splitPath(path, "Pattern", "Suffix");
      expect(before).toEqual([]);
      expect(after).toEqual(["Segment1", "Segment2"]);
    });

    it("should handle pattern at the end", () => {
      const path = ["Segment1", "Segment2", "Pattern"];
      const { before, after } = splitPath(path, "Pattern", "Suffix");
      expect(before).toEqual(["Segment1", "Segment2"]);
      expect(after).toEqual([]);
    });

    it("should handle suffix being the only segment after pattern", () => {
      const path = ["Segment1", "Pattern", "SuffixToRemove"];
      const { before, after } = splitPath(path, "Pattern", "SuffixToRemove");
      expect(before).toEqual(["Segment1"]);
      expect(after).toEqual([]);
    });
  });

  describe("getInnerValueAsByteArray", () => {
    it("should convert a valid hex string to a Uint8Array", () => {
      const hexElement = "48656C6C6F"; // "Hello" in hex
      const expected = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      expect(getInnerValueAsByteArray(hexElement)).toEqual(expected);
    });

    it("should handle hex string with whitespace", () => {
      const hexElement = "48 65\n6C\r6C\t6F"; // "Hello" with whitespace
      const expected = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      expect(getInnerValueAsByteArray(hexElement)).toEqual(expected);
    });

    it("should return an empty Uint8Array for an empty string", () => {
      const hexElement = "";
      expect(getInnerValueAsByteArray(hexElement)).toEqual(new Uint8Array(0));
    });

    it("should return an empty Uint8Array for null or undefined input", () => {
      expect(getInnerValueAsByteArray(null)).toEqual(new Uint8Array(0));
      expect(getInnerValueAsByteArray(undefined)).toEqual(new Uint8Array(0));
      expect(getInnerValueAsByteArray("")).toEqual(new Uint8Array(0));
    });

    it("should return an empty Uint8Array for an odd length hex string", () => {
      const hexElement = "ABC"; // Odd length
      // Expecting a console error, but the function should return empty array
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(getInnerValueAsByteArray(hexElement)).toEqual(new Uint8Array(0));
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("should return an empty Uint8Array for a string with invalid hex characters", () => {
      const hexElement = "48G5"; // 'G' is invalid
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(getInnerValueAsByteArray(hexElement)).toEqual(new Uint8Array(0));
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
