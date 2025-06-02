// app/utils/__tests__/UADSSLChannel.test.ts
import * as fs from "fs";
import * as path from "path";

import { UADSSLChannel } from "../preset/UADSSLChannel";

describe("UADSSLChannel getParameterDisplay", () => {
  let channel: UADSSLChannel;
  let xmlContent: string;

  beforeAll(() => {
    const xmlFilePath = path.join(
      __dirname,
      "../preset/UADSSLChannelParametersMap.xml"
    );
    xmlContent = fs.readFileSync(xmlFilePath, "utf-8");
  });

  beforeEach(() => {
    channel = new UADSSLChannel(xmlContent);
  });

  // Test Linear Parameters
  test("should correctly display Input parameter values", () => {
    expect(channel.getParameterDisplay("Input", 0.0)).toEqual({
      displayNumber: -20.0,
      displayText: "-20.0 dB",
    });
    expect(channel.getParameterDisplay("Input", 0.5)).toEqual({
      displayNumber: 0.0,
      displayText: "0.0 dB",
    });
    expect(channel.getParameterDisplay("Input", 1.0)).toEqual({
      displayNumber: 20.0,
      displayText: "20.0 dB",
    });
  });

  test("should correctly display CMP Thresh parameter values (reversed linear)", () => {
    expect(channel.getParameterDisplay("CMP Thresh", 0.0)).toEqual({
      displayNumber: 10.0,
      displayText: "10.0 dB",
    });
    expect(channel.getParameterDisplay("CMP Thresh", 0.5)).toEqual({
      displayNumber: -5.0,
      displayText: "-5.0 dB",
    });
    expect(channel.getParameterDisplay("CMP Thresh", 1.0)).toEqual({
      displayNumber: -20.0,
      displayText: "-20.0 dB",
    });
  });

  // Test Frequency Parameters
  test("should correctly display HP Freq parameter values (logarithmic with special case)", () => {
    expect(channel.getParameterDisplay("HP Freq", 0.0)).toEqual({
      displayNumber: "Out",
      displayText: "Out",
    });
    expect(channel.getParameterDisplay("HP Freq", 0.05)).toEqual({
      displayNumber: "Out",
      displayText: "Out",
    });
    expect(channel.getParameterDisplay("HP Freq", 0.06)).toEqual({
      displayNumber: 14.8,
      displayText: "14.8 Hz",
    });
    expect(channel.getParameterDisplay("HP Freq", 0.5)).toEqual({
      displayNumber: 111,
      displayText: "111 Hz",
    });
    expect(channel.getParameterDisplay("HP Freq", 1.0)).toEqual({
      displayNumber: 401,
      displayText: "401 Hz",
    });
  });

  test("should correctly display LP Freq parameter values (reversed logarithmic with special case)", () => {
    expect(channel.getParameterDisplay("LP Freq", 0.0)).toEqual({
      displayNumber: "Out",
      displayText: "Out",
    });
    expect(channel.getParameterDisplay("LP Freq", 0.05)).toEqual({
      displayNumber: "Out",
      displayText: "Out",
    });
    expect(channel.getParameterDisplay("LP Freq", 0.06)).toEqual({
      displayNumber: 21000,
      displayText: "21.0 k",
    });
    expect(channel.getParameterDisplay("LP Freq", 0.5)).toEqual({
      displayNumber: 6240,
      displayText: "6.24 k",
    });
    expect(channel.getParameterDisplay("LP Freq", 1.0)).toEqual({
      displayNumber: 3150,
      displayText: "3.15 k",
    });
  });

  // Test Discrete Parameters
  test("should correctly display Phase parameter values", () => {
    expect(channel.getParameterDisplay("Phase", 0.0)).toEqual({
      displayNumber: 0.0,
      displayText: "Normal",
    });
    expect(channel.getParameterDisplay("Phase", 0.49)).toEqual({
      displayNumber: 0.0,
      displayText: "Normal",
    });
    expect(channel.getParameterDisplay("Phase", 0.9)).toEqual({
      displayNumber: 1.0,
      displayText: "Inverted",
    });
    expect(channel.getParameterDisplay("Phase", 1.0)).toEqual({
      displayNumber: 1.0,
      displayText: "Inverted",
    });
  });

  test("should correctly display Select parameter values", () => {
    expect(channel.getParameterDisplay("Select", 0.0)).toEqual({
      displayNumber: "Expand",
      displayText: "Expand",
    });
    expect(channel.getParameterDisplay("Select", 0.24)).toEqual({
      displayNumber: "Expand",
      displayText: "Expand",
    });
    expect(channel.getParameterDisplay("Select", 0.25)).toEqual({
      displayNumber: 1.0,
      displayText: "Gate 1",
    });
    expect(channel.getParameterDisplay("Select", 0.74)).toEqual({
      displayNumber: 1.0,
      displayText: "Gate 1",
    });
    expect(channel.getParameterDisplay("Select", 0.75)).toEqual({
      displayNumber: 2.0,
      displayText: "Gate 2",
    });
    expect(channel.getParameterDisplay("Select", 1.0)).toEqual({
      displayNumber: 2.0,
      displayText: "Gate 2",
    });
  });

  // Test Custom Curve Parameters
  test("should correctly display CMP Ratio parameter values (custom curve with 'Limit')", () => {
    expect(channel.getParameterDisplay("CMP Ratio", 0.0)).toEqual({
      displayNumber: 1,
      displayText: "1.00:1",
    });
    expect(channel.getParameterDisplay("CMP Ratio", 0.5)).toEqual({
      displayNumber: 3.8,
      displayText: "3.80:1",
    });
    expect(channel.getParameterDisplay("CMP Ratio", 0.6)).toEqual({
      displayNumber: 4.67,
      displayText: "4.67:1",
    });
    expect(channel.getParameterDisplay("CMP Ratio", 0.99)).toEqual({
      displayNumber: 103,
      displayText: "103:1",
    });
    expect(channel.getParameterDisplay("CMP Ratio", 1.0)).toEqual({
      displayNumber: "Limit",
      displayText: "Limit",
    });
  });

  test("should correctly display LMF Q parameter values (custom curve)", () => {
    expect(channel.getParameterDisplay("LMF Q", 0.0)).toEqual({
      displayNumber: 4,
      displayText: "4.00",
    });
    expect(channel.getParameterDisplay("LMF Q", 0.2)).toEqual({
      displayNumber: 2.5,
      displayText: "2.50",
    });
    expect(channel.getParameterDisplay("LMF Q", 0.5)).toEqual({
      displayNumber: 1.5,
      displayText: "1.50",
    });
    expect(channel.getParameterDisplay("LMF Q", 0.8)).toEqual({
      displayNumber: 0.6,
      displayText: "0.60",
    });
    expect(channel.getParameterDisplay("LMF Q", 1.0)).toEqual({
      displayNumber: 0.4,
      displayText: "0.40",
    });
  });
});
