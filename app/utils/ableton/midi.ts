import type {
  MidiControllerEvent,
  MidiData,
  MidiEndOfTrackEvent,
  MidiEvent,
  MidiHeader,
  MidiNoteOffEvent,
  MidiNoteOnEvent,
  MidiPitchBendEvent,
  MidiProgramChangeEvent,
  MidiSequencerSpecificEvent,
  MidiSetTempoEvent,
  MidiTimeSignatureEvent,
  MidiTrackNameEvent,
} from "midi-file";

import { formatNumber } from "../formatNumber";
import { getFileNameWithoutExtension, makeValidFileName } from "../StringUtils";
import { AutomationEvent } from "./AutomationEvent";
import { plotAutomationEvents } from "./AutomationPlot";
import { interpolateEvents } from "./Interpolate";
import { Log } from "./Log";

export interface AutomationMidi {
  suggestedFileName: string; // Suggested file name for the midi file
  midiData: MidiData; // MidiData object
}

export interface AutomationMidiLog {
  suggestedFileName: string; // Suggested file name for the midi log file
  logString: string; // Log string
}

export interface AutomationPlot {
  suggestedFileName: string; // Suggested file name for the plot file
  plot: string; // SVG string
}

export interface AutomationConversionResult {
  midiDataArray: AutomationMidi[]; // Array of AutomationMidi
  midiLogArray?: AutomationMidiLog[]; // Array of AutomationMidiLog (optional)
  automationPlotArray?: AutomationPlot[]; // Array of AutomationPlot (optional)
}

export class MidiChannelManager {
  private unusedChannel: number;

  constructor(firstChannel?: number) {
    if (firstChannel === undefined) {
      this.unusedChannel = 0;
    } else {
      if (firstChannel >= 1) {
        this.unusedChannel = firstChannel;
      } else {
        throw new Error("First channel must be 1 or more");
      }
    }
  }

  /**
   * Gets the next unused MIDI channel (0-15), skipping channel 10 (index 9).
   */
  public getUnusedChannel(): number {
    this.unusedChannel++;
    if (this.unusedChannel === 10) {
      // Skip drum channel 10
      this.unusedChannel++;
    }
    if (this.unusedChannel == 16) {
      // wrap around
      this.unusedChannel = 1;
    }

    return this.unusedChannel - 1; // return zero-indexed channel
  }
}

// --- Helper Functions ---
function clamp(number: number, min: number, max: number) {
  const clamped = Math.max(min, Math.min(number, max));
  return Math.round(clamped);
}

/** Scales a value from an input range to 0-127 */
function scaleValue(value: number, minValue: number, maxValue: number): number {
  if (maxValue === minValue) {
    // Handle division by zero or constant value case
    // If value is at or above max, return 127, otherwise 0.

    return value >= maxValue ? 127 : 0;
  }
  const scaled = ((value - minValue) / (maxValue - minValue)) * 127;
  return Math.round(scaled);
}

/** Converts RGB doubles (0-1) to RGB bytes (0-255) */
function rgbDoubleToRgbBytes(rgb: number[]): [number, number, number] {
  return [
    Math.max(0, Math.min(255, Math.round(rgb[0] * 255))),
    Math.max(0, Math.min(255, Math.round(rgb[1] * 255))),
    Math.max(0, Math.min(255, Math.round(rgb[2] * 255))),
  ];
}

/** Creates Sequencer Specific Meta Events for track color based on C# logic */
function createTrackColorEvents(
  rgbBytes: [number, number, number]
): MidiSequencerSpecificEvent[] {
  const events: MidiSequencerSpecificEvent[] = [];
  const reversedRgb = [...rgbBytes].reverse(); // C# code reverses the bytes

  // Signal MIDI Editor style
  events.push({
    deltaTime: 0,
    meta: true,
    type: "sequencerSpecific",
    data: [0x53, 0x69, 0x67, 0x6e, 0x01, 0xff, ...reversedRgb], // "Sign", 1, 255, B, G, R
  } as MidiSequencerSpecificEvent);

  // Studio One style
  events.push({
    deltaTime: 0,
    meta: true,
    type: "sequencerSpecific",
    data: [0x50, 0x72, 0x65, 0x53, 0x01, 0xff, ...reversedRgb], // "PreS", 1, 255, B, G, R
  } as MidiSequencerSpecificEvent);

  // Anvil Studio style (more complex calculation)
  const r = rgbBytes[0];
  const g = rgbBytes[1];
  const b = rgbBytes[2];
  const red_p1 = r >> 2;
  const red_p2 = (r << 5) & 0x7f;
  const green_p1 = g >> 3;
  const green_p2 = (g << 4) & 0x7f;
  const blue_p1 = b >> 4;
  const blue_p2 = b & 0x0f;
  const anvilColor = [blue_p2, green_p2 + blue_p1, red_p2 + green_p1, red_p1];
  events.push({
    deltaTime: 0,
    meta: true,
    type: "sequencerSpecific",
    data: [0x05, 0x0f, 0x34, ...anvilColor, 0x00], // Fixed prefix, calculated color, suffix
  } as MidiSequencerSpecificEvent);

  return events;
}

