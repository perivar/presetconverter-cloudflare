import {
  AbletonEq8,
  AbletonEq8Band,
  BandMode,
  ChannelMode,
} from "../ableton/AbletonEq8";
import { AbletonToSteinbergFrequency } from "../converters/AbletonToSteinbergFrequency";
import { BandMode1And8, BandMode2To7 } from "../SteinbergFrequency";

describe("AbletonToSteinbergFrequency", () => {
  it("should convert AbletonEq8 to SteinbergFrequency", () => {
    // Provide a dummy object for the constructor as it expects xElement
    const abletonEq8 = new AbletonEq8({});
    abletonEq8.Mode = ChannelMode.Stereo;
    abletonEq8.Bands = [
      {
        Number: 0, // Band 1
        IsOn: true,
        Gain: 6.0,
        Freq: 50.0,
        Q: 0.71,
        Mode: BandMode.LeftShelf, // LeftShelf maps to LowShelf for band 1
        Parameter: "ParameterA",
      } as AbletonEq8Band,
      {
        Number: 3, // Band 4
        IsOn: false,
        Gain: -3.0,
        Freq: 2000.0,
        Q: 3.0,
        Mode: BandMode.Bell, // Bell maps to Peak for bands 2-7
        Parameter: "ParameterA",
      } as AbletonEq8Band,
      {
        Number: 7, // Band 8
        IsOn: true,
        Gain: 0.0,
        Freq: 15000.0,
        Q: 1.0,
        Mode: BandMode.HighCut48, // HighCut48 maps to Cut48 for band 8
        Parameter: "ParameterA",
      } as AbletonEq8Band,
    ];

    const steinbergFrequency =
      AbletonToSteinbergFrequency.convertBase(abletonEq8);

    expect(steinbergFrequency).toBeDefined();
    // SteinbergFrequency has 8 bands, regardless of input bands
    expect(steinbergFrequency.Parameters.size).toBeGreaterThan(0);

    // Check Band 1 (LowShelf)
    const band1On = steinbergFrequency.Parameters.get("equalizerAbandon1");
    expect(band1On?.Value).toBe(1.0);
    const band1Gain = steinbergFrequency.Parameters.get("equalizerAgain1");
    expect(band1Gain?.Value).toBe(6.0);
    const band1Freq = steinbergFrequency.Parameters.get("equalizerAfreq1");
    expect(band1Freq?.Value).toBe(50.0);
    const band1Q = steinbergFrequency.Parameters.get("equalizerAq1");
    expect(band1Q?.Value).toBe(0.71);
    const band1Type = steinbergFrequency.Parameters.get("equalizerAtype1");
    expect(band1Type?.Value).toBe(BandMode1And8.LowShelf);

    // Check Band 4 (Bell - should be Peak in Steinberg)
    const band4On = steinbergFrequency.Parameters.get("equalizerAbandon4");
    expect(band4On?.Value).toBe(0.0); // Band is off in Ableton
    const band4Gain = steinbergFrequency.Parameters.get("equalizerAgain4");
    expect(band4Gain?.Value).toBe(-3.0);
    const band4Freq = steinbergFrequency.Parameters.get("equalizerAfreq4");
    expect(band4Freq?.Value).toBe(2000.0);
    const band4Q = steinbergFrequency.Parameters.get("equalizerAq4");
    expect(band4Q?.Value).toBe(3.0);
    const band4Type = steinbergFrequency.Parameters.get("equalizerAtype4");
    expect(band4Type?.Value).toBe(BandMode2To7.Peak);

    // Check Band 8 (HighCut48)
    const band8On = steinbergFrequency.Parameters.get("equalizerAbandon8");
    expect(band8On?.Value).toBe(1.0); // Band is on in Ableton
    const band8Gain = steinbergFrequency.Parameters.get("equalizerAgain8");
    expect(band8Gain?.Value).toBe(0.0);
    const band8Freq = steinbergFrequency.Parameters.get("equalizerAfreq8");
    expect(band8Freq?.Value).toBe(15000.0);
    const band8Q = steinbergFrequency.Parameters.get("equalizerAq8");
    expect(band8Q?.Value).toBe(1.0);
    const band8Type = steinbergFrequency.Parameters.get("equalizerAtype8");
    expect(band8Type?.Value).toBe(BandMode1And8.Cut48);
  });

  it("should throw an error for non-stereo channel mode", () => {
    const abletonEq8 = new AbletonEq8({});
    abletonEq8.Mode = ChannelMode.LeftRight; // Assuming LeftRight is a non-stereo mode

    expect(() => AbletonToSteinbergFrequency.convertBase(abletonEq8)).toThrow(
      "Only Stereo conversion is supported. ChannelMode was 1!"
    ); // Assuming ChannelMode.LeftRight is 1
  });
});
