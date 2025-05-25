import { FXP } from "../FXP";
import {
  extractBeforeSpace,
  getFileNameWithoutExtension,
} from "../StringUtils";
import { AbletonAutoPan } from "./AbletonAutoPan";
// Add imports for the new plugin classes
import { AbletonCompressor } from "./AbletonCompressor";
import { AbletonEq3 } from "./AbletonEq3";
import { AbletonEq8 } from "./AbletonEq8";
import { AbletonFunctions } from "./AbletonFunctions";
import { AbletonGlueCompressor } from "./AbletonGlueCompressor";
import { AbletonLimiter } from "./AbletonLimiter";
import { AbletonPresetFile } from "./AbletonPresetFile";
import { DataValues } from "./DataValues";
import { Log } from "./Log";
// Import MIDI functions
import {
  getAttr,
  getElementByPath,
  getInnerValueAsByteArray,
  getParam,
  getValue,
  parseXml,
  splitPath,
  toXmlString,
  validateXml,
} from "./XMLUtils";

export interface AbletonLiveContent {
  uniqueAudioClipList: Set<string>; // Holds unique audio clip names
  cvpj: any; // Holds the converted project data
  devicePresetFiles: AbletonPresetFile[]; // Holds the device presets
}

export class AbletonProject {
  // added another lookup table: automationTargetLookup
  // instead of the original code in DawVert which used inData as a full automation lookup object
  private static inData = new Map<number, any[]>();
  private static automationTargetLookup = new Map<number, any>();

  /** Adds a list of automation points (autoPointList) for a specific automation target ID */
  private static inAddPointList(id: number, autoPointList: any): void {
    // auto_id.py: def in_add_pl(i_id, i_autopl):
    if (!this.inData.has(id)) {
      // Initialize with an empty list if ID doesn't exist
      // no longer using the original code where the inData object is used for full automation lookup
      // using a separate lookup instead: automationTargetLookup
      // inData[id] = new List<dynamic?> { null, null, null, new List<dynamic>() }; // Original C# init before simplification
      this.inData.set(id, []);
    }
    const currentList = this.inData.get(id);
    // Ensure it's an array before pushing
    if (Array.isArray(currentList)) {
      currentList.push(autoPointList);
    } else {
      // Should not happen if initialized correctly, but handle defensively
      Log.Error(`inAddPointList: currentList for ID ${id} is not an array.`);
      this.inData.set(id, [autoPointList]); // Overwrite with a new list
    }
  }

  /** Adds automation data to the main cvpj structure */
  private static addPointList(
    cvpj: any,
    valType: string,
    autoLocation: string[], // e.g., ["track", "midi_123", "Track Name", "Parameter Path"]
    inAutoPoints: any[] // List of { position, duration, points } objects
  ): void {
    if (autoLocation && autoLocation.length > 0) {
      // Use DataValues helper to set nested properties
      DataValues.nestedDictAddValue(
        cvpj,
        ["automation", ...autoLocation, "type"], // Path: cvpj.automation.track.midi_123."Track Name"."Parameter Path".type
        valType
      );
      DataValues.nestedDictAddToList(
        cvpj,
        ["automation", ...autoLocation, "placements"], // Path: cvpj.automation.track.midi_123."Track Name"."Parameter Path".placements
        inAutoPoints
      );
    } else {
      Log.Warning("addPointList called with empty autoLocation.");
    }
  }

  /** Processes the collected automation data and adds it to the cvpj structure using the lookup table */
  private static inOutput(cvpj: any): void {
    // ------------------------ autoid to cvpjauto ------------------------
    for (const [id, outAutoData] of this.inData.entries()) {
      // no longer using the original code where the inData object is used for full automation lookup
      // using a separate lookup instead: automationTargetLookup
      // var outAutoLoc = inData[id][0];
      // var outAutoType = inData[id][1];
      // var outAutoAddMul = inData[id][2];
      // var outAutoData = inData[id][3];
      // if ((inData[id][0] != null || inData[id][1] != null || inData[id][2] != null) && outAutoData.Count > 0)
      // {
      //     if (outAutoAddMul != null)
      //     {
      //         outAutoData = AbletonFunctions.Multiply(outAutoData, outAutoAddMul[0], outAutoAddMul[1]);
      //     }
      //     AddPointList(cvpj, outAutoType, outAutoLoc, outAutoData);
      // }
      // var outAutoData = inData[id]; // Simplified C# logic
      if (outAutoData.length > 0) {
        // lookup the target
        const autoTarget = this.automationTargetLookup.get(id);
        if (autoTarget) {
          // string trackId = autoTarget.trackid; (Not directly used here)
          const trackName = autoTarget.trackname ?? "UnknownTrack";
          const fxLoc = autoTarget.loc ?? []; // e.g., ["master", "master_1"] or ["track", "midi_123"]
          // string[] fxLocDetails = autoTarget.details; (Not directly used here)
          const path = autoTarget.path ?? "UnknownPath"; // e.g., "Volume_Manual" or "PluginDevice_Param_12345"

          // AddPointList(cvpj, "float", fxLoc.Concat(new[] { trackName, path }).ToArray(), outAutoData);
          this.addPointList(
            cvpj,
            "float", // Assuming float type based on C# example
            [...fxLoc, trackName, path], // Combine location, track name, and parameter path
            outAutoData
          );
        } else {
          // ignore
          Log.Debug(`Automation target ID ${id} not found in lookup.`);
        }
      }
    }
  }

