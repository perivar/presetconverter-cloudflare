import fs from "fs";
import path from "path";
import * as midiFile from "midi-file";

import {
  AutomationEvent,
  convertAutomationToMidi,
  convertToMidi,
  interpolateEvents,
  logMidiDataToString,
  MidiChannelManager,
} from "../ableton/Midi";
import { toPlainObject } from "./helpers/testUtils";

const targetDir = path.join(__dirname, "ableton-tests");

beforeAll(() => {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
});

afterAll(() => {
  // if (fs.existsSync(targetDir)) {
  //   fs.rmSync(targetDir, { recursive: true, force: true });
  // }
});

describe("MidiChannelManager", () => {
  test("should start with channel 0 by default", () => {
    const manager = new MidiChannelManager();
    expect(manager.getUnusedChannel()).toBe(0);
  });

  test("should start with the specified first channel", () => {
    const manager = new MidiChannelManager(5);
    expect(manager.getUnusedChannel()).toBe(5);
  });

  test("should throw error if first channel is less than 1", () => {
    expect(() => new MidiChannelManager(0)).toThrow(
      "First channel must be 1 or more"
    );
    expect(() => new MidiChannelManager(-1)).toThrow(
      "First channel must be 1 or more"
    );
  });

  test("should skip channel 9 (index 10)", () => {
    const manager = new MidiChannelManager(); // Starts at 0
    for (let i = 0; i < 9; i++) {
      manager.getUnusedChannel(); // Consume channels 0-8
    }
    expect(manager.getUnusedChannel()).toBe(10); // Should skip 9 and return 10
  });

  test("should wrap around after channel 15", () => {
    const manager = new MidiChannelManager(14); // Starts at 15
    expect(manager.getUnusedChannel()).toBe(14); // Channel 15
    expect(manager.getUnusedChannel()).toBe(0); // Wrap around to 0
  });

  test("should skip channel 9 after wrap around", () => {
    const manager = new MidiChannelManager(6); // Starts at 7
    for (let i = 0; i < 8; i++) {
      manager.getUnusedChannel(); // Consume channels 7, 8, 10, 11, 12, 13, 14, 15
    }
    expect(manager.getUnusedChannel()).toBe(0); // Wrap around to 0
    expect(manager.getUnusedChannel()).toBe(1); // Next channel
  });
});