// --- Constants ---
const TICKS_PER_BEAT = 480; // Standard MIDI PPQ (Parts Per Quarter note)
const ABLETON_TICK_MULTIPLIER = TICKS_PER_BEAT / (4 * 4); // = 30; Ticks per Ableton Beat (assuming 4/4)

// --- Main Conversion Functions ---

/**
 * Converts the note data from the common project format (cvpj) into a MIDI data structure.
 * Uses the 'midi-file' library format.
 * @returns A MidiData object or null.
 */
export function convertToMidi(cvpj: any, fileName?: string): MidiData | null {
  Log.Information(`Starting MIDI conversion for notes: ${fileName}`);

  if (!cvpj?.parameters?.bpm?.value) {
    Log.Error("BPM not found in cvpj data.");
    return null;
  }
  if (
    !cvpj?.track_placements ||
    Object.keys(cvpj.track_placements).length === 0
  ) {
    Log.Warning("No track placements found to convert to MIDI.");
    return null;
  }

  const tempoBpm = cvpj.parameters.bpm.value;
  const microsecondsPerBeat = Math.round(60000000 / tempoBpm);

  const header: MidiHeader = {
    format: 1, // Multi-track format
    numTracks: 1, // Start with 1 for the meta track
    ticksPerBeat: TICKS_PER_BEAT,
  };
  const tracks: MidiEvent[][] = [];

  // Track 0: Meta track (Tempo, Time Signature)
  const metaTrack: MidiEvent[] = [
    {
      deltaTime: 0,
      meta: true,
      type: "timeSignature",
      numerator: 4,
      denominator: 4,
      metronome: 24,
      thirtyseconds: 8,
    } as MidiTimeSignatureEvent,
    {
      deltaTime: 0,
      meta: true,
      type: "setTempo",
      microsecondsPerBeat: microsecondsPerBeat,
    } as MidiSetTempoEvent,
  ];

  // Sequence/Track Name for the file itself? Optional.
  if (fileName) {
    metaTrack.push({
      deltaTime: 0,
      meta: true,
      type: "trackName",
      text: fileName,
    } as MidiTrackNameEvent);
  }

  // Always add End of Track meta event
  metaTrack.push({
    deltaTime: 0,
    meta: true,
    type: "endOfTrack",
  } as MidiEndOfTrackEvent);

  tracks.push(metaTrack);

  const midiChannelManager = new MidiChannelManager();

  for (const trackId in cvpj.track_placements) {
    const trackPlacement = cvpj.track_placements[trackId];
    const trackData = cvpj.track_data?.[trackId];

    if (!trackData || !trackPlacement?.notes) {
      Log.Debug(`Skipping track ${trackId} - Missing data or notes.`);
      continue;
    }

    const trackName = trackData.name ?? `Track ${trackId}`;
    const midiChannel = midiChannelManager.getUnusedChannel();
    const trackColor = trackData.color; // Array of doubles [0-1, 0-1, 0-1]

    Log.Debug(
      `Creating MIDI track: ${trackName} (ID: ${trackId}) on channel: ${midiChannel}`
    );

    const currentTrackEvents: MidiEvent[] = [];

    // Add Track Name Meta Event
    currentTrackEvents.push({
      deltaTime: 0,
      meta: true,
      type: "trackName",
      text: trackName,
    });

    // Add Program Change (GM Acoustic Grand Piano)
    currentTrackEvents.push({
      deltaTime: 0,
      type: "programChange",
      channel: midiChannel,
      programNumber: 0,
    });

    // Add Track Color Meta Events if color exists
    if (trackColor && Array.isArray(trackColor) && trackColor.length === 3) {
      const rgbBytes = rgbDoubleToRgbBytes(trackColor);
      const colorEvents = createTrackColorEvents(rgbBytes);
      currentTrackEvents.push(...colorEvents); // Add color events (deltaTime 0)
    }

    // Collect all note on/off events with absolute ticks
    const timedEvents: { tick: number; event: MidiEvent }[] = [];

    for (const notePlacement of trackPlacement.notes) {
      if (!notePlacement.muted && notePlacement.notelist) {
        for (const noteData of notePlacement.notelist) {
          const midiNoteKey = noteData.key; // Assuming noteData.key is MIDI note number
          const noteStartTick = Math.round(
            (notePlacement.position + noteData.position) *
              ABLETON_TICK_MULTIPLIER
          );
          const noteDurationTicks = Math.round(
            noteData.duration * ABLETON_TICK_MULTIPLIER
          );
          const noteEndTick = noteStartTick + noteDurationTicks;
          const midiNoteVelocity = Math.round(
            Math.max(0, Math.min(1, noteData.vol ?? 0.78)) * 127
          );
          const midiNoteOffVelocity = 64; // Standard Note Off velocity

          if (noteDurationTicks > 0) {
            timedEvents.push({
              tick: noteStartTick,
              // Explicitly cast to specific event type for clarity, though MidiEvent union works
              event: {
                type: "noteOn",
                channel: midiChannel,
                noteNumber: midiNoteKey,
                velocity: midiNoteVelocity,
                deltaTime: 0,
              } as MidiNoteOnEvent,
            });
            timedEvents.push({
              tick: noteEndTick,
              event: {
                type: "noteOff",
                channel: midiChannel,
                noteNumber: midiNoteKey,
                velocity: midiNoteOffVelocity,
                deltaTime: 0,
              } as MidiNoteOffEvent,
            });
          } else {
            Log.Warning(
              `Skipping note with zero duration at position ${noteStartTick} ticks in track ${trackName}`
            );
          }
        }
      }
    }

    // Sort events by absolute tick time
    timedEvents.sort((a, b) => a.tick - b.tick);

    // Calculate delta times and add to track
    let lastTick = 0;
    for (const timedEvent of timedEvents) {
      const deltaTime = timedEvent.tick - lastTick;
      currentTrackEvents.push({ ...timedEvent.event, deltaTime: deltaTime });
      lastTick = timedEvent.tick;
    }

    // Add End of Track meta event
    currentTrackEvents.push({
      deltaTime: 0,
      meta: true,
      type: "endOfTrack",
    });

    tracks.push(currentTrackEvents);
    header.numTracks++; // Increment track count
  }

  if (tracks.length <= 1) {
    // Only meta track exists
    Log.Warning("No valid tracks with notes were converted.");
    return null;
  }

  const midiData: MidiData = { header, tracks };

  Log.Information("MIDI conversion for notes completed.");

  return midiData;
}