  /** Main function to parse Ableton Live XML content */
  public static handleAbletonLiveContent(
    xmlString: string,
    fileName: string, // Filename for context
    doList: boolean, // Not used in this simplified version
    doVerbose: boolean // Controls verbose logging
  ): AbletonLiveContent | null {
    // all credits go to SatyrDiamond and the DawVert code
    // https://raw.githubusercontent.com/SatyrDiamond/DawVert/main/plugin_input/r_ableton.py
    Log.Information(
      `Starting Ableton Live content processing for: ${fileName}`
    );
    // Clear static maps for fresh processing
    this.inData.clear();
    this.automationTargetLookup.clear();

    let rootXElement: any;
    try {
      // Basic validation check
      const validationResult = validateXml(xmlString);
      if (validationResult !== true) {
        // Log validation errors if needed: validationResult.err
        Log.Warning(
          `XML structure validation failed: ${validationResult.err?.msg}. Attempting to parse anyway.`
        );
      }
      rootXElement = parseXml(xmlString);
    } catch (error) {
      Log.Error(
        `XML Parsing Error: ${error instanceof Error ? error.message : error}`
      );
      return null;
    }

    const abletonRoot = rootXElement?.Ableton;
    if (!abletonRoot) {
      Log.Error("Root <Ableton> tag not found.");
      return null;
    }

    // Check Ableton version
    const abletonVersion = getAttr(abletonRoot, "MinorVersion", "").split(
      "."
    )[0];
    if (abletonVersion !== "11") {
      Log.Error(
        `Ableton version ${abletonVersion} is not supported. Only Ableton 11 is supported.`
      );
      return null;
    }

    const xLiveSet = abletonRoot.LiveSet;
    if (!xLiveSet) {
      Log.Error("<LiveSet> tag not found.");
      return null;
    }

    // initialize the color lists
    const colorlist = [
      "FF94A6",
      "FFA529",
      "CC9927",
      "F7F47C",
      "BFFB00",
      "1AFF2F",
      "25FFA8",
      "5CFFE8",
      "8BC5FF",
      "5480E4",
      "92A7FF",
      "D86CE4",
      "E553A0",
      "FFFFFF",
      "FF3636",
      "F66C03",
      "99724B",
      "FFF034",
      "87FF67",
      "3DC300",
      "00BFAF",
      "19E9FF",
      "10A4EE",
      "007DC0",
      "886CE4",
      "B677C6",
      "FF39D4",
      "D0D0D0",
      "E2675A",
      "FFA374",
      "D3AD71",
      "EDFFAE",
      "D2E498",
      "BAD074",
      "9BC48D",
      "D4FDE1",
      "CDF1F8",
      "B9C1E3",
      "CDBBE4",
      "AE98E5",
      "E5DCE1",
      "A9A9A9",
      "C6928B",
      "B78256",
      "99836A",
      "BFBA69",
      "A6BE00",
      "7DB04D",
      "88C2BA",
      "9BB3C4",
      "85A5C2",
      "8393CC",
      "A595B5",
      "BF9FBE",
      "BC7196",
      "7B7B7B",
      "AF3333",
      "A95131",
      "724F41",
      "DBC300",
      "85961F",
      "539F31",
      "0A9C8E",
      "236384",
      "1A2F96",
      "2F52A2",
      "624BAD",
      "A34BAD",
      "CC2E6E",
      "3C3C3C",
    ];
    const colorlistOne = colorlist.map(hex =>
      AbletonFunctions.hexToRgbDouble(hex)
    );

    // *****************
    // start reading
    // *****************
    // store in common daw project format (converted project)
    const cvpj: any = {
      track_master: {},
      parameters: {},
      track_data: new Map(), // Use Map for ordered iteration
      track_order: [],
      track_placements: new Map(), // Use Map for ordered iteration
      automation: {},
    };

    // Initialize the device data structure
    const devicePresetFiles: AbletonPresetFile[] = []; // Holds device preset files

    // --- Master Track Processing ---
    const xMasterTrack = xLiveSet.MasterTrack;
    if (xMasterTrack) {
      const xMasterTrackDeviceChain = xMasterTrack.DeviceChain;
      const xMasterTrackMixer = xMasterTrackDeviceChain?.Mixer;
      const xMasterTrackDeviceChainInside =
        xMasterTrackDeviceChain?.DeviceChain; // Nested DeviceChain
      const xMasterTrackTrackDevices = xMasterTrackDeviceChainInside?.Devices;

      // Process Master Track Devices
      if (xMasterTrackTrackDevices) {
        this.doDevices(
          abletonRoot, // Pass root for automation target path lookup
          xMasterTrackTrackDevices,
          ["LiveSet", "MasterTrack", "DeviceChain", "DeviceChain", "Devices"],
          null, // No trackId for master
          "Master",
          ["master", "master_1"], // Location identifier for master
          fileName,
          1, // Level 1
          devicePresetFiles,
          doVerbose
        );
      }

      // Get Master Track properties
      const mastertrackName = getValue(
        xMasterTrack.Name, // Pass the Name element itself
        "EffectiveName",
        "Master"
      );
      const mastertrackColorIndex = parseInt(
        getValue(xMasterTrack, "Color", "0") // Get Color directly from MasterTrack
      );
      const mastertrackColor = colorlistOne[mastertrackColorIndex] ?? [
        1.0,
        1.0,
        1.0, // Default white
      ];

      // Get parameters using the helper
      const masTrackVol = getParam(
        xMasterTrackMixer, // Source element
        "Volume", // Parameter name
        "float", // Type
        "0.85" // Default value (as string)
      );
      const masTrackPan = getParam(xMasterTrackMixer, "Pan", "float", "0.0");
      const tempo = getParam(xMasterTrackMixer, "Tempo", "float", "120.0");

      if (doVerbose)
        Log.Debug(
          `Tempo: ${tempo} bpm, MasterTrackName: ${mastertrackName}, Volume: ${masTrackVol}, Pan: ${masTrackPan}`
        );

      // Populate cvpj structure
      cvpj.track_master = {
        name: mastertrackName,
        color: mastertrackColor,
        parameters: {
          pan: { name: "Pan", type: "float", value: masTrackPan },
          vol: { name: "Volume", type: "float", value: masTrackVol },
        },
      };
      cvpj.parameters.bpm = { name: "Tempo", type: "float", value: tempo };

      // Process Master Track Automation
      this.getAuto(xMasterTrack);
    } else {
      Log.Error("MasterTrack not found in LiveSet. Using defaults.");
      // Provide default master track info if not found
      cvpj.track_master = {
        name: "Master",
        color: [1.0, 1.0, 1.0],
        parameters: {
          pan: { name: "Pan", type: "float", value: 0.0 },
          vol: { name: "Volume", type: "float", value: 0.85 },
        },
      };
      cvpj.parameters.bpm = { name: "Tempo", type: "float", value: 120.0 };
    }

    // --- Tracks Processing ---
    const xTracks = xLiveSet.Tracks;
    const uniqueAudioClipList = new Set<string>();
    let returnId = 1; // Counter for return tracks

    // Consolidate track elements from different types (Midi, Audio, Group, Return)

    /** Holds every track with its tag‑name (`type`) and 0‑based `index`. */
    interface TrackInfo {
      type: string; // "MidiTrack" | "AudioTrack" | ...
      index: number; // position among siblings with the same tag
      element: any; // the actual XML node
    }
    const trackElements: TrackInfo[] = [];

    const trackTypes = ["MidiTrack", "AudioTrack", "GroupTrack", "ReturnTrack"];

    if (xTracks) {
      trackTypes.forEach(type => {
        const group = xTracks[type];
        if (!group) return;

        // Ensure we always work with an array
        const arr = Array.isArray(group) ? group : [group];

        arr.forEach((t, idx) => {
          if (typeof t === "object" && t !== null) {
            trackElements.push({ type, index: idx, element: t });
          }
        });
      });
    }

    // Read Tracks
    if (doVerbose) Log.Debug(`Found ${trackElements.length} Tracks ...`);

    for (const {
      type: trackType,
      index: trackIndex,
      element: xTrackData,
    } of trackElements) {
      if (!xTrackData) continue; // Skip null/undefined elements

      const trackId = getAttr(xTrackData, "Id", "");
      if (!trackId) {
        Log.Warning("Skipping track with missing Id attribute.");
        continue; // Skip tracks without an ID
      }

      const xTrackDeviceChain = xTrackData.DeviceChain;
      const xTrackMixer = xTrackDeviceChain?.Mixer;
      const trackName = getValue(
        xTrackData.Name,
        "EffectiveName",
        `Track ${trackId}` // Default name
      );
      const trackColorIndex = parseInt(getValue(xTrackData, "Color", "0"));
      const trackColor = colorlistOne[trackColorIndex] ?? [0.8, 0.8, 0.8]; // Default grey
      const trackInsideGroup = getValue(xTrackData, "TrackGroupId", "-1"); // Check if track is grouped

      let fxLoc: string[] = []; // Location identifier for devices/automation
      let trackData: any = {}; // Data for cvpj.track_data
      let trackPlacementData: any = {}; // Data for cvpj.track_placements

      const deviceChain = xTrackData?.DeviceChain;
      const mainSequencer = deviceChain?.MainSequencer;
      const clipTimeable = mainSequencer?.ClipTimeable;
      const arrangerAutomation = clipTimeable?.ArrangerAutomation;
      const events = arrangerAutomation?.Events;

      // Get common track parameters
      const trackVol = getParam(xTrackMixer, "Volume", "float", "0.85");
      const trackPan = getParam(xTrackMixer, "Pan", "float", "0.0");

      // --- Process based on determined Track Type ---
      switch (trackType) {
        case "MidiTrack": {
          const midiTrackId = `midi_${trackId}`;
          fxLoc = ["track", midiTrackId];
          if (doVerbose)
            Log.Debug(
              `Reading MIDI Track. Id: ${trackId}, Index: ${trackIndex}, Name: ${trackName}, Volume: ${trackVol}, Pan: ${trackPan}`
            );

          trackData = {
            type: "instrument",
            name: trackName,
            color: trackColor,
            parameters: {
              pan: { name: "Pan", type: "float", value: trackPan },
              vol: { name: "Volume", type: "float", value: trackVol },
            },
          };
          if (trackInsideGroup !== "-1") {
            trackData.group = `group_${trackInsideGroup}`;
          }
          cvpj.track_data.set(midiTrackId, trackData); // use set to retain order, originally midiTrackId
          cvpj.track_order.push(midiTrackId);

          // Process MIDI Clips
          const xTrackMidiClipsSource = events?.MidiClip;

          // Ensure it's an array for iteration
          const xTrackMidiClips = xTrackMidiClipsSource
            ? Array.isArray(xTrackMidiClipsSource)
              ? xTrackMidiClipsSource
              : [xTrackMidiClipsSource]
            : [];
          const notesList: any[] = []; // Holds processed note placements

          for (const xTrackMidiClip of xTrackMidiClips) {
            if (!xTrackMidiClip || typeof xTrackMidiClip !== "object") continue;

            // Get clip properties
            const notePlacementPos = parseFloat(
              getValue(xTrackMidiClip, "CurrentStart", "0")
            );
            const notePlacementEnd = parseFloat(
              getValue(xTrackMidiClip, "CurrentEnd", "0")
            );
            const notePlacementName = getValue(xTrackMidiClip, "Name", "");
            const notePlacementColorIndex = parseInt(
              getValue(xTrackMidiClip, "Color", "0")
            );
            const notePlacementColor =
              colorlistOne[notePlacementColorIndex] ?? trackColor; // Fallback to track color
            const notePlacementMuted =
              getValue(
                xTrackMidiClip,
                "Disabled", // Note: C# uses "Disabled", TS used "Disabled" - verify XML source if issues
                "false"
              ).toLowerCase() === "true";

            if (doVerbose)
              Log.Debug(
                `Reading MidiClip. Start: ${notePlacementPos}, End: ${notePlacementEnd}, Name: ${notePlacementName}`
              );

            // Create placement object (using beats, * 4)
            const notePlacement: any = {
              position: notePlacementPos * 4,
              duration: (notePlacementEnd - notePlacementPos) * 4,
              name: notePlacementName,
              color: notePlacementColor,
              muted: notePlacementMuted,
              notelist: [], // Initialize empty note list
            };

            // Process Loop info
            const xTrackMidiClipLoop = xTrackMidiClip?.Loop;
            if (xTrackMidiClipLoop && typeof xTrackMidiClipLoop === "object") {
              const loopLStart = parseFloat(
                getValue(xTrackMidiClipLoop, "LoopStart", "0")
              );
              const loopLEnd = parseFloat(
                getValue(xTrackMidiClipLoop, "LoopEnd", "1") // Default loop end is 1 beat
              );
              const loopStartRel = parseFloat(
                getValue(xTrackMidiClipLoop, "StartRelative", "0")
              );
              const loopOn =
                getValue(
                  xTrackMidiClipLoop,
                  "LoopOn",
                  "false"
                ).toLowerCase() === "true";

              if (doVerbose)
                Log.Debug(
                  `Reading MidiLoop. LoopStart: ${loopLStart}, LoopEnd: ${loopLEnd}, StartRelative: ${loopStartRel}, LoopOn: ${loopOn}`
                );

              // Add cut/loop data based on loop status
              if (loopOn) {
                notePlacement.cut = AbletonFunctions.cutLoopData(
                  loopStartRel * 4, // Convert to beats
                  loopLStart * 4,
                  loopLEnd * 4
                );
              } else {
                notePlacement.cut = {
                  type: "cut",
                  start: loopLStart * 4,
                  end: loopLEnd * 4,
                };
              }
            }

            // Process Notes within the clip
            const notes = new Map<number, any>(); // Use Map for note ID lookup
            const xTrackMidiClipNotes = xTrackMidiClip?.Notes;
            const xTrackMidiClipKT = xTrackMidiClipNotes?.KeyTracks;
            const keyTracksSource = xTrackMidiClipKT?.KeyTrack;

            // Ensure array for iteration
            const keyTracks = keyTracksSource
              ? Array.isArray(keyTracksSource)
                ? keyTracksSource
                : [keyTracksSource]
              : [];

            if (doVerbose) Log.Debug(`Found ${keyTracks.length} KeyTracks ...`);

            for (const xTrackMidiClipKTKTs of keyTracks) {
              if (
                !xTrackMidiClipKTKTs ||
                typeof xTrackMidiClipKTKTs !== "object"
              )
                continue;
              // Get MIDI key for this track
              const midiKey = parseInt(
                getValue(xTrackMidiClipKTKTs, "MidiKey", "60") // Default C4
              );
              const abletonNoteKey = midiKey - 60;

              // Process individual note events
              const xTrackMidiClipKT_KT_Notes = xTrackMidiClipKTKTs?.Notes;
              const midiNoteEventsSource =
                xTrackMidiClipKT_KT_Notes?.MidiNoteEvent;
              // Ensure array
              const midiNoteEvents = midiNoteEventsSource
                ? Array.isArray(midiNoteEventsSource)
                  ? midiNoteEventsSource
                  : [midiNoteEventsSource]
                : [];

              for (const xTrackMidiClipMNE of midiNoteEvents) {
                if (!xTrackMidiClipMNE || typeof xTrackMidiClipMNE !== "object")
                  continue;

                // Get note attributes using getAttr
                const noteTime = parseFloat(
                  getAttr(xTrackMidiClipMNE, "Time", "0")
                );
                const noteDuration = parseFloat(
                  getAttr(xTrackMidiClipMNE, "Duration", "0")
                );
                const noteVelocity = parseFloat(
                  getAttr(xTrackMidiClipMNE, "Velocity", "100") // Default velocity 100
                );
                const noteOffVelocity = parseFloat(
                  getAttr(xTrackMidiClipMNE, "OffVelocity", "64") // Default off velocity 64
                );
                const noteProbability = parseFloat(
                  getAttr(xTrackMidiClipMNE, "Probability", "1") // Default probability 1
                );
                const noteIsEnabled =
                  getAttr(
                    xTrackMidiClipMNE,
                    "IsEnabled",
                    "true"
                  ).toLowerCase() === "true";
                const noteId = parseInt(
                  getAttr(xTrackMidiClipMNE, "NoteId", "0") // Get NoteId attribute
                );
                // Store note data if ID is valid
                if (noteId > 0) {
                  const noteData = {
                    key: abletonNoteKey,
                    position: noteTime * 4, // Convert to beats
                    duration: noteDuration * 4,
                    vol: noteVelocity / 100.0, // Normalize velocity (0-1)
                    off_vol: noteOffVelocity / 100.0, // Normalize off velocity
                    probability: noteProbability,
                    enabled: noteIsEnabled,
                    // 'notemod' for pitch bend is processed later
                  };
                  notes.set(noteId, noteData); // Store by NoteId
                }
              }
            }

            // Process Per-Note Events (e.g., pitch bend)
            const xTrackMidiClipNES = xTrackMidiClipNotes?.PerNoteEventStore;
            const xTrackMidiClipNES_EL = xTrackMidiClipNES?.EventLists;
            const perNoteEventsSource = xTrackMidiClipNES_EL?.PerNoteEventList;
            // Ensure array
            const perNoteEvents = perNoteEventsSource
              ? Array.isArray(perNoteEventsSource)
                ? perNoteEventsSource
                : [perNoteEventsSource]
              : [];

            for (const xNoteNEvent of perNoteEvents) {
              if (!xNoteNEvent || typeof xNoteNEvent !== "object") continue;
              const autoNoteId = parseInt(getAttr(xNoteNEvent, "NoteId", "0"));
              const autoNoteCC = parseInt(getAttr(xNoteNEvent, "CC", "0"));
              const note = notes.get(autoNoteId); // Find the corresponding note

              // Process pitch bend (CC == -2)
              if (note && autoNoteCC === -2) {
                // Initialize notemod structure if needed
                if (!note.notemod) note.notemod = {};
                if (!note.notemod.auto) note.notemod.auto = {};
                note.notemod.auto.pitch = []; // Initialize pitch bend point list

                const xNoteNEvent_EV = xNoteNEvent?.Events;
                const abletonPointsSource = xNoteNEvent_EV?.PerNoteEvent;
                // Ensure array
                const abletonPoints = abletonPointsSource
                  ? Array.isArray(abletonPointsSource)
                    ? abletonPointsSource
                    : [abletonPointsSource]
                  : [];

                // Add pitch bend points
                for (const abletonPoint of abletonPoints) {
                  if (!abletonPoint || typeof abletonPoint !== "object")
                    continue;
                  const apPos = parseFloat(
                    getAttr(abletonPoint, "TimeOffset", "0")
                  );
                  const apVal = parseFloat(getAttr(abletonPoint, "Value", "0"));
                  note.notemod.auto.pitch.push({
                    position: apPos * 4, // Convert to beats
                    value: apVal / 170.0, // Normalize pitch bend value (specific to Ableton?)
                  });
                }
              }
              // Add handling for other CC values if needed
            }

            // Add the processed notes to the placement
            notePlacement.notelist = Array.from(notes.values()); // Convert Map values to array
            // Only add placement if it contains notes
            if (notePlacement.notelist.length > 0) {
              notesList.push(notePlacement);
            }
          }

          // Add notes data to track placements if any notes were found
          if (notesList.length > 0) {
            trackPlacementData = { notes: notesList };
          }
          break; // End MidiTrack case
        }
        case "AudioTrack": {
          const audioTrackId = `audio_${trackId}`;
          fxLoc = ["track", audioTrackId];
          if (doVerbose)
            Log.Debug(
              `Reading Audio Track. Id: ${trackId}, Index: ${trackIndex}, Name: ${trackName}, Volume: ${trackVol}, Pan: ${trackPan}`
            );

          trackData = {
            type: "audio",
            name: trackName,
            color: trackColor,
            parameters: {
              pan: { name: "Pan", type: "float", value: trackPan },
              vol: { name: "Volume", type: "float", value: trackVol },
            },
          };
          if (trackInsideGroup !== "-1") {
            trackData.group = `group_${trackInsideGroup}`;
          }
          // add the audio track data to cvpj (disabled for now)
          // cvpj.track_data.set(audioTrackId, trackData); // use set to retain order, originally audioTrackId
          // cvpj.track_order.push(audioTrackId);

          // Process Audio Clips (mainly for collecting unique file paths)
          const audioClipsSource = events?.AudioClip;
          // Ensure array
          const xAudioClips = audioClipsSource
            ? Array.isArray(audioClipsSource)
              ? audioClipsSource
              : [audioClipsSource]
            : [];

          for (const xAudioClip of xAudioClips) {
            if (!xAudioClip || typeof xAudioClip !== "object") continue;

            // Only process non-frozen clips (heuristic based on C#)
            const freezeStart = parseFloat(
              getValue(xAudioClip, "FreezeStart", "0")
            );
            const freezeEnd = parseFloat(
              getValue(xAudioClip, "FreezeEnd", "0")
            );

            if (freezeStart === 0 && freezeEnd === 0) {
              const sampleRef = xAudioClip?.SampleRef;
              const fileRef = sampleRef?.FileRef;
              // Get relative path if available
              const relativePath = fileRef
                ? getValue(fileRef, "RelativePath", "")
                : "";
              if (relativePath) {
                uniqueAudioClipList.add(relativePath); // Add to set for uniqueness
              }
            }
          }
          // Initialize placement data for audio tracks (can be extended later)
          // trackPlacementData = { audio: [] };
          break; // End AudioTrack case
        }
        case "ReturnTrack": {
          const returnTrackId = `return_${returnId}`; // Use counter for unique ID
          fxLoc = ["return", returnTrackId];
          if (doVerbose)
            Log.Debug(
              `Reading Return Track. Id: ${trackId}, Index: ${trackIndex}, Name: ${trackName}, Volume: ${trackVol}, Pan: ${trackPan}`
            );

          trackData = {
            type: "return",
            name: trackName,
            color: trackColor,
            parameters: {
              pan: { name: "Pan", type: "float", value: trackPan },
              vol: { name: "Volume", type: "float", value: trackVol },
            },
          };
          // Return tracks cannot be grouped in Ableton, so no group check needed

          // add the return track data to cvpj (disabled for now)
          // cvpj.track_data.set(returnTrackId, trackData); // use set to retain order, originally returnTrackId
          // cvpj.track_order.push(returnTrackId);

          returnId++; // Increment return track counter

          // No placement data typically associated with return tracks initially
          break; // End ReturnTrack case
        }
        case "GroupTrack": {
          const groupTrackId = `group_${trackId}`;
          fxLoc = ["group", groupTrackId];
          if (doVerbose)
            Log.Debug(
              `Reading Group Track. Id: ${trackId}, Index: ${trackIndex}, Name: ${trackName}, Volume: ${trackVol}, Pan: ${trackPan}`
            );

          trackData = {
            type: "group",
            name: trackName,
            color: trackColor,
            parameters: {
              pan: { name: "Pan", type: "float", value: trackPan },
              vol: { name: "Volume", type: "float", value: trackVol },
            },
          };
          if (trackInsideGroup !== "-1") {
            // Nested groups
            trackData.group = `group_${trackInsideGroup}`;
          }
          // add the group track data to cvpj (disabled for now)
          // cvpj.track_data.set(groupTrackId, trackData); // use set to retain order, originally groupTrackId
          // cvpj.track_order.push(groupTrackId);

          // No placement data typically associated with group tracks initially
          break; // End GroupTrack case
        }
        // default: {
        //   Log.Warning(
        //     `Encountered unknown track type for track ID ${trackId}, Name: ${trackName}. Skipping specific processing.`
        //   );
        //   // Basic track data might still be useful
        //   const unknownTrackId = `unknown_${trackId}`;
        //   fxLoc = ["unknown", unknownTrackId];
        //   trackData = {
        //     type: "unknown",
        //     name: trackName,
        //     color: trackColor,
        //     parameters: {
        //       pan: { name: "Pan", type: "float", value: trackPan },
        //       vol: { name: "Volume", type: "float", value: trackVol },
        //     },
        //   };
        //   if (trackInsideGroup !== "-1") {
        //     trackData.group = `group_${trackInsideGroup}`;
        //   }
        //   // add the unknown track data to cvpj
        //   cvpj.track_data.set(unknownTrackId, trackData); // use set to retain order, originally unknownTrackId
        //   cvpj.track_order.push(unknownTrackId); // original unknownTrackId

        //   break;
        // }
      } // End switch (trackType)

      // Add placement data if it was generated
      if (Object.keys(trackPlacementData).length > 0) {
        const currentTrackId = fxLoc[1]; // Get the generated ID (e.g., midi_123)
        if (currentTrackId) {
          cvpj.track_placements.set(currentTrackId, trackPlacementData); // use set to retain order
        } else {
          Log.Warning(
            `Could not add placement data for track ${trackName} (ID: ${currentTrackId}) due to missing track ID.`
          );
        }
      }

      // Process Devices and Automation for this track if fxLoc was set
      if (fxLoc.length > 0) {
        this.getAuto(xTrackData); // Process track-level automation envelopes

        // Process devices within the track's device chain
        const xTrackDeviceChainInside = xTrackDeviceChain?.DeviceChain; // Nested DeviceChain
        const xTrackDevices = xTrackDeviceChainInside?.Devices;
        if (xTrackDevices) {
          this.doDevices(
            abletonRoot,
            xTrackDevices,
            [
              "LiveSet",
              "Tracks",
              `${trackType}[${trackIndex + 1}]`,
              "DeviceChain",
              "DeviceChain",
              "Devices",
            ],
            trackId, // Original Ableton ID
            trackName,
            fxLoc, // Location identifier (e.g., ["track", "midi_123"])
            fileName,
            1, // Start at level 1 for track devices
            devicePresetFiles,
            doVerbose
          );
        }
      }
    } // End for loop over trackElements

    // --- Final Steps ---
    this.inOutput(cvpj); // Process collected automation data
    this.compat(cvpj); // Apply compatibility fixes (loop/cut removal)

    Log.Information(
      "AbletonProject.handleAbletonLiveContent: Parsing completed."
    );

    // Convert Maps to plain objects for JSON serialization
    const jsonCompatibleCvpj = {
      ...cvpj, // Copy existing properties
      track_data: Object.fromEntries(cvpj.track_data.entries()),
      track_placements: Object.fromEntries(cvpj.track_placements.entries()),
    };

    return {
      uniqueAudioClipList,
      cvpj: jsonCompatibleCvpj,
      devicePresetFiles,
    } as AbletonLiveContent;
  }

