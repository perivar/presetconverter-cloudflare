import {
  convertAutomationToMidi,
  convertToMidi,
  logMidiDataToString,
  MidiChannelManager,
} from "../midi";

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
      instrument: {
        "Synth 1": {
          Volume: {
            type: "float",
            placements: [
              {
                position: 0,
                points: [
                  { position: 0, value: 0 },
                  { position: 1, value: 1 },
                ],
              },
            ],
          },
          Pan: {
            type: "float",
            placements: [
              {
                position: 0,
                points: [
                  { position: 0, value: 0.5 },
                  { position: 1, value: -0.5 },
                ],
              },
            ],
          },
        },
        "Drum Rack": {
          Mute: {
            type: "bool",
            placements: [
              {
                position: 0,
                points: [
                  { position: 0, value: 0 },
                  { position: 1, value: 1 },
                ],
              },
            ],
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
    expect(midiDataArray?.length).toBe(2); // Two automation groups: Synth 1 and Drum Rack

    // Check Synth 1 automation
    const synth1Midi = midiDataArray?.[0];
    expect(synth1Midi?.header.format).toBe(1);
    expect(synth1Midi?.header.numTracks).toBe(3); // Meta track + Volume + Pan
    expect(synth1Midi?.tracks.length).toBe(3);

    // Check Synth 1 meta track
    const synth1MetaTrack = synth1Midi?.tracks[0];
    expect(synth1MetaTrack?.[2].type).toBe("trackName");
    expect((synth1MetaTrack?.[2] as any).text).toBe(
      "test_automation_Automation_Synth 1"
    );

    // Check Synth 1 Volume track
    const synth1VolumeTrack = synth1Midi?.tracks[1];
    expect(synth1VolumeTrack?.[0].type).toBe("trackName");
    expect((synth1VolumeTrack?.[0] as any).text).toBe("Volume");
    expect(
      synth1VolumeTrack?.filter(event => event.type === "controller").length
    ).toBe(2);
    const volumeEvents = synth1VolumeTrack?.filter(
      event => event.type === "controller"
    ) as any[];
    expect(volumeEvents[0].value).toBe(0); // Scaled 0
    expect(volumeEvents[1].value).toBe(127); // Scaled 1

    // Check Synth 1 Pan track
    const synth1PanTrack = synth1Midi?.tracks[2];
    expect(synth1PanTrack?.[0].type).toBe("trackName");
    expect((synth1PanTrack?.[0] as any).text).toBe("Pan");
    expect(
      synth1PanTrack?.filter(event => event.type === "controller").length
    ).toBe(2);
    const panEvents = synth1PanTrack?.filter(
      event => event.type === "controller"
    ) as any[];
    // Assuming default min/max for Pan is -1 to 1, 0.5 scales to 80, -0.5 scales to 47
    expect(panEvents[0].value).toBe(80);
    expect(panEvents[1].value).toBe(47);

    // Check Drum Rack automation
    const drumRackMidi = midiDataArray?.[1];
    expect(drumRackMidi?.header.format).toBe(1);
    expect(drumRackMidi?.header.numTracks).toBe(2); // Meta track + Mute
    expect(drumRackMidi?.tracks.length).toBe(2);

    // Check Drum Rack meta track
    const drumRackMetaTrack = drumRackMidi?.tracks[0];
    expect(drumRackMetaTrack?.[2].type).toBe("trackName");
    expect((drumRackMetaTrack?.[2] as any).text).toBe(
      "test_automation_Automation_Drum Rack"
    );

    // Check Drum Rack Mute track
    const drumRackMuteTrack = drumRackMidi?.tracks[1];
    expect(drumRackMuteTrack?.[0].type).toBe("trackName");
    expect((drumRackMuteTrack?.[0] as any).text).toBe("Mute");
    expect(
      drumRackMuteTrack?.filter(event => event.type === "controller").length
    ).toBe(2);
    const muteEvents = drumRackMuteTrack?.filter(
      event => event.type === "controller"
    ) as any[];
    expect(muteEvents[0].value).toBe(0); // Scaled 0 (bool)
    expect(muteEvents[1].value).toBe(127); // Scaled 1 (bool)
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
        instrument: {
          "Synth 1": {
            Volume: {
              type: "float",
              placements: [
                { position: 0, points: [{ position: 0, value: 0.5 }] },
              ],
            }, // Single point
          },
        },
      },
    };
    const midiDataArray = convertAutomationToMidi(cvpjWithSinglePoint, "test");
    expect(midiDataArray).not.toBeNull();
    expect(midiDataArray?.length).toBe(1);
    const volumeTrack = midiDataArray?.[0].tracks[1];
    expect(
      volumeTrack?.filter((event: any) => event.type === "controller").length
    ).toBe(1);
    const volumeEvent = volumeTrack?.filter(
      (event: any) => event.type === "controller"
    ) as any[];
    expect(volumeEvent[0].value).toBe(64); // Scaled 0.5
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