describe("convertToMidi", () => {
  const mockCvpj = {
    parameters: {
      bpm: { value: 120 },
    },
    track_placements: {
      track1: {
        notes: [
          {
            position: 0,
            duration: 1,
            key: 60,
            vol: 0.8,
            notelist: [{ position: 0, duration: 1, key: 60, vol: 0.8 }],
          },
          {
            position: 1,
            duration: 0.5,
            key: 62,
            vol: 0.5,
            notelist: [{ position: 0, duration: 0.5, key: 62, vol: 0.5 }],
          },
        ],
      },
      track2: {
        notes: [
          {
            position: 0.5,
            duration: 1.5,
            key: 64,
            vol: 1.0,
            notelist: [{ position: 0, duration: 1.5, key: 64, vol: 1.0 }],
          },
        ],
      },
    },
    track_data: {
      track1: { name: "Piano", color: [1, 0, 0] }, // Red
      track2: { name: "Synth", color: [0, 1, 0] }, // Green
    },
  };

  test("should convert cvpj data to MidiData", () => {
    const midiData = convertToMidi(mockCvpj, "test_notes");
    expect(midiData).not.toBeNull();
    expect(midiData?.header.format).toBe(1);
    expect(midiData?.header.numTracks).toBe(3); // Meta track + 2 data tracks
    expect(midiData?.header.ticksPerBeat).toBe(480);
    expect(midiData?.tracks.length).toBe(3);

    // Check meta track
    const metaTrack = midiData?.tracks[0];
    expect(metaTrack?.length).toBe(3); // Time Signature, Set Tempo, End Of Track
    expect(metaTrack?.[0].type).toBe("timeSignature");
    expect(metaTrack?.[1].type).toBe("setTempo");
    expect((metaTrack?.[1] as any).microsecondsPerBeat).toBe(500000); // 60,000,000 / 120

    // Check track 1 (Piano)
    const track1 = midiData?.tracks[1];
    expect(track1?.[0].type).toBe("trackName");
    expect((track1?.[0] as any).text).toBe("Piano");
    expect(track1?.[1].type).toBe("programChange");
    expect((track1?.[1] as any).channel).toBe(0); // First channel
    expect(track1?.[2].type).toBe("sequencerSpecific"); // Color event 1
    expect(track1?.[3].type).toBe("sequencerSpecific"); // Color event 2
    expect(track1?.[4].type).toBe("sequencerSpecific"); // Color event 3
    expect(track1?.[5].type).toBe("noteOn");
    expect((track1?.[5] as any).noteNumber).toBe(60);
    expect((track1?.[5] as any).velocity).toBe(102); // 0.8 * 127 rounded
    expect(track1?.[6].type).toBe("noteOff");
    expect((track1?.[6] as any).noteNumber).toBe(60);
    expect(track1?.[7].type).toBe("noteOn");
    expect((track1?.[7] as any).noteNumber).toBe(62);
    expect((track1?.[7] as any).velocity).toBe(64); // 0.5 * 127 rounded
    expect(track1?.[8].type).toBe("noteOff");
    expect((track1?.[8] as any).noteNumber).toBe(62);
    expect(track1?.[9].type).toBe("endOfTrack");

    // Check track 2 (Synth)
    const track2 = midiData?.tracks[2];
    expect(track2?.[0].type).toBe("trackName");
    expect((track2?.[0] as any).text).toBe("Synth");
    expect(track2?.[1].type).toBe("programChange");
    expect((track2?.[1] as any).channel).toBe(1); // Second channel (skips 9 later)
    expect(track2?.[2].type).toBe("sequencerSpecific"); // Color event 1
    expect(track2?.[3].type).toBe("sequencerSpecific"); // Color event 2
    expect(track2?.[4].type).toBe("sequencerSpecific"); // Color event 3
    expect(track2?.[5].type).toBe("noteOn");
    expect((track2?.[5] as any).noteNumber).toBe(64);
    expect((track2?.[5] as any).velocity).toBe(127); // 1.0 * 127 rounded
    expect(track2?.[6].type).toBe("noteOff");
    expect((track2?.[6] as any).noteNumber).toBe(64);
    expect(track2?.[7].type).toBe("endOfTrack");
  });

  test("should return null if BPM is missing", () => {
    const cvpjWithoutBpm = { ...mockCvpj, parameters: {} };
    expect(convertToMidi(cvpjWithoutBpm, "test")).toBeNull();
  });

  test("should return null if track_placements is missing or empty", () => {
    const cvpjWithoutPlacements = { ...mockCvpj, track_placements: {} };
    expect(convertToMidi(cvpjWithoutPlacements, "test")).toBeNull();

    const cvpjWithEmptyPlacements = { ...mockCvpj, track_placements: {} };
    expect(convertToMidi(cvpjWithEmptyPlacements, "test")).toBeNull();
  });

  test("should keep tracks with missing data or notes", () => {
    const cvpjWithMissingData = {
      parameters: { bpm: { value: 120 } },
      track_placements: {
        track1: {
          notes: [
            {
              position: 0,
              duration: 1,
              key: 60,
              vol: 0.8,
              notelist: [{ position: 0, duration: 1, key: 60, vol: 0.8 }],
            },
          ],
        },
        track2: { notes: [] }, // No notes
        track3: {
          notes: [
            {
              position: 0,
              duration: 1,
              key: 60,
              vol: 0.8,
              notelist: [{ position: 0, duration: 1, key: 60, vol: 0.8 }],
            },
          ],
        },
      },
      track_data: {
        track1: { name: "Valid Track" },
        // track2 data is missing
        track3: { name: "Track with no notes in placement" },
      },
    };
    const midiData = convertToMidi(cvpjWithMissingData, "test");
    expect(midiData).not.toBeNull();
    expect(midiData?.header.numTracks).toBe(3); // Meta track + track1
    expect(midiData?.tracks.length).toBe(3);
    expect((midiData?.tracks[1][0] as any).text).toBe("Valid Track");
  });

  test("should skip muted notes", () => {
    const cvpjWithMutedNote = {
      parameters: { bpm: { value: 120 } },
      track_placements: {
        track1: {
          notes: [
            {
              position: 0,
              duration: 1,
              key: 60,
              vol: 0.8,
              notelist: [{ position: 0, duration: 1, key: 60, vol: 0.8 }],
            },
            {
              position: 1,
              duration: 1,
              key: 62,
              vol: 0.8,
              muted: true,
              notelist: [{ position: 0, duration: 1, key: 62, vol: 0.8 }],
            }, // Muted
          ],
        },
      },
      track_data: {
        track1: { name: "Test Track" },
      },
    };
    const midiData = convertToMidi(cvpjWithMutedNote, "test");
    expect(midiData).not.toBeNull();
    const track1 = midiData?.tracks[1];
    // Should only have events for the non-muted note
    expect(
      track1?.filter(
        event => event.type === "noteOn" || event.type === "noteOff"
      ).length
    ).toBe(2);
  });

  test("should skip notes with zero duration", () => {
    const cvpjWithZeroDurationNote = {
      parameters: { bpm: { value: 120 } },
      track_placements: {
        track1: {
          notes: [
            {
              position: 0,
              duration: 1,
              key: 60,
              vol: 0.8,
              notelist: [{ position: 0, duration: 1, key: 60, vol: 0.8 }],
            },
            {
              position: 1,
              duration: 0,
              key: 62,
              vol: 0.8,
              notelist: [{ position: 0, duration: 0, key: 62, vol: 0.8 }],
            }, // Zero duration
          ],
        },
      },
      track_data: {
        track1: { name: "Test Track" },
      },
    };
    const midiData = convertToMidi(cvpjWithZeroDurationNote, "test");
    expect(midiData).not.toBeNull();
    const track1 = midiData?.tracks[1];
    // Should only have events for the non-zero duration note
    expect(
      track1?.filter(
        (event: any) => event.type === "noteOn" || event.type === "noteOff"
      ).length
    ).toBe(2);
  });
});

