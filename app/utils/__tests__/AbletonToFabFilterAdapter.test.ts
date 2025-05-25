import {
  AbletonEq8,
  AbletonEq8Band,
  BandMode,
  ChannelMode,
} from "../ableton/AbletonEq8";
import { AbletonToFabFilterAdapter } from "../ableton/AbletonToFabFilterAdapter";
import {
  ProQ3Shape,
  ProQ3Slope,
  ProQ3StereoPlacement,
} from "../FabfilterProQ3";

describe("AbletonToFabFilterAdapter", () => {
  it("should convert AbletonEq8 to FabfilterProQ3", () => {
    const abletonEq8 = new AbletonEq8({}); // Provide a dummy object for the constructor
    abletonEq8.Mode = ChannelMode.Stereo;
    abletonEq8.Bands = [
      {
        Number: 0, // Band 1
        IsOn: true,
        Gain: 3.0,
        Freq: 100.0,
        Q: 1.0,
        Mode: BandMode.Bell,
        Parameter: "ParameterA",
      } as AbletonEq8Band,
      {
        Number: 1, // Band 2
        IsOn: false,
        Gain: -6.0,
        Freq: 5000.0,
        Q: 2.5,
        Mode: BandMode.HighCut12,
        Parameter: "ParameterA",
      } as AbletonEq8Band,
    ];

    const fabfilterProQ3 =
      AbletonToFabFilterAdapter.toFabfilterProQ3(abletonEq8);

    expect(fabfilterProQ3).toBeDefined();
    expect(fabfilterProQ3.Bands.length).toBe(2);

    const band1 = fabfilterProQ3.Bands[0];
    expect(band1.Enabled).toBe(true);
    expect(band1.Gain).toBe(3.0);
    expect(band1.Frequency).toBe(100.0);
    expect(band1.Q).toBe(1.0);
    expect(band1.Shape).toBe(ProQ3Shape.Bell);
    expect(band1.Slope).toBe(ProQ3Slope.Slope24dB_oct); // Default slope for Bell
    expect(band1.StereoPlacement).toBe(ProQ3StereoPlacement.Stereo);
    expect(band1.DynamicRange).toBe(0);
    expect(band1.DynamicThreshold).toBe(1);

    const band2 = fabfilterProQ3.Bands[1];
    expect(band2.Enabled).toBe(false);
    expect(band2.Gain).toBe(-6.0);
    expect(band2.Frequency).toBe(5000.0);
    expect(band2.Q).toBe(2.5);
    expect(band2.Shape).toBe(ProQ3Shape.HighCut);
    expect(band2.Slope).toBe(ProQ3Slope.Slope12dB_oct);
    expect(band2.StereoPlacement).toBe(ProQ3StereoPlacement.Stereo);
    expect(band2.DynamicRange).toBe(0);
    expect(band2.DynamicThreshold).toBe(1);
  });

  it("should throw an error for non-stereo channel mode", () => {
    const abletonEq8 = new AbletonEq8({}); // Provide a dummy object for the constructor
    abletonEq8.Mode = ChannelMode.LeftRight; // Assuming LeftRight is a non-stereo mode

    expect(() =>
      AbletonToFabFilterAdapter.toFabfilterProQ3(abletonEq8)
    ).toThrow("Only Stereo conversion is supported. ChannelMode was 1!"); // Assuming ChannelMode.LeftRight is 1
  });
});