/**
 * Converts automation data from the common project format (cvpj) into MIDI data structures.
 * Uses the 'midi-file' library format.
 * @returns An array of MidiData objects or null.
 */
export function convertAutomationToMidi(
  cvpj: any,
  fileName: string,
  doOutputDebugFile: boolean = false
): AutomationConversionResult | null {
  Log.Information(`Starting MIDI conversion for automation: ${fileName}`);

  if (!cvpj?.automation || Object.keys(cvpj.automation).length === 0) {
    Log.Debug("Skipping automation conversion: No automation data found.");
    return null;
  }
  if (!cvpj?.parameters?.bpm?.value) {
    Log.Error("BPM not found in cvpj data for automation conversion.");
    return null;
  }

  const tempoBpm = cvpj.parameters.bpm.value;
  const microsecondsPerBeat = Math.round(60000000 / tempoBpm);

  const midiDataArray: AutomationMidi[] = []; // Array of AutomationMidi
  const midiLogArray: AutomationMidiLog[] = []; // Array of AutomationMidiLog
  const automationPlotArray: AutomationPlot[] = []; // Array of AutomationPlot

  let fileNum = 1;

  // Iterate through the top-level automation categories (e.g., "master", "group", "track")
  for (const trackTypeKey in cvpj.automation) {
    const trackTypeValue = cvpj.automation[trackTypeKey];

    // Iterate through track type entries within each category (e.g., "master_<track_id>", "group_35", "audio_64")
    for (const trackTypeEntryKey in trackTypeValue) {
      const trackTypeEntryValue = trackTypeValue[trackTypeEntryKey];

      // Iterate through track names or group names (e.g., "Master", "Lead")
      // A new MidiData object (representing a MIDI file) is created for each of these.
      for (const trackNameKey in trackTypeEntryValue) {
        const trackNameValue = trackTypeEntryValue[trackNameKey]; // This object contains device paths as keys

        const fileNameNoExtension = getFileNameWithoutExtension(fileName);

        const automationGroupName = `${fileNameNoExtension}_Automation_${trackNameKey}`;
        Log.Debug(
          `Creating MIDI data for automation group: ${trackNameKey} (Type: ${trackTypeKey}, ID: ${trackTypeEntryKey})`
        );

        const header: MidiHeader = {
          format: 1, // Multi-track format
          numTracks: 1, // Start with 1 for the meta track. This is incremented while adding tracks in the loop below.
          ticksPerBeat: TICKS_PER_BEAT,
        };
        const tracks: MidiEvent[][] = [];

        // Track 0: Meta track for this automation group (MIDI file)
        const metaTrack: MidiEvent[] = [
          {
            deltaTime: 0,
            meta: true,
            type: "timeSignature",
            numerator: 4,
            denominator: 4,
            metronome: 24,
            thirtyseconds: 8,
          } as MidiTimeSignatureEvent,
          {
            deltaTime: 0,
            meta: true,
            type: "setTempo",
            microsecondsPerBeat: microsecondsPerBeat,
          } as MidiSetTempoEvent,
          {
            deltaTime: 0,
            meta: true,
            type: "trackName",
            text: automationGroupName, // Name of the overall MIDI file
          } as MidiTrackNameEvent,
          {
            deltaTime: 0,
            meta: true,
            type: "endOfTrack",
          } as MidiEndOfTrackEvent,
        ];
        tracks.push(metaTrack);

        const midiChannelManager = new MidiChannelManager();

        // Iterate through plugin names (e.g., "AutoFilter_Cutoff", "FabFilter Pro-Q 3")
        let trackNum = 1;
        for (const pluginNameKey in trackNameValue) {
          const paramData = trackNameValue[pluginNameKey]; // paramData IS the { type: "...", placements: [...] } object
          const type = paramData.type;
          const placements = paramData.placements;

          if (!placements || placements.length === 0) {
            Log.Debug(
              `Skipping ${pluginNameKey} in ${trackNameKey}: No placements.`
            );
            continue;
          }

          const midiTrackName = makeValidFileName(pluginNameKey); // Name for the individual MIDI track (controller data)
          const midiChannel = midiChannelManager.getUnusedChannel();

          Log.Debug(
            `Adding MIDI track: ${trackNum} ${midiTrackName} (${trackTypeKey}:${trackTypeEntryKey}, ${trackNameKey}, ${pluginNameKey}) on Channel: ${midiChannel}`
          );

          const currentTrackEvents: MidiEvent[] = [];
          currentTrackEvents.push({
            deltaTime: 0,
            meta: true,
            type: "trackName",
            text: midiTrackName,
          });

          // Determine min/max values based on all points across all placements for this parameter
          let globalMinValue = Infinity;
          let globalMaxValue = -Infinity;
          placements.forEach((placement: any) => {
            placement.points?.forEach((point: any) => {
              if (point.value < globalMinValue) globalMinValue = point.value;
              if (point.value > globalMaxValue) globalMaxValue = point.value;
            });
          });
          if (globalMinValue === Infinity || globalMaxValue === -Infinity) {
            // Fallback if no points were found (should be caught by placements.length check, but as a safeguard)
            if (type === "float" || type === "bool") {
              globalMinValue = 0.0;
              globalMaxValue = 1.0;
            } else {
              globalMinValue = 0;
              globalMaxValue = 127; // Default MIDI range
            }
            Log.Warning(
              `Could not determine min/max for ${pluginNameKey} in ${trackNameKey}, assuming range [${globalMinValue}-${globalMaxValue}]`
            );
          }

          const controlNumber = 11; // CC 11 for Expression (Common choice for automation)
          let allPlacementEvents: AutomationEvent[] = [];
          let interpolatedPlacementEvents: AutomationEvent[] = [];

          // Process each placement for the current parameter
          for (const placement of placements) {
            const placementPos = placement.position ?? 0; // Position of the placement in ticks (already scaled by ABLETON_TICK_MULTIPLIER earlier in C#)
            const points = placement.points ?? []; // Automation points within this placement

            if (points.length === 0) continue;

            // 1. Prepare AutomationEvent[] for interpolation for this placement
            const initialEvents: AutomationEvent[] = points.map(
              (point: any) => {
                const pointPos = point.position ?? 0; // Position of the point relative to the placement start (already scaled by ABLETON_TICK_MULTIPLIER earlier in C#)
                const pointValue = point.value ?? 0;

                // Calculate absolute midi position for the point
                const midiPointPosition =
                  (placementPos * 4 + pointPos * 4) * 30;

                let scaledValue: number;
                if (globalMaxValue > 1) {
                  // Scale between 0 and 127 using minValue and maxValue
                  scaledValue = scaleValue(
                    pointValue,
                    globalMinValue,
                    globalMaxValue
                  );
                } else {
                  // Clamp and multiply with 127 if maxValue is 1 and minValue is 0
                  scaledValue = clamp(pointValue * 127, 0, 127);
                }

                return { position: midiPointPosition, value: scaledValue };
              }
            );

            // 2. Interpolate the events for this placement
            interpolatedPlacementEvents = interpolateEvents(initialEvents);

            // save the interpolated events as a svg
            // Generate the plot string only if doOutputDebugFile is true
            if (doOutputDebugFile) {
              const automationPlot = plotAutomationEvents(
                interpolatedPlacementEvents
              );
              automationPlotArray.push({
                suggestedFileName: `automation_${formatNumber(fileNum)}_${formatNumber(trackNum)}_${trackTypeKey}_${trackNameKey}_${midiTrackName}`,
                plot: JSON.stringify(automationPlot),
              } as AutomationPlot);
            }

            // 3. Add the results to the list for the entire parameter track
            allPlacementEvents = allPlacementEvents.concat(
              interpolatedPlacementEvents
            );
          } // End of placement loop

          trackNum++;

          // Calculate delta times and add Control Change events to the current track
          let prevPos = 0;
          for (const currentEvent of interpolatedPlacementEvents) {
            // Calculate delta time
            const deltaTime = currentEvent.position - prevPos;
            const scaledValue = currentEvent.value; // Value is already scaled 0-127

            // Only add event if deltaTime is non-negative (should be true after sorting)
            // and if the value is different from the last value (optional optimization)
            // For simplicity, adding all unique tick events for now.
            currentTrackEvents.push({
              type: "controller",
              channel: midiChannel,
              controllerType: controlNumber,
              value: scaledValue,
              deltaTime: deltaTime,
            } as MidiControllerEvent);

            // Update prevPos with the current value for the next iteration
            prevPos = currentEvent.position;
          } // End of loop

          // Add End of Track meta event for this parameter track
          currentTrackEvents.push({
            deltaTime: 0,
            meta: true,
            type: "endOfTrack",
          });
          tracks.push(currentTrackEvents); // Add the parameter track to the MIDI data's tracks
          header.numTracks++; // Increment the track count in the header
        } // End of pluginNameKey

        // After processing all device parameters for the current abletonTrackNameKey
        if (tracks.length > 1) {
          // Check if any parameter tracks (beyond the initial meta track) were added
          const midiData: MidiData = { header, tracks };

          // Add the completed MidiData object to the array
          midiDataArray.push({
            suggestedFileName: `${automationGroupName}`,
            midiData: midiData,
          } as AutomationMidi);

          Log.Information(
            `Generated MIDI data for automation group: ${automationGroupName}`
          );

          if (doOutputDebugFile) {
            const logString = logMidiDataToString(midiData);
            Log.Debug(`MIDI Log for ${automationGroupName} generated`);

            // Add the completed MidiData log object to the array
            midiLogArray.push({
              suggestedFileName: `${automationGroupName}`,
              logString: logString,
            } as AutomationMidiLog);
          }
          fileNum++; // Increment file number
        } else {
          Log.Warning(
            `No automation tracks with data generated for group: ${automationGroupName}`
          );
        }
      } // End of trackNameKey loop
    } // End of trackTypeEntryKey loop
  } // End of trackTypeKey loop

  Log.Information("MIDI conversion for automation completed.");
  return {
    midiDataArray: midiDataArray,
    midiLogArray: midiLogArray,
    automationPlotArray: automationPlotArray,
  };
}

