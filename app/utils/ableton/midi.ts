import type {
  MidiControllerEvent,
  MidiData,
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

import { makeValidFileName } from "../StringUtils";
import { Log } from "./Log";

export interface AutomationEvent {
  position: number; // tick
  value: number; // scaled MIDI value 0-127
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

/** Scales a value from an input range to 0-127 */
function scaleValue(value: number, minValue: number, maxValue: number): number {
  if (maxValue === minValue) {
    // Handle division by zero or constant value case
    // If value is at or above max, return 127, otherwise 0.
    // Or, if min/max are equal, maybe just return a fixed value like 64?
    // C# code doesn't explicitly handle this, but division by zero would error.
    // Let's return 127 if value >= max, else 0, similar to bool scaling.
    return value >= maxValue ? 127 : 0;
  }
  const scaled = ((value - minValue) / (maxValue - minValue)) * 127;
  return Math.max(0, Math.min(127, Math.round(scaled)));
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
export function convertToMidi(
  cvpj: any,
  fileName: string,
  doOutputDebugFile: boolean = false
): MidiData | null {
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
    },
    {
      deltaTime: 0,
      meta: true,
      type: "setTempo",
      microsecondsPerBeat: microsecondsPerBeat,
    },
    // Sequence/Track Name for the file itself? Optional.
    // { deltaTime: 0, meta: true, type:  "trackName", text: fileName },
    { deltaTime: 0, meta: true, type: "endOfTrack" },
  ];
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

  if (doOutputDebugFile) {
    const logString = logMidiDataToString(midiData); // Use the new logger
    Log.Debug("MIDI Log:\n" + logString);
  }

  return midiData;
}

function clampValue(currentEvent: AutomationEvent) {
  // make sure currentEvent value is clamped to 0-127
  const curClampedValue = Math.max(0, Math.min(127, currentEvent.value)); // Ensure value stays 0-127
  currentEvent.value = curClampedValue;
  return currentEvent;
}

/**
 * Interpolates automation events linearly, similar to the C# implementation.
 * Ensures unique positions and keeps the last value for each position.
 * @param events An array of AutomationEvent objects, sorted by position (tick), with values already scaled (0-127).
 * @returns A new array of interpolated AutomationEvent objects, sorted by position.
 */
export function interpolateEvents(
  events: AutomationEvent[]
): AutomationEvent[] {
  if (events.length < 2) {
    return [...events]; // Return a copy if not enough points to interpolate
  }

  // Use Map directly to store the latest value for each position (tick)
  const interpolatedEventsMap = new Map<number, AutomationEvent>();

  for (let i = 0; i < events.length - 1; i++) {
    const currentEvent = events[i];
    const nextEvent = events[i + 1];

    // Add the starting event of the pair, ensuring it's the latest for its position
    interpolatedEventsMap.set(currentEvent.position, clampValue(currentEvent));

    // Check if interpolation is needed (different values and different positions)
    if (
      currentEvent.value !== nextEvent.value &&
      currentEvent.position !== nextEvent.position
    ) {
      const valueDiff = nextEvent.value - currentEvent.value;
      const posDiff = nextEvent.position - currentEvent.position; // Should always be > 0 if sorted

      // Determine number of steps: interpolate for each tick difference
      // Ensure posDiff is positive before calculating steps
      const numSteps = posDiff > 0 ? Math.max(Math.floor(posDiff), 1) : 1;

      const valueStep = valueDiff / numSteps;
      const positionStep = posDiff / numSteps;

      // Interpolate points between currentEvent and nextEvent
      for (let step = 1; step < numSteps; step++) {
        // Iterate *between* points
        const interpPos = Math.round(
          currentEvent.position + step * positionStep
        );

        // Avoid adding points exactly at the next event's position during interpolation loop
        if (interpPos >= nextEvent.position) continue;

        const interpValue = Math.round(currentEvent.value + step * valueStep);
        const clampedValue = Math.max(0, Math.min(127, interpValue)); // Ensure value stays 0-127

        const newEvent: AutomationEvent = {
          position: interpPos,
          value: clampedValue,
        };

        // Add to map, overwriting previous value for the same position if any
        interpolatedEventsMap.set(newEvent.position, newEvent);
      }
    }
    // The nextEvent will be added as currentEvent in the next iteration,
    // or handled by the final step below if it's the last event.
  }

  // Ensure the very last event is always included and is the latest for its position
  const finalEvent = events[events.length - 1];
  interpolatedEventsMap.set(finalEvent.position, clampValue(finalEvent));

  // Retrieve values sorted by position (tick)
  return Array.from(interpolatedEventsMap.values()).sort(
    (a, b) => a.position - b.position
  );
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
): MidiData[] | null {
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
  const midiDataArray: MidiData[] = [];
  let fileNum = 1;

  for (const trackTypeKey in cvpj.automation) {
    const trackTypeValue = cvpj.automation[trackTypeKey];
    for (const trackTypeEntryKey in trackTypeValue) {
      const trackTypeEntryValue = trackTypeValue[trackTypeEntryKey];
      for (const trackNameKey in trackTypeEntryValue) {
        const trackNameValue = trackTypeEntryValue[trackNameKey];

        const automationGroupName = `${fileName}_Automation_${trackNameKey}`;
        Log.Debug(
          `Creating MIDI data for automation group: ${trackNameKey} (${trackTypeKey}/${trackTypeEntryKey})`
        );

        const header: MidiHeader = {
          format: 1,
          numTracks: 1, // Start with meta track
          ticksPerBeat: TICKS_PER_BEAT,
        };
        const tracks: MidiEvent[][] = [];

        // Track 0: Meta track
        const metaTrack: MidiEvent[] = [
          {
            deltaTime: 0,
            meta: true,
            type: "timeSignature",
            numerator: 4,
            denominator: 4,
            metronome: 24,
            thirtyseconds: 8,
          },
          {
            deltaTime: 0,
            meta: true,
            type: "setTempo",
            microsecondsPerBeat: microsecondsPerBeat,
          },
          {
            deltaTime: 0,
            meta: true,
            type: "trackName",
            text: automationGroupName,
          },
          { deltaTime: 0, meta: true, type: "endOfTrack" },
        ];
        tracks.push(metaTrack);

        const midiChannelManager = new MidiChannelManager();

        for (const paramPathKey in trackNameValue) {
          const paramData = trackNameValue[paramPathKey];
          const paramType = paramData.type;
          const placements = paramData.placements;

          if (!placements || placements.length === 0) continue;

          const midiTrackName = makeValidFileName(paramPathKey);
          const midiChannel = midiChannelManager.getUnusedChannel();

          Log.Debug(
            `Adding MIDI track for parameter: ${midiTrackName} on Channel: ${midiChannel}`
          );

          const currentTrackEvents: MidiEvent[] = [];
          currentTrackEvents.push({
            deltaTime: 0,
            meta: true,
            type: "trackName",
            text: midiTrackName,
          });

          // Determine min/max values
          let globalMinValue = Infinity;
          let globalMaxValue = -Infinity;
          placements.forEach((placement: any) => {
            placement.points?.forEach((point: any) => {
              if (point.value < globalMinValue) globalMinValue = point.value;
              if (point.value > globalMaxValue) globalMaxValue = point.value;
            });
          });
          if (globalMinValue === Infinity || globalMaxValue === -Infinity) {
            if (paramType === "float" || paramType === "bool") {
              globalMinValue = 0.0;
              globalMaxValue = 1.0;
            } else {
              globalMinValue = 0;
              globalMaxValue = 127;
            }
            Log.Warning(
              `Could not determine min/max for ${paramPathKey}, assuming range [${globalMinValue}-${globalMaxValue}]`
            );
          }

          const controlNumber = 11; // CC 11 for Expression
          let allPlacementEvents: AutomationEvent[] = [];

          for (const placement of placements) {
            const placementPos = placement.position ?? 0;
            const points = placement.points ?? [];

            if (points.length === 0) continue;

            // 1. Prepare AutomationEvent[] for interpolation
            const initialEvents: AutomationEvent[] = points.map(
              (point: any) => {
                const pointPos = point.position ?? 0;
                const pointValue = point.value ?? 0;
                const tick = Math.round(
                  (placementPos + pointPos) * ABLETON_TICK_MULTIPLIER
                );
                let scaledValue: number;
                if (paramType === "bool") {
                  scaledValue = pointValue >= 0.5 ? 127 : 0;
                } else {
                  scaledValue = scaleValue(
                    pointValue,
                    globalMinValue,
                    globalMaxValue
                  );
                }
                return { position: tick, value: scaledValue };
              }
            );

            // Ensure initialEvents are sorted by position before interpolating
            initialEvents.sort((a, b) => a.position - b.position);

            // 2. Interpolate the events for this placement
            const interpolatedPlacementEvents =
              interpolateEvents(initialEvents);

            // 3. Add the results to the list for the entire parameter track
            allPlacementEvents = allPlacementEvents.concat(
              interpolatedPlacementEvents
            );
          }

          // Sort events by absolute tick time
          // Use a Map to ensure unique ticks and keep the last value for duplicates, then sort.
          const uniqueTickEvents = new Map<number, AutomationEvent>();
          allPlacementEvents.forEach(event => {
            uniqueTickEvents.set(event.position, event);
          });
          const sortedUniqueEvents = Array.from(uniqueTickEvents.values()).sort(
            (a, b) => a.position - b.position
          );

          // Calculate delta times and add to track
          let lastTick = 0;
          for (const automationEvent of sortedUniqueEvents) {
            const deltaTime = automationEvent.position - lastTick;
            currentTrackEvents.push({
              type: "controller",
              channel: midiChannel,
              controllerType: controlNumber,
              value: automationEvent.value,
              deltaTime: deltaTime,
            } as MidiControllerEvent);
            lastTick = automationEvent.position;
          }

          currentTrackEvents.push({
            deltaTime: 0,
            meta: true,
            type: "endOfTrack",
          });
          tracks.push(currentTrackEvents);
          header.numTracks++;
        }

        if (tracks.length > 1) {
          const midiData: MidiData = { header, tracks };
          midiDataArray.push(midiData);
          Log.Information(
            `Generated MIDI data for automation group: ${automationGroupName}`
          );
          if (doOutputDebugFile) {
            const logString = logMidiDataToString(midiData);
            Log.Debug(`MIDI Log (${fileNum}):\n${logString}`);
          }
          fileNum++;
        } else {
          Log.Warning(
            `No automation tracks generated for group: ${automationGroupName}`
          );
        }
      }
    }
  }

  Log.Information("MIDI conversion for automation completed.");
  return midiDataArray.length > 0 ? midiDataArray : null;
}
/**
 * Generates a string representation of a MIDI data object for logging.
 * Adapts C# LogMidiFile logic for the 'midi-file' structure.
 * @param midiData The MidiData object.
 * @returns A string containing the formatted MIDI data.
 */
export function logMidiDataToString(midiData: MidiData): string {
  let logContent = "MIDI File Content:\n";
  logContent += `Format: ${midiData.header.format}\n`;
  logContent += `NumTracks: ${midiData.header.numTracks}\n`;
  logContent += `TicksPerBeat: ${midiData.header.ticksPerBeat}\n\n`;

  midiData.tracks.forEach((trackEvents, index) => {
    logContent += `Track ${index}:\n`;
    let trackName = `Track ${index}`; // Default name
    let currentTick = 0; // Absolute tick counter for context

    for (const event of trackEvents) {
      currentTick += event.deltaTime; // Add delta time to get absolute time for context
      logContent += `  tick: ${currentTick} (delta: ${event.deltaTime}) `; // Show absolute and delta

      switch (event.type) {
        case "trackName":
          const trackNameEvent = event as MidiTrackNameEvent;
          trackName = trackNameEvent.text ?? trackName; // Capture track name
          logContent += `Meta: Track Name - ${trackNameEvent.text}\n`;
          break;
        case "setTempo":
          const setTempoEvent = event as MidiSetTempoEvent;
          logContent += `Meta: Set Tempo - ${setTempoEvent.microsecondsPerBeat} us/beat\n`;
          break;
        case "timeSignature":
          const timeSignatureEvent = event as MidiTimeSignatureEvent;
          logContent += `Meta: Time Signature - ${timeSignatureEvent.numerator}/${timeSignatureEvent.denominator}\n`;
          break;
        case "sequencerSpecific":
          const sequencerSpecificEvent = event as MidiSequencerSpecificEvent;
          logContent += `Meta: Sequencer Specific - Data: ${sequencerSpecificEvent.data}\n`;
          break;
        case "endOfTrack":
          // const endOfTrackEvent = event as MidiEndOfTrackEvent;
          logContent += `Meta: End Of Track\n`;
          break;
        case "noteOn":
          const noteOnEvent = event as MidiNoteOnEvent;
          logContent += `Note On - Ch: ${noteOnEvent.channel}, Note: ${noteOnEvent.noteNumber}, Vel: ${noteOnEvent.velocity}\n`;
          break;
        case "noteOff":
          const noteOffEvent = event as MidiNoteOffEvent;
          logContent += `Note Off - Ch: ${noteOffEvent.channel}, Note: ${noteOffEvent.noteNumber}, Vel: ${noteOffEvent.velocity}\n`;
          break;
        case "programChange":
          const programChangeEvent = event as MidiProgramChangeEvent;
          logContent += `Program Change - Ch: ${programChangeEvent.channel}, Program: ${programChangeEvent.programNumber}\n`;
          break;
        case "controller":
          const controlChangeEvent = event as MidiControllerEvent;
          logContent += `Control Change - Ch: ${controlChangeEvent.channel}, Controller: ${controlChangeEvent.controllerType}, Value: ${controlChangeEvent.value}\n`;
          break;
        case "pitchBend":
          const pitchBendEvent = event as MidiPitchBendEvent;
          logContent += `Pitch Bend - Ch: ${pitchBendEvent.channel}, Value: ${pitchBendEvent.value}\n`;
          break;
        default:
          // Log any other event types encountered
          logContent += `Unknown Event Type: ${(event as any).type} - ${JSON.stringify(event)}\n`;
      }
    }
    // Update track name in log header if found
    if (trackName !== `Track ${index}`) {
      logContent = logContent.replace(
        `Track ${index}:`,
        `Track ${index}: ${trackName}`
      );
    }
    logContent += "\n";
  });

  return logContent;
}