  /** Processes automation envelopes within a track or master track */
  private static getAuto(xTrackData: any): void {
    // Navigate to AutomationEnvelope elements
    const autoEnvelopes = xTrackData?.AutomationEnvelopes?.Envelopes;
    const automationEnvelopesSource = autoEnvelopes?.AutomationEnvelope;

    // Ensure array
    const automationEnvelopes = automationEnvelopesSource
      ? Array.isArray(automationEnvelopesSource)
        ? automationEnvelopesSource
        : [automationEnvelopesSource]
      : [];

    for (const automationEnvelope of automationEnvelopes) {
      if (!automationEnvelope || typeof automationEnvelope !== "object")
        continue;

      const envEnvelopeTarget = automationEnvelope.EnvelopeTarget;
      const envAutomation = automationEnvelope.Automation;
      const envAutoEvents = envAutomation?.Events;

      // Get the target ID for this envelope
      const autoTargetIdStr = getValue(
        envEnvelopeTarget,
        "PointeeId", // The ID of the parameter being automated
        "-1"
      );
      const autoTarget = parseInt(autoTargetIdStr, 10);
      // Skip if ID is invalid
      if (isNaN(autoTarget) || autoTarget <= 0) continue;

      const cvpjAutoPoints: any[] = []; // Temporary list for points in this envelope

      // Process FloatEvents
      const floatEventsSource = envAutoEvents?.FloatEvent;
      const floatEvents = floatEventsSource
        ? Array.isArray(floatEventsSource)
          ? floatEventsSource
          : [floatEventsSource]
        : [];

      for (const envAutoEvent of floatEvents) {
        if (!envAutoEvent || typeof envAutoEvent !== "object") continue;
        const timeStr = getAttr(envAutoEvent, "Time", "0");
        const valueStr = getAttr(envAutoEvent, "Value", "0");
        cvpjAutoPoints.push({
          position: Math.max(0, parseFloat(timeStr) * 4), // Convert to beats, ensure non-negative
          value: parseFloat(valueStr),
        });
      }

      // Process BoolEvents (convert boolean to float 0.0 or 1.0)
      const boolEventsSource = envAutoEvents?.BoolEvent;
      const boolEvents = boolEventsSource
        ? Array.isArray(boolEventsSource)
          ? boolEventsSource
          : [boolEventsSource]
        : [];

      for (const envAutoEvent of boolEvents) {
        if (!envAutoEvent || typeof envAutoEvent !== "object") continue;
        const timeStr = getAttr(envAutoEvent, "Time", "0");
        const valueStr = getAttr(envAutoEvent, "Value", "false"); // Default false
        cvpjAutoPoints.push({
          position: Math.max(0, parseFloat(timeStr) * 4),
          value: valueStr.toLowerCase() === "true" ? 1.0 : 0.0, // Convert bool to float
        });
      }
      // Add other event types (EnumEvent, etc.) if needed

      // If points were found, sort them and add to the main automation data store
      if (cvpjAutoPoints.length > 0) {
        // Sort points by position (important for processing later)
        cvpjAutoPoints.sort((a, b) => a.position - b.position);
        // Convert the raw points list into a structured PointList object
        this.inAddPointList(
          autoTarget, // The ID of the parameter
          AbletonFunctions.toPointList(cvpjAutoPoints) // Create { position, duration, points } structure
        );
      }
    }
  }