/**
 * Generates a string representation of a MIDI data object for logging.
 * @param midiData The MidiData object.
 * @returns A string containing the formatted MIDI data.
 */
export function logMidiDataToString(midiData: MidiData): string {
  let logContent = "MIDI File Content:\n";
  if (midiData.header.format) {
    logContent += `Format: ${midiData.header.format}\n`;
  }
  if (midiData.header.numTracks) {
    logContent += `NumTracks: ${midiData.header.numTracks}\n`;
  }
  if (midiData.header.timeDivision) {
    logContent += `TimeDivision: ${midiData.header.timeDivision}\n`;
  }
  if (midiData.header.framesPerSecond) {
    logContent += `FramesPerSecond: ${midiData.header.framesPerSecond}\n`;
  }
  if (midiData.header.ticksPerFrame) {
    logContent += `TicksPerFrame: ${midiData.header.ticksPerFrame}\n`;
  }
  if (midiData.header.ticksPerBeat) {
    logContent += `TicksPerBeat: ${midiData.header.ticksPerBeat}\n\n`;
  }

  midiData.tracks.forEach((trackEvents, index) => {
    logContent += `Track ${index + 1}:\n`; // Use 1-based indexing for track number

    for (const event of trackEvents) {
      const deltaTime = event.deltaTime; // midi-file provides delta time directly

      switch (event.type) {
        case "trackName":
          const trackNameEvent = event as MidiTrackNameEvent;
          logContent += `MetaMessage('track_name', name='${trackNameEvent.text}', time=${deltaTime})\n`;
          break;
        case "setTempo":
          const setTempoEvent = event as MidiSetTempoEvent;
          logContent += `MetaMessage('set_tempo', tempo=${setTempoEvent.microsecondsPerBeat}, time=${deltaTime})\n`;
          break;
        case "timeSignature":
          const timeSignatureEvent = event as MidiTimeSignatureEvent;
          let timeSignatureString = `MetaMessage('time_signature', numerator=${timeSignatureEvent.numerator}, denominator=${timeSignatureEvent.denominator}`;
          if (timeSignatureEvent.metronome !== undefined) {
            timeSignatureString += `, clocks_per_click=${timeSignatureEvent.metronome}`;
          }
          if (timeSignatureEvent.thirtyseconds !== undefined) {
            timeSignatureString += `, notated_32nd_notes_per_beat=${timeSignatureEvent.thirtyseconds}`;
          }
          timeSignatureString += `, time=${deltaTime})\n`;
          logContent += timeSignatureString;
          break;
        case "sequencerSpecific":
          const sequencerSpecificEvent = event as MidiSequencerSpecificEvent;
          logContent += `MetaMessage('sequencer_specific', data=(${Array.from(sequencerSpecificEvent.data).join(", ")}), time=${deltaTime})\n`;
          break;
        case "endOfTrack":
          logContent += `MetaMessage('end_of_track', time=${deltaTime})\n`;
          break;
        case "noteOn":
          const noteOnEvent = event as MidiNoteOnEvent;
          logContent += `note_on channel=${noteOnEvent.channel} note=${noteOnEvent.noteNumber} velocity=${noteOnEvent.velocity} time=${deltaTime}\n`;
          break;
        case "noteOff":
          const noteOffEvent = event as MidiNoteOffEvent;
          logContent += `note_off channel=${noteOffEvent.channel} note=${noteOffEvent.noteNumber} velocity=${noteOffEvent.velocity} time=${deltaTime}\n`;
          break;
        case "programChange":
          const programChangeEvent = event as MidiProgramChangeEvent;
          logContent += `program_change channel=${programChangeEvent.channel} program=${programChangeEvent.programNumber} time=${deltaTime}\n`;
          break;
        case "controller":
          const controlChangeEvent = event as MidiControllerEvent;
          logContent += `control_change channel=${controlChangeEvent.channel} number=${controlChangeEvent.controllerType} value=${controlChangeEvent.value} time=${deltaTime}\n`;
          break;
        case "pitchBend":
          const pitchBendEvent = event as MidiPitchBendEvent;
          logContent += `pitch_bend channel=${pitchBendEvent.channel} value=${pitchBendEvent.value} time=${deltaTime}\n`;
          break;
        default:
          // Log any other event types encountered
          logContent += `Unknown Event: ${event.type} ${JSON.stringify(event)}, time=${deltaTime}\n`;
      }
    }
    logContent += "\n"; // Add empty line after each track
  });

  return logContent;
}