describe("convertAutomationToMidi", () => {
  const mockCvpjWithAutomation = {
    parameters: {
      bpm: { value: 120 },
    },
    automation: {
      master: {
        master_1: {
          Master: {
            "Endless Smile 64": {
              type: "float",
              placements: [
                {
                  position: 0,
                  duration: 1156,
                  points: [
                    {
                      position: 0,
                      value: 0,
                    },
                    {
                      position: 370,
                      value: 0,
                    },
                    {
                      position: 370,
                      value: 0.3214285672,
                    },
                    {
                      position: 384,
                      value: 0.3452380896,
                    },
                    {
                      position: 384,
                      value: 0,
                    },
                    {
                      position: 1138,
                      value: 0,
                    },
                    {
                      position: 1138,
                      value: 0.3214285672,
                    },
                  ],
                },
              ],
            },
            AutoFilter_Cutoff: {
              type: "float",
              placements: [
                {
                  position: 0,
                  duration: 1160,
                  points: [
                    {
                      position: 0,
                      value: 135,
                    },
                    {
                      position: 368,
                      value: 135,
                    },
                    {
                      position: 368,
                      value: 128.154755,
                    },
                    {
                      position: 382,
                      value: 87.5396729,
                    },
                    {
                      position: 386,
                      value: 67.9166641,
                    },
                    {
                      position: 388,
                      value: 135,
                    },
                    {
                      position: 1136,
                      value: 135,
                    },
                    {
                      position: 1136,
                      value: 128.154755,
                    },
                    {
                      position: 1150,
                      value: 87.5396729,
                    },
                    {
                      position: 1154,
                      value: 67.9166641,
                    },
                  ],
                },
              ],
            },
            "FabFilter Pro-Q 3": {
              type: "float",
              placements: [
                {
                  position: 0,
                  duration: 1156,
                  points: [
                    {
                      position: 0,
                      value: 0,
                    },
                    {
                      position: 370,
                      value: 0,
                    },
                    {
                      position: 370,
                      value: 1,
                    },
                    {
                      position: 384,
                      value: 0,
                    },
                    {
                      position: 1138,
                      value: 0,
                    },
                    {
                      position: 1138,
                      value: 1,
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      group: {
        group_35: {
          Lead: {
            "Endless Smile 64": {
              type: "float",
              placements: [
                {
                  position: 0,
                  duration: 1860,
                  points: [
                    {
                      position: 0,
                      value: 0,
                    },
                    {
                      position: 0,
                      value: 0,
                    },
                    {
                      position: 0,
                      value: 0.3072727323,
                    },
                    {
                      position: 240,
                      value: 0.2399999946,
                    },
                    {
                      position: 240,
                      value: 0,
                    },
                    {
                      position: 259,
                      value: 0,
                    },
                    {
                      position: 260,
                      value: 0.8199999928,
                    },
                    {
                      position: 260,
                      value: 0,
                    },
                    {
                      position: 266,
                      value: 0,
                    },
                    {
                      position: 268,
                      value: 1,
                    },
                    {
                      position: 268,
                      value: 0,
                    },
                    {
                      position: 270.5,
                      value: 0,
                    },
                    {
                      position: 271.25,
                      value: 0.5400000215,
                    },
                    {
                      position: 271.25,
                      value: 0,
                    },
                    {
                      position: 274,
                      value: 0,
                    },
                    {
                      position: 276,
                      value: 0.5799999833,
                    },
                    {
                      position: 276,
                      value: 0,
                    },
                    {
                      position: 278,
                      value: 0,
                    },
                    {
                      position: 280,
                      value: 0.6600000262,
                    },
                    {
                      position: 280,
                      value: 0,
                    },
                    {
                      position: 283.5,
                      value: 0,
                    },
                    {
                      position: 284,
                      value: 0.8199999928,
                    },
                    {
                      position: 284,
                      value: 0,
                    },
                    {
                      position: 290,
                      value: 0,
                    },
                    {
                      position: 292,
                      value: 1,
                    },
                    {
                      position: 292,
                      value: 0,
                    },
                    {
                      position: 297.5,
                      value: 0,
                    },
                    {
                      position: 300,
                      value: 0.6800000072,
                    },
                    {
                      position: 300,
                      value: 0,
                    },
                    {
                      position: 302,
                      value: 0.6200000048,
                    },
                    {
                      position: 302,
                      value: 0,
                    },
                    {
                      position: 306.5,
                      value: 0,
                    },
                    {
                      position: 308,
                      value: 0.5600000024,
                    },
                    {
                      position: 308,
                      value: 0,
                    },
                    {
                      position: 310,
                      value: 0,
                    },
                    {
                      position: 312,
                      value: 0.4199999869,
                    },
                    {
                      position: 312,
                      value: 0,
                    },
                    {
                      position: 323,
                      value: 0,
                    },
                    {
                      position: 324,
                      value: 0.8199999928,
                    },
                    {
                      position: 324,
                      value: 0,
                    },
                    {
                      position: 330,
                      value: 0,
                    },
                    {
                      position: 332,
                      value: 1,
                    },
                    {
                      position: 332,
                      value: 0,
                    },
                    {
                      position: 334.5,
                      value: 0,
                    },
                    {
                      position: 335.25,
                      value: 0.5400000215,
                    },
                    {
                      position: 335.25,
                      value: 0,
                    },
                    {
                      position: 338,
                      value: 0,
                    },
                    {
                      position: 340,
                      value: 0.5799999833,
                    },
                    {
                      position: 340,
                      value: 0,
                    },
                    {
                      position: 342,
                      value: 0,
                    },
                    {
                      position: 344,
                      value: 0.6600000262,
                    },
                    {
                      position: 344,
                      value: 0,
                    },
                    {
                      position: 347.5,
                      value: 0,
                    },
                    {
                      position: 348,
                      value: 0.8199999928,
                    },
                    {
                      position: 348,
                      value: 0,
                    },
                    {
                      position: 354,
                      value: 0,
                    },
                    {
                      position: 356,
                      value: 1,
                    },
                    {
                      position: 356,
                      value: 0,
                    },
                    {
                      position: 361.5,
                      value: 0,
                    },
                    {
                      position: 364,
                      value: 0.6800000072,
                    },
                    {
                      position: 364,
                      value: 0,
                    },
                    {
                      position: 367,
                      value: 0.4110447764,
                    },
                    {
                      position: 367,
                      value: 0,
                    },
                    {
                      position: 370.5,
                      value: 0,
                    },
                    {
                      position: 372,
                      value: 0.5600000024,
                    },
                    {
                      position: 372,
                      value: 0,
                    },
                    {
                      position: 374,
                      value: 0,
                    },
                    {
                      position: 376,
                      value: 0.4199999869,
                    },
                    {
                      position: 376,
                      value: 0,
                    },
                    {
                      position: 387,
                      value: 0,
                    },
                    {
                      position: 388,
                      value: 0.8199999928,
                    },
                    {
                      position: 388,
                      value: 0,
                    },
                    {
                      position: 394,
                      value: 0,
                    },
                    {
                      position: 396,
                      value: 1,
                    },
                    {
                      position: 396,
                      value: 0,
                    },
                    {
                      position: 398.5,
                      value: 0,
                    },
                    {
                      position: 399.25,
                      value: 0.5400000215,
                    },
                    {
                      position: 399.25,
                      value: 0,
                    },
                    {
                      position: 402,
                      value: 0,
                    },
                    {
                      position: 404,
                      value: 0.5799999833,
                    },
                    {
                      position: 404,
                      value: 0,
                    },
                    {
                      position: 406,
                      value: 0,
                    },
                    {
                      position: 408,
                      value: 0.6600000262,
                    },
                    {
                      position: 408,
                      value: 0,
                    },
                    {
                      position: 411.5,
                      value: 0,
                    },
                    {
                      position: 412,
                      value: 0.8199999928,
                    },
                    {
                      position: 412,
                      value: 0,
                    },
                    {
                      position: 418,
                      value: 0,
                    },
                    {
                      position: 420,
                      value: 1,
                    },
                    {
                      position: 420,
                      value: 0,
                    },
                    {
                      position: 425.5,
                      value: 0,
                    },
                    {
                      position: 428,
                      value: 0.6800000072,
                    },
                    {
                      position: 428,
                      value: 0,
                    },
                    {
                      position: 430,
                      value: 0.6200000048,
                    },
                    {
                      position: 430,
                      value: 0,
                    },
                    {
                      position: 434.5,
                      value: 0,
                    },
                    {
                      position: 436,
                      value: 0.5600000024,
                    },
                    {
                      position: 436,
                      value: 0,
                    },
                    {
                      position: 438,
                      value: 0,
                    },
                    {
                      position: 440,
                      value: 0.4199999869,
                    },
                    {
                      position: 440,
                      value: 0,
                    },
                    {
                      position: 451,
                      value: 0,
                    },
                    {
                      position: 452,
                      value: 0.8199999928,
                    },
                    {
                      position: 452,
                      value: 0,
                    },
                    {
                      position: 458,
                      value: 0,
                    },
                    {
                      position: 460,
                      value: 1,
                    },
                    {
                      position: 460,
                      value: 0,
                    },
                    {
                      position: 462.5,
                      value: 0,
                    },
                    {
                      position: 463.25,
                      value: 0.5400000215,
                    },
                    {
                      position: 463.25,
                      value: 0,
                    },
                    {
                      position: 466,
                      value: 0,
                    },
                    {
                      position: 468,
                      value: 0.5799999833,
                    },
                    {
                      position: 468,
                      value: 0,
                    },
                    {
                      position: 470,
                      value: 0,
                    },
                    {
                      position: 472,
                      value: 0.6600000262,
                    },
                    {
                      position: 472,
                      value: 0,
                    },
                    {
                      position: 475.5,
                      value: 0,
                    },
                    {
                      position: 476,
                      value: 0.8199999928,
                    },
                    {
                      position: 476,
                      value: 0,
                    },
                    {
                      position: 482,
                      value: 0,
                    },
                    {
                      position: 484,
                      value: 1,
                    },
                    {
                      position: 484,
                      value: 0,
                    },
                    {
                      position: 489.5,
                      value: 0,
                    },
                    {
                      position: 492,
                      value: 0.6800000072,
                    },
                    {
                      position: 492,
                      value: 0,
                    },
                    {
                      position: 495,
                      value: 0.4110447764,
                    },
                    {
                      position: 495,
                      value: 0,
                    },
                    {
                      position: 498.5,
                      value: 0,
                    },
                    {
                      position: 500,
                      value: 0.5600000024,
                    },
                    {
                      position: 500,
                      value: 0,
                    },
                    {
                      position: 502,
                      value: 0,
                    },
                    {
                      position: 504,
                      value: 0.4199999869,
                    },
                    {
                      position: 504,
                      value: 0,
                    },
                    {
                      position: 1027,
                      value: 0,
                    },
                    {
                      position: 1028,
                      value: 0.8199999928,
                    },
                    {
                      position: 1028,
                      value: 0,
                    },
                    {
                      position: 1034,
                      value: 0,
                    },
                    {
                      position: 1036,
                      value: 1,
                    },
                    {
                      position: 1036,
                      value: 0,
                    },
                    {
                      position: 1038.5,
                      value: 0,
                    },
                    {
                      position: 1039.25,
                      value: 0.5400000215,
                    },
                    {
                      position: 1039.25,
                      value: 0,
                    },
                    {
                      position: 1042,
                      value: 0,
                    },
                    {
                      position: 1044,
                      value: 0.5799999833,
                    },
                    {
                      position: 1044,
                      value: 0,
                    },
                    {
                      position: 1046,
                      value: 0,
                    },
                    {
                      position: 1048,
                      value: 0.6600000262,
                    },
                    {
                      position: 1048,
                      value: 0,
                    },
                    {
                      position: 1051.5,
                      value: 0,
                    },
                    {
                      position: 1052,
                      value: 0.8199999928,
                    },
                    {
                      position: 1052,
                      value: 0,
                    },
                    {
                      position: 1058,
                      value: 0,
                    },
                    {
                      position: 1060,
                      value: 1,
                    },
                    {
                      position: 1060,
                      value: 0,
                    },
                    {
                      position: 1065.5,
                      value: 0,
                    },
                    {
                      position: 1068,
                      value: 0.6800000072,
                    },
                    {
                      position: 1068,
                      value: 0,
                    },
                    {
                      position: 1070,
                      value: 0.6200000048,
                    },
                    {
                      position: 1070,
                      value: 0,
                    },
                    {
                      position: 1074.5,
                      value: 0,
                    },
                    {
                      position: 1076,
                      value: 0.5600000024,
                    },
                    {
                      position: 1076,
                      value: 0,
                    },
                    {
                      position: 1078,
                      value: 0,
                    },
                    {
                      position: 1080,
                      value: 0.4199999869,
                    },
                    {
                      position: 1080,
                      value: 0,
                    },
                    {
                      position: 1091,
                      value: 0,
                    },
                    {
                      position: 1092,
                      value: 0.8199999928,
                    },
                    {
                      position: 1092,
                      value: 0,
                    },
                    {
                      position: 1098,
                      value: 0,
                    },
                    {
                      position: 1100,
                      value: 1,
                    },
                    {
                      position: 1100,
                      value: 0,
                    },
                    {
                      position: 1102.5,
                      value: 0,
                    },
                    {
                      position: 1103.25,
                      value: 0.5400000215,
                    },
                    {
                      position: 1103.25,
                      value: 0,
                    },
                    {
                      position: 1106,
                      value: 0,
                    },
                    {
                      position: 1108,
                      value: 0.5799999833,
                    },
                    {
                      position: 1108,
                      value: 0,
                    },
                    {
                      position: 1110,
                      value: 0,
                    },
                    {
                      position: 1112,
                      value: 0.6600000262,
                    },
                    {
                      position: 1112,
                      value: 0,
                    },
                    {
                      position: 1115.5,
                      value: 0,
                    },
                    {
                      position: 1116,
                      value: 0.8199999928,
                    },
                    {
                      position: 1116,
                      value: 0,
                    },
                    {
                      position: 1122,
                      value: 0,
                    },
                    {
                      position: 1124,
                      value: 1,
                    },
                    {
                      position: 1124,
                      value: 0,
                    },
                    {
                      position: 1129.5,
                      value: 0,
                    },
                    {
                      position: 1132,
                      value: 0.6800000072,
                    },
                    {
                      position: 1132,
                      value: 0,
                    },
                    {
                      position: 1135,
                      value: 0.4110447764,
                    },
                    {
                      position: 1135,
                      value: 0,
                    },
                    {
                      position: 1138.5,
                      value: 0,
                    },
                    {
                      position: 1140,
                      value: 0.5600000024,
                    },
                    {
                      position: 1140,
                      value: 0,
                    },
                    {
                      position: 1142,
                      value: 0,
                    },
                    {
                      position: 1144,
                      value: 0.4199999869,
                    },
                    {
                      position: 1144,
                      value: 0,
                    },
                    {
                      position: 1155,
                      value: 0,
                    },
                    {
                      position: 1156,
                      value: 0.8199999928,
                    },
                    {
                      position: 1156,
                      value: 0,
                    },
                    {
                      position: 1162,
                      value: 0,
                    },
                    {
                      position: 1164,
                      value: 1,
                    },
                    {
                      position: 1164,
                      value: 0,
                    },
                    {
                      position: 1166.5,
                      value: 0,
                    },
                    {
                      position: 1167.25,
                      value: 0.5400000215,
                    },
                    {
                      position: 1167.25,
                      value: 0,
                    },
                    {
                      position: 1170,
                      value: 0,
                    },
                    {
                      position: 1172,
                      value: 0.5799999833,
                    },
                    {
                      position: 1172,
                      value: 0,
                    },
                    {
                      position: 1174,
                      value: 0,
                    },
                    {
                      position: 1176,
                      value: 0.6600000262,
                    },
                    {
                      position: 1176,
                      value: 0,
                    },
                    {
                      position: 1179.5,
                      value: 0,
                    },
                    {
                      position: 1180,
                      value: 0.8199999928,
                    },
                    {
                      position: 1180,
                      value: 0,
                    },
                    {
                      position: 1186,
                      value: 0,
                    },
                    {
                      position: 1188,
                      value: 1,
                    },
                    {
                      position: 1188,
                      value: 0,
                    },
                    {
                      position: 1193.5,
                      value: 0,
                    },
                    {
                      position: 1196,
                      value: 0.6800000072,
                    },
                    {
                      position: 1196,
                      value: 0,
                    },
                    {
                      position: 1198,
                      value: 0.6200000048,
                    },
                    {
                      position: 1198,
                      value: 0,
                    },
                    {
                      position: 1202.5,
                      value: 0,
                    },
                    {
                      position: 1204,
                      value: 0.5600000024,
                    },
                    {
                      position: 1204,
                      value: 0,
                    },
                    {
                      position: 1206,
                      value: 0,
                    },
                    {
                      position: 1208,
                      value: 0.4199999869,
                    },
                    {
                      position: 1208,
                      value: 0,
                    },
                    {
                      position: 1219,
                      value: 0,
                    },
                    {
                      position: 1220,
                      value: 0.8199999928,
                    },
                    {
                      position: 1220,
                      value: 0,
                    },
                    {
                      position: 1226,
                      value: 0,
                    },
                    {
                      position: 1228,
                      value: 1,
                    },
                    {
                      position: 1228,
                      value: 0,
                    },
                    {
                      position: 1230.5,
                      value: 0,
                    },
                    {
                      position: 1231.25,
                      value: 0.5400000215,
                    },
                    {
                      position: 1231.25,
                      value: 0,
                    },
                    {
                      position: 1234,
                      value: 0,
                    },
                    {
                      position: 1236,
                      value: 0.5799999833,
                    },
                    {
                      position: 1236,
                      value: 0,
                    },
                    {
                      position: 1238,
                      value: 0,
                    },
                    {
                      position: 1240,
                      value: 0.6600000262,
                    },
                    {
                      position: 1240,
                      value: 0,
                    },
                    {
                      position: 1243.5,
                      value: 0,
                    },
                    {
                      position: 1244,
                      value: 0.8199999928,
                    },
                    {
                      position: 1244,
                      value: 0,
                    },
                    {
                      position: 1250,
                      value: 0,
                    },
                    {
                      position: 1252,
                      value: 1,
                    },
                    {
                      position: 1252,
                      value: 0,
                    },
                    {
                      position: 1257.5,
                      value: 0,
                    },
                    {
                      position: 1260,
                      value: 0.6800000072,
                    },
                    {
                      position: 1260,
                      value: 0,
                    },
                    {
                      position: 1263,
                      value: 0.4110447764,
                    },
                    {
                      position: 1263,
                      value: 0,
                    },
                    {
                      position: 1266.5,
                      value: 0,
                    },
                    {
                      position: 1268,
                      value: 0.5600000024,
                    },
                    {
                      position: 1268,
                      value: 0,
                    },
                    {
                      position: 1270,
                      value: 0,
                    },
                    {
                      position: 1272,
                      value: 0.4199999869,
                    },
                    {
                      position: 1272,
                      value: 0,
                    },
                  ],
                },
              ],
            },
            AutoFilter_Cutoff: {
              type: "float",
              placements: [
                {
                  position: 0,
                  duration: 2116,
                  points: [
                    {
                      position: 0,
                      value: 125.800003,
                    },
                    {
                      position: 128,
                      value: 125.800003,
                    },
                    {
                      position: 128,
                      value: 96.1190491,
                    },
                    {
                      position: 172,
                      value: 86.9190521,
                    },
                    {
                      position: 182.5,
                      value: 96.1190491,
                    },
                    {
                      position: 186,
                      value: 129.137833,
                    },
                    {
                      position: 188.5,
                      value: 132.699997,
                    },
                    {
                      position: 192,
                      value: 89.2190475,
                    },
                    {
                      position: 240,
                      value: 121.419044,
                    },
                    {
                      position: 256,
                      value: 121.419044,
                    },
                    {
                      position: 256,
                      value: 135,
                    },
                    {
                      position: 320,
                      value: 135,
                    },
                    {
                      position: 384,
                      value: 135,
                    },
                    {
                      position: 448,
                      value: 135,
                    },
                    {
                      position: 1024,
                      value: 135,
                    },
                    {
                      position: 1088,
                      value: 135,
                    },
                    {
                      position: 1152,
                      value: 135,
                    },
                    {
                      position: 1216,
                      value: 135,
                    },
                  ],
                },
              ],
            },
            AutoPan_Lfo_LfoAmount: {
              type: "float",
              placements: [
                {
                  position: 0,
                  duration: 1228,
                  points: [
                    {
                      position: 0,
                      value: 0,
                    },
                    {
                      position: 262,
                      value: 0,
                    },
                    {
                      position: 262,
                      value: 0.7023810148,
                    },
                    {
                      position: 264,
                      value: 0.7023810148,
                    },
                    {
                      position: 264,
                      value: 0,
                    },
                    {
                      position: 326,
                      value: 0,
                    },
                    {
                      position: 326,
                      value: 0.7023810148,
                    },
                    {
                      position: 328,
                      value: 0.7023810148,
                    },
                    {
                      position: 328,
                      value: 0,
                    },
                    {
                      position: 390,
                      value: 0,
                    },
                    {
                      position: 390,
                      value: 0.7023810148,
                    },
                    {
                      position: 392,
                      value: 0.7023810148,
                    },
                    {
                      position: 392,
                      value: 0,
                    },
                    {
                      position: 454,
                      value: 0,
                    },
                    {
                      position: 454,
                      value: 0.7023810148,
                    },
                    {
                      position: 456,
                      value: 0.7023810148,
                    },
                    {
                      position: 456,
                      value: 0,
                    },
                    {
                      position: 1030,
                      value: 0,
                    },
                    {
                      position: 1030,
                      value: 0.7023810148,
                    },
                    {
                      position: 1032,
                      value: 0.7023810148,
                    },
                    {
                      position: 1032,
                      value: 0,
                    },
                    {
                      position: 1094,
                      value: 0,
                    },
                    {
                      position: 1094,
                      value: 0.7023810148,
                    },
                    {
                      position: 1096,
                      value: 0.7023810148,
                    },
                    {
                      position: 1096,
                      value: 0,
                    },
                    {
                      position: 1158,
                      value: 0,
                    },
                    {
                      position: 1158,
                      value: 0.7023810148,
                    },
                    {
                      position: 1160,
                      value: 0.7023810148,
                    },
                    {
                      position: 1160,
                      value: 0,
                    },
                    {
                      position: 1222,
                      value: 0,
                    },
                    {
                      position: 1222,
                      value: 0.7023810148,
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    },
  };

  test("should convert automation data to MidiData array", () => {
    const midiDataArray = convertAutomationToMidi(
      mockCvpjWithAutomation,
      "test_automation"
    );
    expect(midiDataArray).not.toBeNull();
    expect(midiDataArray?.length).toBe(2); // Two automation groups: Master and Group

    // Check Master automation
    const masterMidi = midiDataArray?.[0];
    expect(masterMidi?.header.format).toBe(1);
    expect(masterMidi?.header.numTracks).toBe(4); // Meta track + three plugins
    expect(masterMidi?.tracks.length).toBe(4);

    // Check Master meta track
    const masterMetaTrack = masterMidi?.tracks[0];
    expect(masterMetaTrack?.[2].type).toBe("trackName");
    expect((masterMetaTrack?.[2] as any).text).toBe(
      "test_automation_Automation_Master"
    );

    // Check Master Controller track
    const masterControllerTrack = masterMidi?.tracks[1];
    expect(masterControllerTrack?.[0].type).toBe("trackName");
    expect((masterControllerTrack?.[0] as any).text).toBe("Endless Smile 64");
    expect(
      masterControllerTrack?.filter(event => event.type === "controller").length
    ).toBe(17);
    const controllerEvents = masterControllerTrack?.filter(
      (event: any) => event.type === "controller"
    ) as any[];
    expect(controllerEvents[0].value).toBe(0); // Start value
    expect(controllerEvents[controllerEvents.length - 1].value).toBe(118); // End value

    // Check Lead automation
    const leadMidi = midiDataArray?.[1];
    expect(leadMidi?.header.format).toBe(1);
    expect(leadMidi?.header.numTracks).toBe(4); // Meta track + three plugins
    expect(leadMidi?.tracks.length).toBe(4);

    // Check Lead meta track
    const leadMetaTrack = leadMidi?.tracks[0];
    expect(leadMetaTrack?.[2].type).toBe("trackName");
    expect((leadMetaTrack?.[2] as any).text).toBe(
      "test_automation_Automation_Lead"
    );

    // Check Lead first plugin track
    const leadFirstPluginTrack = leadMidi?.tracks[1];
    expect(leadFirstPluginTrack?.[0].type).toBe("trackName");
    expect((leadFirstPluginTrack?.[0] as any).text).toBe("Endless Smile 64");
    expect(
      leadFirstPluginTrack?.filter(event => event.type === "controller").length
    ).toBe(453);
    const leadFirstPluginEvents = leadFirstPluginTrack?.filter(
      (event: any) => event.type === "controller"
    ) as any[];
    expect(leadFirstPluginEvents[0].value).toBe(39); // Start value
    expect(leadFirstPluginEvents[leadFirstPluginEvents.length - 1].value).toBe(
      0
    ); // End value
  });

  test("should return null if automation data is missing or empty", () => {
    const cvpjWithoutAutomation = { ...mockCvpjWithAutomation, automation: {} };
    expect(convertAutomationToMidi(cvpjWithoutAutomation, "test")).toBeNull();

    const cvpjWithEmptyAutomation = {
      ...mockCvpjWithAutomation,
      automation: { instrument: {} },
    };
    expect(convertAutomationToMidi(cvpjWithEmptyAutomation, "test")).toBeNull();
  });

  test("should return null if BPM is missing for automation", () => {
    const cvpjWithoutBpm = { ...mockCvpjWithAutomation, parameters: {} };
    expect(convertAutomationToMidi(cvpjWithoutBpm, "test")).toBeNull();
  });

  test("should skip parameters with no placements or empty placements", () => {
    const cvpjWithMissingPlacements = {
      parameters: { bpm: { value: 120 } },
      automation: {
        instrument: {
          "Synth 1": {
            Volume: { type: "float", placements: [] }, // Empty placements
            Pan: { type: "float" }, // Missing placements
          },
        },
      },
    };
    expect(
      convertAutomationToMidi(cvpjWithMissingPlacements, "test")
    ).toBeNull(); // Only meta track generated
  });

  test("should handle parameters with no points or empty points", () => {
    const cvpjWithMissingPoints = {
      parameters: { bpm: { value: 120 } },
      automation: {
        instrument: {
          "Synth 1": {
            Volume: {
              type: "float",
              placements: [{ position: 0, points: [] }],
            }, // Empty points
            Pan: { type: "float", placements: [{ position: 0 }] }, // Missing points
          },
        },
      },
    };
    expect(convertAutomationToMidi(cvpjWithMissingPoints, "test")).toBeNull(); // Only meta track generated
  });

  test("should handle parameters with single point", () => {
    const cvpjWithSinglePoint = {
      parameters: { bpm: { value: 120 } },
      automation: {
        master: {
          master_1: {
            Master: {
              AutoFilter_Cutoff: {
                type: "float",
                placements: [
                  {
                    position: 0,
                    duration: 1160,
                    points: [
                      // single point
                      // {
                      //   position: 0,
                      //   value: 135,
                      // },
                      {
                        position: 368,
                        value: 135,
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    };
    const midiDataArray = convertAutomationToMidi(cvpjWithSinglePoint, "test");
    expect(midiDataArray).not.toBeNull();
    expect(midiDataArray?.length).toBe(1);
    const automationTrack = midiDataArray?.[0].tracks[1];
    expect(
      automationTrack?.filter((event: any) => event.type === "controller")
        .length
    ).toBe(1);
    const automationEvent = automationTrack?.filter(
      (event: any) => event.type === "controller"
    ) as any[];
    expect(automationEvent[0].value).toBe(127);
  });

  test("should convert automation to midi, save, read, and compare bytes", () => {
    const midiDataArray = convertAutomationToMidi(
      mockCvpjWithAutomation,
      "test_automation"
    );
    expect(midiDataArray).not.toBeNull();
    expect(midiDataArray?.length).toBeGreaterThan(0);

    if (!midiDataArray) {
      return;
    }

    midiDataArray.forEach((midiData, index) => {
      const tempFilePath = path.join(
        targetDir,
        `ableton_temp_automation_${index}.mid`
      );

      // Convert MIDI data to bytes
      const outputArray = midiFile.writeMidi(midiData);
      const outputUint8Array = new Uint8Array(outputArray);

      // Write the MIDI data to a temporary file
      fs.writeFileSync(tempFilePath, outputUint8Array);

      // Read the file back
      const inputUint8Array = fs.readFileSync(tempFilePath);

      // Convert bytes to MIDI data
      const midiDataRead = midiFile.parseMidi(inputUint8Array);

      // Compare the original with the read
      expect(toPlainObject(midiData)).toStrictEqual(
        toPlainObject(midiDataRead)
      );

      // Clean up the temporary file
      // fs.unlinkSync(tempFilePath);
    });
  });
});

describe("logMidiDataToString", () => {
  test("should format MidiData into a readable string", () => {
    const mockMidiData = {
      header: {
        format: 1,
        numTracks: 2,
        ticksPerBeat: 480,
      },
      tracks: [
        [
          {
            deltaTime: 0,
            meta: true,
            type: "timeSignature",
            numerator: 4,
            denominator: 4,
          },
          {
            deltaTime: 0,
            meta: true,
            type: "setTempo",
            microsecondsPerBeat: 500000,
          },
          { deltaTime: 0, meta: true, type: "trackName", text: "Meta Track" },
          { deltaTime: 0, meta: true, type: "endOfTrack" },
        ],
        [
          { deltaTime: 0, meta: true, type: "trackName", text: "Piano Track" },
          {
            deltaTime: 480,
            type: "noteOn",
            channel: 0,
            noteNumber: 60,
            velocity: 100,
          },
          {
            deltaTime: 480,
            type: "noteOff",
            channel: 0,
            noteNumber: 60,
            velocity: 64,
          },
          { deltaTime: 0, meta: true, type: "endOfTrack" },
        ],
      ],
    };

    const logString = logMidiDataToString(mockMidiData as any); // Cast to any for simplicity in test mock

    expect(logString).toContain("MIDI File Content:");
    expect(logString).toContain("Format: 1");
    expect(logString).toContain("NumTracks: 2");
    expect(logString).toContain("TicksPerBeat: 480");

    expect(logString).toContain("Track 0: Meta Track");
    expect(logString).toContain(
      "tick: 0 (delta: 0) Meta: Time Signature - 4/4"
    );
    expect(logString).toContain(
      "tick: 0 (delta: 0) Meta: Set Tempo - 500000 us/beat"
    );
    expect(logString).toContain(
      "tick: 0 (delta: 0) Meta: Track Name - Meta Track"
    );
    expect(logString).toContain("tick: 0 (delta: 0) Meta: End Of Track");

    expect(logString).toContain("Track 1: Piano Track");
    expect(logString).toContain(
      "tick: 0 (delta: 0) Meta: Track Name - Piano Track"
    );
    expect(logString).toContain(
      "tick: 480 (delta: 480) Note On - Ch: 0, Note: 60, Vel: 100"
    );
    expect(logString).toContain(
      "tick: 960 (delta: 480) Note Off - Ch: 0, Note: 60, Vel: 64"
    );
    expect(logString).toContain("tick: 960 (delta: 0) Meta: End Of Track");
  });
});

describe("interpolateEvents", () => {
  test("should return input array if less than 2 events", () => {
    const singleEvent: AutomationEvent[] = [{ position: 0, value: 50 }];
    expect(interpolateEvents(singleEvent)).toEqual(singleEvent);
    expect(interpolateEvents([])).toEqual([]);
  });

  test("should perform linear interpolation between two points", () => {
    const events: AutomationEvent[] = [
      { position: 0, value: 0 },
      { position: 10, value: 100 }, // 10 steps, value increases by 10 each step
    ];
    const expected: AutomationEvent[] = [
      { position: 0, value: 0 },
      { position: 1, value: 10 },
      { position: 2, value: 20 },
      { position: 3, value: 30 },
      { position: 4, value: 40 },
      { position: 5, value: 50 },
      { position: 6, value: 60 },
      { position: 7, value: 70 },
      { position: 8, value: 80 },
      { position: 9, value: 90 },
      { position: 10, value: 100 },
    ];
    expect(interpolateEvents(events)).toEqual(expected);
  });

  test("should handle multiple segments of interpolation", () => {
    const events: AutomationEvent[] = [
      { position: 0, value: 0 },
      { position: 5, value: 50 }, // Segment 1: 0->50 over 5 ticks
      { position: 10, value: 0 }, // Segment 2: 50->0 over 5 ticks
    ];
    const result = interpolateEvents(events);
    expect(result.length).toBe(11); // 0 to 10 ticks inclusive
    expect(result[0]).toEqual({ position: 0, value: 0 });
    expect(result[5]).toEqual({ position: 5, value: 50 });
    expect(result[10]).toEqual({ position: 10, value: 0 });
    // Check intermediate points
    expect(result[2]).toEqual({ position: 2, value: 20 }); // Segment 1 interpolation
    expect(result[7]).toEqual({ position: 7, value: 30 }); // Segment 2 interpolation
  });

  test("should not interpolate if values are the same", () => {
    const events: AutomationEvent[] = [
      { position: 0, value: 50 },
      { position: 10, value: 50 },
    ];
    const expected: AutomationEvent[] = [
      { position: 0, value: 50 },
      { position: 10, value: 50 },
    ];
    expect(interpolateEvents(events)).toEqual(expected);
  });

  test("should handle duplicate positions by keeping the last value", () => {
    const events: AutomationEvent[] = [
      { position: 0, value: 0 },
      { position: 5, value: 50 },
      { position: 5, value: 60 }, // Duplicate position
      { position: 10, value: 100 },
    ];
    const result = interpolateEvents(events);
    // Expecting interpolation from {0,0} to {5,60} and {5,60} to {10,100}
    expect(result.find((e: AutomationEvent) => e.position === 5)?.value).toBe(
      60
    );
    expect(result.length).toBe(11); // 0..10
    expect(result[0]).toEqual({ position: 0, value: 0 });
    expect(result[5]).toEqual({ position: 5, value: 60 });
    expect(result[10]).toEqual({ position: 10, value: 100 });
  });

  test("should clamp interpolated values between 0 and 127", () => {
    const events: AutomationEvent[] = [
      { position: 0, value: -50 }, // Start below 0
      { position: 10, value: 200 }, // End above 127
    ];
    const result = interpolateEvents(events);
    expect(result[0].value).toBe(0); // Clamped start
    expect(result[result.length - 1].value).toBe(127); // Clamped end
    // Check if intermediate values are also clamped (though linear interpolation might not hit extremes mid-way)
    result.forEach((event: AutomationEvent) => {
      expect(event.value).toBeGreaterThanOrEqual(0);
      expect(event.value).toBeLessThanOrEqual(127);
    });
  });

  test("should handle floating point results by rounding", () => {
    const events: AutomationEvent[] = [
      { position: 0, value: 0 },
      { position: 3, value: 10 }, // 10 / 3 = 3.33 step
    ];
    const expected: AutomationEvent[] = [
      { position: 0, value: 0 },
      { position: 1, value: 3 }, // 3.33 rounded
      { position: 2, value: 7 }, // 6.66 rounded
      { position: 3, value: 10 },
    ];
    expect(interpolateEvents(events)).toEqual(expected);
  });
});