  /** Finds AutomationTarget elements within a device and adds them to the lookup table */
  private static addAutomationTargets(
    rootXElement: any, // Root needed for XPath-like lookup
    xDevice: any, // The device element (e.g., Eq8, PluginDevice) being processed
    xDevicePath: string[], // full path to the xDevice
    trackId: string | null, // Ableton track ID
    trackName: string | null, // Track name
    fxLoc: string[], // Location identifier (e.g., ["track", "midi_123"])
    fxLocDetails: string[] // Device type and ID (e.g., ["Eq8", "5"])
  ): void {
    /**
     * Recursively finds every `<AutomationTarget>` beneath `element` and returns:
     *   • its numeric **Id** (taken from `@_Id`), and
     *   • a **fully qualified XPath‑compatible path** whose segments include a
     *     1‑based index (`[n]`) whenever siblings share the same name.
     *
     * The resulting path uniquely identifies each AutomationTarget—e.g.
     * `"DeviceChain/Devices[3]/PluginDevice/AutomationTarget[2]"`.
     *
     * @param element      Any Fast‑XML‑Parser node (object or array).
     * @param currentPath  Path segments accumulated so far.
     * @returns            Array of `{ id, path }` objects.
     */
    function findAutomationTargets(
      element: unknown,
      currentPath: string[] = []
    ): { id: number; path: string[] }[] {
      if (element === null || typeof element !== "object") return [];

      /* ────────── ARRAY ────────── */
      if (Array.isArray(element)) {
        const parentPath = currentPath.slice(0, -1);
        const key = currentPath.at(-1) ?? "";

        // Recurse on each item, decorating the parent key with a 1‑based index
        return element.flatMap((item, idx) =>
          findAutomationTargets(item, [...parentPath, `${key}[${idx + 1}]`])
        );
      }

      /* ────────── OBJECT ───────── */
      const obj = element as Record<string, unknown>;
      const results: { id: number; path: string[] }[] = [];

      // Build a quick sibling count map to know when an index is needed
      const siblingCounts: Record<string, number> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (k.startsWith("@_")) continue;
        siblingCounts[k] = Array.isArray(v) ? v.length : 1;
      }

      for (const [key, val] of Object.entries(obj)) {
        if (key.startsWith("@_")) continue; // ignore attributes

        const children = Array.isArray(val) ? val : [val];
        const needIdx = siblingCounts[key] > 1;

        children.forEach((child, idx) => {
          const seg = needIdx ? `${key}[${idx + 1}]` : key;
          const path = [...currentPath, seg];

          if (
            key === "AutomationTarget" &&
            child &&
            typeof child === "object"
          ) {
            const id = Number((child as Record<string, unknown>)["@_Id"] ?? 0);
            if (id > 0) {
              results.push({ id, path });
            }
            // no need to look inside AutomationTarget itself
          } else if (child && typeof child === "object") {
            results.push(...findAutomationTargets(child, path));
          }
        });
      }
      return results;
    }

    // Start the search from the device element
    // Pass only the device details as the starting path for the parameter name
    const automationTargets = findAutomationTargets(xDevice, xDevicePath);

    // Process found targets
    for (const targetInfo of automationTargets) {
      const autoNumId = targetInfo.id;

      // Get path elements
      // "Ableton/LiveSet/Tracks/GroupTrack/DeviceChain/DeviceChain/Devices/AudioEffectGroupDevice/Branches/AudioEffectBranch/DeviceChain/AudioToAudioDeviceChain/Devices/AutoFilter/Cutoff/AutomationTarget"
      // "Ableton/LiveSet/Tracks/GroupTrack/DeviceChain/DeviceChain/Devices/AudioEffectGroupDevice/Branches/AudioEffectBranch/DeviceChain/AudioToAudioDeviceChain/Devices/PluginDevice/ParameterList/PluginFloatParameter/ParameterValue/AutomationTarget"
      // Example path: ["AudioEffectGroupDevice","On","AutomationTarget"];
      // Example path: ["AudioEffectGroupDevice","Branches","AudioEffectBranch","DeviceChain","AudioToAudioDeviceChain","Devices","PluginDevice","On","AutomationTarget"];
      // Example path: ["AudioEffectGroupDevice","Branches","AudioEffectBranch","DeviceChain","AudioToAudioDeviceChain","Devices","PluginDevice","ParameterList","PluginFloatParameter","ParameterValue","AutomationTarget"];

      const paths = splitPath(targetInfo.path, "Devices", "AutomationTarget");

      // Replace / with _
      let parameterPath = paths.after.join("_");

      if (paths.after[0].startsWith("PluginDevice")) {
        // lookup VST Plugin Name using the path
        const lookupXPath = [...paths.before, "Devices", paths.after[0]].join(
          "/"
        );

        // Use getElementByPath with the full path
        const xFoundElement = getElementByPath(rootXElement, lookupXPath);
        if (xFoundElement != null) {
          // lookup VST Plugin Name using the path
          const pluginDesc = xFoundElement?.PluginDesc;
          const vstPluginInfo = pluginDesc?.VstPluginInfo;
          const vstPlugName = vstPluginInfo
            ? getValue(vstPluginInfo, "PlugName", "")
            : "";

          parameterPath = `${vstPlugName}`;
        }
      }

      // add
      // Create the target object to store in the lookup map
      const autoTarget = {
        trackid: trackId,
        trackname: trackName,
        loc: fxLoc, // Store the track/master location
        details: fxLocDetails, // Store device type/id
        path: parameterPath,
      };

      // Add to lookup table if not already present
      if (!this.automationTargetLookup.has(autoNumId)) {
        this.automationTargetLookup.set(autoNumId, autoTarget);
      } else {
        // Optional: Log or handle cases where an ID might be duplicated
        // Log.Warning(`Automation target ID ${autoNumId} already exists in lookup.`);
      }
    }
  }

  /** Processes devices within a track or device group */
  public static doDevices(
    rootXElement: any, // Root element for context (e.g., automation target lookup)
    xTrackDevicesSource: any, // The <Devices> element or array of device elements
    xTrackDevicesSourcePath: string[], // Full path to the xTrackDevicesSource
    trackId: string | null, // Original Ableton track ID
    trackName: string | null, // Name of the track
    fxLoc: string[], // Location identifier (e.g., ["track", "midi_123"])
    fileName: string, // Original filename for context
    level: number = 1, // Recursion level for groups
    devicePresetFiles: AbletonPresetFile[],
    doVerbose?: boolean
  ): void {
    // Path for MasterTrack: Ableton/LiveSet/MasterTrack/DeviceChain/DeviceChain/Devices/*
    // Path for Tracks: Ableton/LiveSet/Tracks/[Audio|Group|Midi]Track/DeviceChain/DeviceChain/Devices/*
    // where * is internal plugins like <Eq8>, <Limiter>
    // as well as <PluginDevice Id="X"> elements

    // or * can be a whole new group of effects AudioEffectGroupDevice
    // ../AudioEffectGroupDevice/Branches/AudioEffectBranch/DeviceChain/AudioToAudioDeviceChain/Devices/*
    // where * is plugins as well as another AudioEffectGroupDevice with same recursive behaviour
    // Ensure xTrackDevicesSource is a valid object (the parsed <Devices> element)
    if (
      !xTrackDevicesSource ||
      typeof xTrackDevicesSource !== "object" ||
      Array.isArray(xTrackDevicesSource)
    ) {
      if (doVerbose)
        Log.Debug(
          `doDevices: Invalid or empty <Devices> element provided at level ${level}.`
        );
      return; // Exit if input is not the expected <Devices> object
    }

    const devicesObject = xTrackDevicesSource; // Rename for clarity

    if (doVerbose) {
      const deviceTypeCount = Object.keys(devicesObject).filter(
        key => !key.startsWith("@_")
      ).length;
      Log.Debug(
        `Found ${deviceTypeCount} device types within <Devices> element for track: ${trackName ?? "Master"} ${trackId ?? ""} ${level > 1 ? `[Group Level ${level}]` : ""}`
      );
    }

    const fileNameNoExtension = getFileNameWithoutExtension(fileName);

    let internalDeviceCount = 0; // Counter for individual device instances

    // Iterate over the keys (device types) within the <Devices> object
    for (const deviceType in devicesObject) {
      // Skip attributes and other non-element properties
      if (
        deviceType.startsWith("@_") ||
        typeof devicesObject[deviceType] !== "object" ||
        devicesObject[deviceType] === null
      ) {
        continue;
      }

      const deviceValue = devicesObject[deviceType];

      // Ensure deviceValue is treated as an array for consistent iteration
      const deviceElements = Array.isArray(deviceValue)
        ? deviceValue
        : [deviceValue];

      for (const deviceElement of deviceElements) {
        // deviceElement is now the actual parsed object for a single device instance

        internalDeviceCount++; // Increment for each actual device instance

        const deviceId = getAttr(deviceElement, "Id", "0");
        // this is set in .adv preset files
        const userName = getValue(deviceElement.UserName, "EffectiveName", ""); // Get UserName if present

        // check if it's on
        const onElement = deviceElement?.On;
        // Default to true if 'On' element is missing? Ableton default is On. C# defaults to false. Let's default to true.
        const isOn = onElement
          ? getValue(onElement, "Manual", "true").toLowerCase() === "true"
          : true; // Default to true if 'On' element is missing

        if (!isOn) {
          if (doVerbose)
            Log.Debug(
              `Skipping device ${internalDeviceCount} '${deviceType}' @ level ${level} (id: ${deviceId}) - Disabled`
            );
          continue; // Skip disabled devices
        } else {
          if (doVerbose)
            Log.Debug(
              `Processing device ${internalDeviceCount} '${deviceType}' @ level ${level} (id: ${deviceId}) ...`
            );
        }

        const deviceElementPath: string[] = [
          ...xTrackDevicesSourcePath,
          deviceType,
        ];

        // Add automation targets found within this device
        this.addAutomationTargets(
          rootXElement,
          deviceElement, // Pass the actual device element
          deviceElementPath, // Pass the full path to the deviceElement
          trackId, // Original Ableton ID
          trackName, // Name of the track
          fxLoc, // Location identifier (e.g., ["track", "midi_123"])
          [deviceType, deviceId] // Pass device type and ID,
        );

        // --- Process Specific Device Types ---
        switch (deviceType) {
          case "FilterEQ3": {
            Log.Information(`Processing ${deviceType}`);

            const eq3 = new AbletonEq3(deviceElement);

            // Only add if modified
            if (eq3.hasBeenModified()) {
              const outputFileNameBase = `${fileNameNoExtension} - ${trackName ?? "Master"} - (${level}-${internalDeviceCount}) - ${deviceType}`;
              devicePresetFiles.push(
                new AbletonPresetFile({
                  filename: outputFileNameBase,
                  format: "text",
                  content: eq3.toString(),
                  pluginName: eq3.constructor.name,
                })
              );
            }

            break;
          }
          case "Eq8": {
            Log.Information(`Processing ${deviceType}`);

            const eq8 = new AbletonEq8(deviceElement);

            // Only add if modified
            if (eq8.hasBeenModified()) {
              const outputFileNameBase = `${fileNameNoExtension} - ${trackName ?? "Master"} - (${level}-${internalDeviceCount}) - ${deviceType}`;
              devicePresetFiles.push(
                new AbletonPresetFile({
                  filename: outputFileNameBase,
                  format: "text",
                  content: eq8.toString(),
                  pluginName: eq8.constructor.name,
                })
              );
            }

            break;
          }
          case "Compressor2": {
            Log.Information(`Processing ${deviceType}`);

            const compressor = new AbletonCompressor(deviceElement);

            // Only add if modified
            if (compressor.hasBeenModified()) {
              const outputFileNameBase = `${fileNameNoExtension} - ${trackName ?? "Master"} - (${level}-${internalDeviceCount}) - ${deviceType}`;
              devicePresetFiles.push(
                new AbletonPresetFile({
                  filename: outputFileNameBase,
                  format: "text",
                  content: compressor.toString(),
                  pluginName: compressor.constructor.name,
                })
              );
            }

            break;
          }
          case "GlueCompressor": {
            Log.Information(`Processing ${deviceType}`);

            const glueCompressor = new AbletonGlueCompressor(deviceElement);

            // Only add if modified
            if (glueCompressor.hasBeenModified()) {
              const outputFileNameBase = `${fileNameNoExtension} - ${trackName ?? "Master"} - (${level}-${internalDeviceCount}) - ${deviceType}`;
              devicePresetFiles.push(
                new AbletonPresetFile({
                  filename: outputFileNameBase,
                  format: "text",
                  content: glueCompressor.toString(),
                  pluginName: glueCompressor.constructor.name,
                })
              );
            }
            break;
          }
          case "Limiter": {
            Log.Information(`Processing ${deviceType}`);

            const abletonLimiter = new AbletonLimiter(deviceElement);

            // Only add if modified
            if (abletonLimiter.hasBeenModified()) {
              const outputFileNameBase = `${fileNameNoExtension} - ${trackName ?? "Master"} - (${level}-${internalDeviceCount}) - ${deviceType}`;
              devicePresetFiles.push(
                new AbletonPresetFile({
                  filename: outputFileNameBase,
                  format: "text",
                  content: abletonLimiter.toString(),
                  pluginName: abletonLimiter.constructor.name,
                })
              );
            }

            break;
          }
          case "AutoPan": {
            Log.Information(`Processing ${deviceType}`);

            const abletonAutoPan = new AbletonAutoPan(deviceElement);

            // Only add if modified
            if (abletonAutoPan.hasBeenModified()) {
              const outputFileNameBase = `${fileNameNoExtension} - ${trackName ?? "Master"} - (${level}-${internalDeviceCount}) - ${deviceType}`;
              devicePresetFiles.push(
                new AbletonPresetFile({
                  filename: outputFileNameBase,
                  format: "text",
                  content: abletonAutoPan.toString(),
                  pluginName: abletonAutoPan.constructor.name,
                })
              );
            }

            break;
          }
          case "PluginDevice": {
            // Handle Plugin Presets
            // Path: PluginDevice/PluginDesc/VstPluginInfo/Preset/VstPreset
            const xPluginDesc = deviceElement?.PluginDesc;
            const xVstPluginInfo = xPluginDesc?.VstPluginInfo;
            const vstPlugName = xVstPluginInfo
              ? getValue(xVstPluginInfo, "PlugName", "UnknownPlugin")
              : "UnknownPlugin";
            const xPreset = xVstPluginInfo?.Preset;
            const xVstPreset = xPreset?.VstPreset;
            const vstPresetId = xVstPreset
              ? getAttr(xVstPreset, "Id", "0")
              : "0";

            if (doVerbose)
              Log.Debug(
                `Found VST Plugin: '${vstPlugName}' (Preset ID: ${vstPresetId})`
              );

            // read the byte data buffer
            const xVstPluginBuffer = xVstPreset?.Buffer;
            const vstPluginBufferBytes =
              getInnerValueAsByteArray(xVstPluginBuffer);

            if (vstPluginBufferBytes.length > 0) {
              const fxpBytes = AbletonProject.getAsFXP(
                vstPluginBufferBytes,
                vstPlugName
              );

              const outputFileNameBase = `${fileNameNoExtension} - ${trackName ?? "Master"} - (${level}-${internalDeviceCount}) - ${vstPlugName}`;

              const pluginPresetFile = new AbletonPresetFile({
                filename: outputFileNameBase,
                format: fxpBytes ? "fxp" : "unknown",
                content: fxpBytes ?? vstPluginBufferBytes, // Use original buffer if FXP conversion fails
                pluginName: vstPlugName,
              });
              devicePresetFiles.push(pluginPresetFile);

              if (fxpBytes) {
                Log.Information(
                  `Successfully converted VST Preset '${vstPlugName}' to FXP bytes. Handle bytes for: ${outputFileNameBase}`
                );
              } else {
                Log.Warning(
                  `FXP conversion failed or plugin not recognized for '${vstPlugName}'.`
                );
              }
            } else {
              Log.Information(
                `VST Plugin '${vstPlugName}' has empty preset buffer.`
              );
            }
            break;
          }
          case "AudioEffectGroupDevice": {
            // recursively handle group of plugins
            if (doVerbose) {
              Log.Debug(`Entering AudioEffectGroupDevice Level ${level + 1}`);
            }

            // Find nested devices within branches
            const branchesSource = deviceElement?.Branches?.AudioEffectBranch;

            // Ensure array
            const branches = branchesSource
              ? Array.isArray(branchesSource)
                ? branchesSource
                : [branchesSource]
              : [];

            for (const branch of branches) {
              if (!branch || typeof branch !== "object") continue;
              // Navigate down to the nested Devices element
              const branchDeviceChain = branch?.DeviceChain;
              const branchAudioChain =
                branchDeviceChain?.AudioToAudioDeviceChain; // Specific chain type for audio effects
              const nestedDevices = branchAudioChain?.Devices; // This is the <Devices> object

              if (nestedDevices) {
                // Recursive call to process nested devices
                this.doDevices(
                  rootXElement,
                  nestedDevices, // Pass the nested <Devices> element/object
                  [
                    ...deviceElementPath,
                    "Branches",
                    "AudioEffectBranch",
                    "DeviceChain",
                    "AudioToAudioDeviceChain",
                    "Devices",
                  ],
                  trackId,
                  trackName,
                  fxLoc, // Keep the same track location context
                  fileName,
                  level + 1, // Increment level
                  devicePresetFiles,
                  doVerbose
                );
              } else {
                Log.Information(
                  `Could not find nested Devices in AudioEffectGroupDevice branch at level ${level}`
                );
              }
            }
            if (doVerbose)
              Log.Debug(`Exiting AudioEffectGroupDevice Level ${level + 1}`);
            break;
          }
          case "MidiPitcher": {
            Log.Information(`Processing ${deviceType}`);

            // read <Pitch><Manual Value="0" />
            const xPitch = deviceElement?.Pitch;
            const xPitchValue = xPitch?.Manual;
            if (xPitchValue) {
              const pitchValue = parseFloat(getAttr(xPitchValue, "Value", "0"));

              if (pitchValue !== 0) {
                const outputFileNameBase = `${fileNameNoExtension} - ${trackName ?? "Master"} - (${level}-${internalDeviceCount}) - ${deviceType} (${pitchValue})`;

                Log.Information(
                  `Creating ${deviceType} Preset: ${outputFileNameBase}`
                );

                const deviceElementAsString = toXmlString({
                  [deviceType]: deviceElement,
                });

                const pluginPresetFile = new AbletonPresetFile({
                  filename: outputFileNameBase,
                  format: "xml",
                  content: deviceElementAsString,
                  pluginName: deviceType,
                });

                devicePresetFiles.push(pluginPresetFile);
              }
            }

            break;
          }
          default: {
            if (userName) {
              const outputFileNameBase = `${fileNameNoExtension} - ${trackName ?? "Master"} - (${level}-${internalDeviceCount}) - ${deviceType} - ${userName}`;

              // we are likely processing an .adv preset file
              // We will attempt to get FXP bytes using getInnerValueAsByteArray and getAsFXP.
              const xFileRef = deviceElement?.Descendants?.FileRef; // Assuming Descendants is an object/property
              const xBuffer = xFileRef?.Data; // Assuming Data is a property

              const vstBytes = getInnerValueAsByteArray(xBuffer);

              if (vstBytes.length > 0) {
                const fxpBytes = AbletonProject.getAsFXP(
                  vstBytes,
                  extractBeforeSpace(userName) // Use userName as plugin name heuristic
                );

                const pluginPresetFile = new AbletonPresetFile({
                  filename: outputFileNameBase,
                  format: fxpBytes ? "fxp" : "unknown",
                  content: fxpBytes ?? vstBytes, // Use original buffer if FXP conversion fails
                  pluginName: userName,
                });
                devicePresetFiles.push(pluginPresetFile);

                if (fxpBytes) {
                  Log.Information(
                    `Successfully converted Device/Preset (from UserName): ${userName} (${deviceType}) to FXP bytes. Handle bytes for: ${outputFileNameBase}`
                  );
                } else {
                  Log.Warning(
                    `FXP conversion failed or plugin not recognized for Device/Preset (from UserName): '${userName}' (${deviceType}).`
                  );
                }
              } else {
                Log.Information(
                  `Device/Preset (from UserName): '${userName}' (${deviceType}) has empty buffer.`
                );
              }
            } else {
              const outputFileNameBase = `${fileNameNoExtension} - ${trackName ?? "Master"} - (${level}-${internalDeviceCount}) - ${deviceType}`;

              // Handle other device types generically
              Log.Information(
                `Processing Generic/Unhandled Device: ${deviceType} - Path: ${outputFileNameBase}`
              );

              const deviceElementAsString = toXmlString({
                [deviceType]: deviceElement,
              });

              const pluginPresetFile = new AbletonPresetFile({
                filename: outputFileNameBase,
                format: "xml", // Assuming generic devices can be represented as XML
                content: deviceElementAsString,
                pluginName: deviceType,
              });

              devicePresetFiles.push(pluginPresetFile);
            }
            break;
          }
        } // End switch (deviceType)
      } // End for loop over deviceElements (individual device instances)
    } // End for loop over device types (keys in <Devices> object)
  }

  /** Applies compatibility fixes, like removing loop/cut data after processing */
  private static compat(cvpj: any): void {
    // this does the song_compat from DawVert
    // all credits go to SatyrDiamond and the DawVert code
    // https://github.com/SatyrDiamond/DawVert
    // song_compat.py: def makecompat(cvpj_l, cvpj_type):
    Log.Debug("[compat] Applying compatibility processing...");

    // loops_remove.py: def process_r(projJ, out__placement_loop)
    for (const trackId in cvpj.track_placements) {
      const placements = cvpj.track_placements[trackId];
      if (placements?.notes) {
        // Check if 'notes' property exists
        Log.Debug(`[compat] RemoveLoops: Processing track ${trackId}`);
        // This function modifies the notes array in place or returns a new one
        placements.notes = AbletonFunctions.removeLoopsDoPlacements(
          placements.notes
        );
      }
    }

    // removecut.py: def process_r(projJ)
    for (const trackId in cvpj.track_placements) {
      const placements = cvpj.track_placements[trackId];
      if (placements?.notes) {
        Log.Debug(`[compat] RemoveCut: Processing track ${trackId}`);
        // This function modifies the notes array in place
        AbletonFunctions.removeCutDoPlacements(placements.notes);
      }
    }

    Log.Debug("[compat] Compatibility processing finished.");
  }

  /**
   * Converts raw VST plugin buffer bytes into an FXP preset byte array.
   * @param vstPluginBufferBytes The raw byte buffer from the Ableton XML.
   * @param vstPlugName The name of the VST plugin.
   * @returns A Uint8Array containing the FXP preset bytes, or undefined if the plugin is not recognized.
   */
  public static getAsFXP(
    vstPluginBufferBytes: Uint8Array,
    vstPlugName: string
  ): Uint8Array | undefined {
    // Use the FXP.WriteRaw2FXP function which handles the FXP structure
    // and returns the byte array.
    switch (vstPlugName) {
      case "Sylenth1":
        return FXP.WriteRaw2FXP(vstPluginBufferBytes, "syl1");
      case "Serum":
      case "Serum_x64":
        return FXP.WriteRaw2FXP(vstPluginBufferBytes, "XfsX");
      case "FabFilter Saturn 2":
        return FXP.WriteRaw2FXP(vstPluginBufferBytes, "FS2a");
      case "FabFilter Pro-Q 3":
        return FXP.WriteRaw2FXP(vstPluginBufferBytes, "FQ3p");
      case "FabFilter Pro-L 2":
        return FXP.WriteRaw2FXP(vstPluginBufferBytes, "FL2p");
      case "OTT":
      case "OTT_x64":
        return FXP.WriteRaw2FXP(vstPluginBufferBytes, "XfTT");
      case "Endless Smile":
      case "Endless Smile 64":
        return FXP.WriteRaw2FXP(vstPluginBufferBytes, "ENDS");
      case "soothe2":
      case "soothe2_x64":
        return FXP.WriteRaw2FXP(vstPluginBufferBytes, "SthB");
      case "CamelCrusher":
        return FXP.WriteRaw2FXP(vstPluginBufferBytes, "CaCr");
      case "Kickstart":
      case "Kickstart-64bit":
        return FXP.WriteRaw2FXP(vstPluginBufferBytes, "CNKS");
      case "LFOTool":
      case "LFOTool_x64":
        return FXP.WriteRaw2FXP(vstPluginBufferBytes, "XffO");
      case "ValhallaRoom":
      case "ValhallaRoom_x64": {
        // Valhalla plugins have extra bytes at the start/end in Ableton's XML
        const truncatedBytes = AbletonProject.truncateByteArray(
          vstPluginBufferBytes,
          8, // Skip first 8 bytes
          2 // Skip last 2 bytes
        );
        return FXP.WriteRaw2FXP(truncatedBytes, "Ruum");
      }
      case "ValhallaVintageVerb":
      case "ValhallaVintageVerb_x64": {
        // Valhalla plugins have extra bytes at the start/end in Ableton's XML
        const truncatedBytes = AbletonProject.truncateByteArray(
          vstPluginBufferBytes,
          8, // Skip first 8 bytes
          2 // Skip last 2 bytes
        );
        return FXP.WriteRaw2FXP(truncatedBytes, "vee3");
      }
      case "SINE Player":
        return FXP.WriteRaw2FXP(vstPluginBufferBytes, "Y355");
      default:
        Log.Error(
          `Could not convert preset to fxp since vstplugin '${vstPlugName}' is not recognized!`
        );
        // Return undefined for unrecognized plugins
        return undefined;
    }
  }

  /**
   * Truncates a Uint8Array by skipping a specified number of bytes from the start and end.
   * @param originalArray The original Uint8Array.
   * @param skipFirst The number of bytes to skip from the beginning.
   * @param skipLast The number of bytes to skip from the end.
   * @returns A new Uint8Array containing the truncated portion.
   */
  private static truncateByteArray(
    originalArray: Uint8Array,
    skipFirst: number,
    skipLast: number
  ): Uint8Array {
    // Calculate the length of the truncated array
    const truncatedLength = originalArray.length - skipFirst - skipLast;

    // Ensure the truncated length is not negative
    if (truncatedLength < 0) {
      Log.Warning(
        `TruncateByteArray: Invalid skip values. Original length: ${originalArray.length}, skipFirst: ${skipFirst}, skipLast: ${skipLast}. Returning empty array.`
      );
      return new Uint8Array(0);
    }

    // Create a new Uint8Array from the desired portion of the original array
    return originalArray.slice(skipFirst, skipFirst + truncatedLength);
  }
} // End AbletonProject Class
