import { XMLParser, XMLValidator } from "fast-xml-parser";

import { FXP } from "../FXP";
import {
  extractBeforeSpace,
  getFileNameWithoutExtension,
} from "../StringUtils";
import { AbletonEq3 } from "./AbletonEq3";
import { AbletonEq8 } from "./AbletonEq8";
import { Log } from "./Log";
// Import MIDI functions
import {
  getElementByPath,
  getInnerValueAsByteArray,
  splitPath,
} from "./XMLUtils";

export class AbletonProject {
  // Use Map for easier key-value access compared to C#'s SortedDictionary
  // added another lookup table: automationTargetLookup
  // instead of the original code in DawVert which used inData as a full automation lookup object
  private static inData = new Map<number, any[]>();
  private static automationTargetLookup = new Map<number, any>();

  /** Helper to get an attribute value from a fast-xml-parser element */
  private static getAttr(
    element: any,
    attrName: string,
    fallback: string
  ): string {
    if (element && typeof element === "object") {
      const attr = element[`@_${attrName}`];
      // Check for null or undefined explicitly
      if (attr !== undefined && attr !== null) {
        return String(attr);
      }
    }
    return fallback;
  }

  /** Helper to get the Value attribute from a specific child element */
  private static getValue(
    xmlData: any,
    varName: string,
    fallback: string
  ): string {
    if (!xmlData) return fallback;
    // fast-xml-parser structure: xmlData might contain the varName directly
    const element = xmlData[varName];
    // Pass the found element (or undefined) to getAttr
    return this.getAttr(element, "Value", fallback);
  }

  /** Helper to get the Id attribute from a specific child element */
  private static getId(
    xmlData: any,
    varName: string,
    fallback: string
  ): string {
    if (!xmlData) return fallback;
    const element = xmlData[varName];
    return this.getAttr(element, "Id", fallback);
  }

  /** Converts a string value to a specified type */
  private static useValueType(valType: string, val: string): any {
    switch (valType) {
      case "string":
        return val;
      case "float":
        // Use parseFloat and check for NaN
        const floatVal = parseFloat(val);
        return isNaN(floatVal) ? 0.0 : floatVal;
      case "int":
        // Use parseInt with radix 10 and check for NaN
        const intVal = parseInt(val, 10);
        return isNaN(intVal) ? 0 : intVal;
      case "bool":
        // Case-insensitive comparison for boolean
        return val?.toLowerCase() === "true";
      default:
        // Add more cases as needed
        Log.Warning(`Unsupported value type: ${valType}. Returning string.`);
        return val;
    }
  }

  /** Gets a parameter value, handling potential automation targets (though automation target definition is simplified) */
  private static getParam(
    xmlData: any,
    varName: string,
    varType: string,
    fallback: string
    // loc and addMul parameters from C# are omitted as automation definition is simplified
  ): any {
    // Find the specific child element
    const xElement = xmlData ? xmlData[varName] : undefined;

    if (xElement) {
      // Get the 'Manual' value from the child element
      const manualValue = this.getValue(xElement, "Manual", fallback);

      // Changed the original automation lookup code
      // so InDefine is no longer used
      // const autoNumIdStr = this.getId(xElement, "AutomationTarget", "0");
      // const autoNumId = parseInt(autoNumIdStr, 10);
      // if (!isNaN(autoNumId) && autoNumId !== 0) {
      //   InDefine(autoNumId, loc, varType, addMul);
      // }

      return this.useValueType(varType, manualValue);
    } else {
      // If the element doesn't exist, return the fallback converted to the target type
      return this.useValueType(varType, fallback);
    }
  }

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
  ): any | null {
    // all credits go to SatyrDiamond and the DawVert code
    // https://raw.githubusercontent.com/SatyrDiamond/DawVert/main/plugin_input/r_ableton.py
    Log.Information(
      `Starting Ableton Live content processing for: ${fileName}`
    );
    // Clear static maps for fresh processing
    this.inData.clear();
    this.automationTargetLookup.clear();

    const parser = new XMLParser({
      ignoreAttributes: false, // Need attributes like @_Value, @_Id
      attributeNamePrefix: "@_", // Standard prefix
      parseAttributeValue: true, // Attempt to parse numbers/booleans in attributes
      // Consider other options if needed, e.g., arrayNodeName for consistent array handling
    });
    let rootXElement: any;
    try {
      // Basic validation check
      const validationResult = XMLValidator.validate(xmlString);
      if (validationResult !== true) {
        // Log validation errors if needed: validationResult.err
        Log.Warning(
          `XML structure validation failed: ${validationResult.err?.msg}. Attempting to parse anyway.`
        );
      }
      rootXElement = parser.parse(xmlString);
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
    const abletonVersion = this.getAttr(abletonRoot, "MinorVersion", "").split(
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
          doVerbose
        );
      }

      // Get Master Track properties
      const mastertrackName = this.getValue(
        xMasterTrack.Name, // Pass the Name element itself
        "EffectiveName",
        "Master"
      );
      const mastertrackColorIndex = parseInt(
        this.getValue(xMasterTrack, "Color", "0") // Get Color directly from MasterTrack
      );
      const mastertrackColor = colorlistOne[mastertrackColorIndex] ?? [
        1.0,
        1.0,
        1.0, // Default white
      ];

      // Get parameters using the helper
      const masTrackVol = this.getParam(
        xMasterTrackMixer, // Source element
        "Volume", // Parameter name
        "float", // Type
        "0.85" // Default value (as string)
      );
      const masTrackPan = this.getParam(
        xMasterTrackMixer,
        "Pan",
        "float",
        "0.0"
      );
      const tempo = this.getParam(xMasterTrackMixer, "Tempo", "float", "120.0");

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

      const trackId = this.getAttr(xTrackData, "Id", "");
      if (!trackId) {
        Log.Warning("Skipping track with missing Id attribute.");
        continue; // Skip tracks without an ID
      }

      const xTrackDeviceChain = xTrackData.DeviceChain;
      const xTrackMixer = xTrackDeviceChain?.Mixer;
      const trackName = this.getValue(
        xTrackData.Name,
        "EffectiveName",
        `Track ${trackId}` // Default name
      );
      const trackColorIndex = parseInt(this.getValue(xTrackData, "Color", "0"));
      const trackColor = colorlistOne[trackColorIndex] ?? [0.8, 0.8, 0.8]; // Default grey
      const trackInsideGroup = this.getValue(xTrackData, "TrackGroupId", "-1"); // Check if track is grouped

      let fxLoc: string[] = []; // Location identifier for devices/automation
      let trackData: any = {}; // Data for cvpj.track_data
      let trackPlacementData: any = {}; // Data for cvpj.track_placements

      const deviceChain = xTrackData?.DeviceChain;
      const mainSequencer = deviceChain?.MainSequencer;
      const clipTimeable = mainSequencer?.ClipTimeable;
      const arrangerAutomation = clipTimeable?.ArrangerAutomation;
      const events = arrangerAutomation?.Events;

      // Get common track parameters
      const trackVol = this.getParam(xTrackMixer, "Volume", "float", "0.85");
      const trackPan = this.getParam(xTrackMixer, "Pan", "float", "0.0");

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
              this.getValue(xTrackMidiClip, "CurrentStart", "0")
            );
            const notePlacementEnd = parseFloat(
              this.getValue(xTrackMidiClip, "CurrentEnd", "0")
            );
            const notePlacementName = this.getValue(xTrackMidiClip, "Name", "");
            const notePlacementColorIndex = parseInt(
              this.getValue(xTrackMidiClip, "Color", "0")
            );
            const notePlacementColor =
              colorlistOne[notePlacementColorIndex] ?? trackColor; // Fallback to track color
            const notePlacementMuted =
              this.getValue(
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
                this.getValue(xTrackMidiClipLoop, "LoopStart", "0")
              );
              const loopLEnd = parseFloat(
                this.getValue(xTrackMidiClipLoop, "LoopEnd", "1") // Default loop end is 1 beat
              );
              const loopStartRel = parseFloat(
                this.getValue(xTrackMidiClipLoop, "StartRelative", "0")
              );
              const loopOn =
                this.getValue(
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
                this.getValue(xTrackMidiClipKTKTs, "MidiKey", "60") // Default C4
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
                  this.getAttr(xTrackMidiClipMNE, "Time", "0")
                );
                const noteDuration = parseFloat(
                  this.getAttr(xTrackMidiClipMNE, "Duration", "0")
                );
                const noteVelocity = parseFloat(
                  this.getAttr(xTrackMidiClipMNE, "Velocity", "100") // Default velocity 100
                );
                const noteOffVelocity = parseFloat(
                  this.getAttr(xTrackMidiClipMNE, "OffVelocity", "64") // Default off velocity 64
                );
                const noteProbability = parseFloat(
                  this.getAttr(xTrackMidiClipMNE, "Probability", "1") // Default probability 1
                );
                const noteIsEnabled =
                  this.getAttr(
                    xTrackMidiClipMNE,
                    "IsEnabled",
                    "true"
                  ).toLowerCase() === "true";
                const noteId = parseInt(
                  this.getAttr(xTrackMidiClipMNE, "NoteId", "0") // Get NoteId attribute
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
              const autoNoteId = parseInt(
                this.getAttr(xNoteNEvent, "NoteId", "0")
              );
              const autoNoteCC = parseInt(this.getAttr(xNoteNEvent, "CC", "0"));
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
                    this.getAttr(abletonPoint, "TimeOffset", "0")
                  );
                  const apVal = parseFloat(
                    this.getAttr(abletonPoint, "Value", "0")
                  );
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
              this.getValue(xAudioClip, "FreezeStart", "0")
            );
            const freezeEnd = parseFloat(
              this.getValue(xAudioClip, "FreezeEnd", "0")
            );

            if (freezeStart === 0 && freezeEnd === 0) {
              const sampleRef = xAudioClip?.SampleRef;
              const fileRef = sampleRef?.FileRef;
              // Get relative path if available
              const relativePath = fileRef
                ? this.getValue(fileRef, "RelativePath", "")
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
            doVerbose
          );
        }
      }
    } // End for loop over trackElements

    // --- Final Steps ---
    this.inOutput(cvpj); // Process collected automation data
    this.compat(cvpj); // Apply compatibility fixes (loop/cut removal)

    // --- Audio Clip Collection (Placeholder) ---
    Log.Information("Audio clip collection skipped in this port.");
    // if (doVerbose)
    //   Log.Debug("Found unique audio clips:", Array.from(uniqueAudioClipList));

    Log.Information(
      "AbletonProject.handleAbletonLiveContent: Parsing completed."
    );

    // Convert Maps to plain objects for JSON serialization
    const jsonCompatibleCvpj = {
      ...cvpj, // Copy existing properties
      track_data: Object.fromEntries(cvpj.track_data.entries()),
      track_placements: Object.fromEntries(cvpj.track_placements.entries()),
    };

    return jsonCompatibleCvpj; // Return the converted project data
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
      const autoTargetIdStr = this.getValue(
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
        const timeStr = this.getAttr(envAutoEvent, "Time", "0");
        const valueStr = this.getAttr(envAutoEvent, "Value", "0");
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
        const timeStr = this.getAttr(envAutoEvent, "Time", "0");
        const valueStr = this.getAttr(envAutoEvent, "Value", "false"); // Default false
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
            ? this.getValue(vstPluginInfo, "PlugName", "")
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

        const deviceId = this.getAttr(deviceElement, "Id", "0");
        // this is set in .adv preset files
        const userName = this.getValue(
          deviceElement.UserName,
          "EffectiveName",
          ""
        ); // Get UserName if present

        // check if it's on
        const onElement = deviceElement?.On;
        // Default to true if 'On' element is missing? Ableton default is On. C# defaults to false. Let's default to true.
        const isOn = onElement
          ? this.getValue(onElement, "Manual", "true").toLowerCase() === "true"
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
        // This TS version is simplified compared to C#, only handling a few types explicitly.
        switch (deviceType) {
          case "FilterEQ3": {
            // read EQ
            const eq3 = new AbletonEq3(deviceElement);
            const outputFileNameBase = `${fileNameNoExtension} - ${trackName ?? "Master"} - (${level}-${internalDeviceCount}) - ${deviceType}`;
            if (eq3.hasBeenModified()) {
              // TODO: convert to Fabfilter Pro Q3 as well
              Log.Information(
                `Processing modified ${deviceType} Preset: ${outputFileNameBase}`
              );
              // Example: eq3.savePreset(outputDirectoryPath, outputFileNameBase);
            } else {
              Log.Information(
                `Skipping unmodified ${deviceType}: ${outputFileNameBase}`
              );
            }
            break;
          }
          case "Eq8": {
            // read EQ
            const eq8 = new AbletonEq8(deviceElement);
            const outputFileNameBase = `${fileNameNoExtension} - ${trackName ?? "Master"} - (${level}-${internalDeviceCount}) - ${deviceType}`;
            if (eq8.hasBeenModified()) {
              // Convert EQ8 to Steinberg Frequency
              // convert to Fabfilter Pro Q3 as well
              // debug
              Log.Information(
                `Processing modified ${deviceType} Preset: ${outputFileNameBase}`
              );
              // Example: eq8.savePreset(outputDirectoryPath, outputFileNameBase);
              // Example: const steinbergFreq = eq8.toSteinbergFrequency();
              // Example: steinbergFreq.write(Path.combine(outputDirectoryPath, "Frequency", ...));
            } else {
              Log.Information(
                `Skipping unmodified ${deviceType}: ${outputFileNameBase}`
              );
            }
            break;
          }
          case "Compressor2": {
            // Convert Compressor2 to Steinberg Compressor
            Log.Information(
              `Placeholder for Compressor2 processing: ${userName || deviceType}`
            );
            // TODO: Implement Compressor2 parsing and conversion
            break;
          }
          case "GlueCompressor": {
            // Convert Glue compressor to Waves SSL Compressor
            Log.Information(
              `Placeholder for GlueCompressor processing: ${userName || deviceType}`
            );
            // TODO: Implement GlueCompressor parsing and conversion
            break;
          }
          case "Limiter": {
            Log.Information(
              `Placeholder for Limiter processing: ${userName || deviceType}`
            );
            // TODO: Implement Limiter parsing and conversion
            break;
          }
          case "AutoPan": {
            Log.Information(
              `Placeholder for AutoPan processing: ${userName || deviceType}`
            );
            // TODO: Implement AutoPan parsing and conversion
            break;
          }
          case "PluginDevice": {
            // Handle Plugin Presets
            // Path: PluginDevice/PluginDesc/VstPluginInfo/Preset/VstPreset
            const xPluginDesc = deviceElement?.PluginDesc;
            const xVstPluginInfo = xPluginDesc?.VstPluginInfo;
            const vstPlugName = xVstPluginInfo
              ? this.getValue(xVstPluginInfo, "PlugName", "UnknownPlugin")
              : "UnknownPlugin";
            const xPreset = xVstPluginInfo?.Preset;
            const xVstPreset = xPreset?.VstPreset;
            const vstPresetId = xVstPreset
              ? this.getAttr(xVstPreset, "Id", "0")
              : "0";

            if (doVerbose)
              Log.Debug(
                `Found VST Plugin: '${vstPlugName}' (Preset ID: ${vstPresetId})`
              );

            // read the byte data buffer
            const xVstPluginBuffer = xVstPreset?.Buffer;
            const vstPluginBufferBytes =
              getInnerValueAsByteArray(xVstPluginBuffer);

            // check if this is a zlib file
            // Serum presets are zlib compressed, but don't deflate
            // if (vstPluginBufferBytes[0] == 0x78 && vstPluginBufferBytes[1] == 0x01) ...

            if (vstPluginBufferBytes.length > 0) {
              const fxpBytes = AbletonProject.getAsFXP(
                vstPluginBufferBytes,
                vstPlugName
              );

              if (fxpBytes) {
                // TODO: Handle the returned fxpBytes (e.g., save to file, return in the main result)
                const outputFileNameBase = `${fileNameNoExtension} - ${trackName ?? "Master"} - (${level}-${internalDeviceCount}) - ${vstPlugName}`;
                Log.Information(
                  `Successfully converted VST Preset '${vstPlugName}' to FXP bytes. Handle bytes for: ${outputFileNameBase}`
                );
                // Example: saveBytesToFile(fxpBytes, outputDirectoryPath, `${outputFileNameBase}.fxp`);
              } else {
                // getAsFXP logs an error if the plugin is not recognized
                Log.Warning(
                  `FXP conversion failed or plugin not recognized for '${vstPlugName}'.`
                );
                // TODO: Optionally save the raw bytes or XML for unrecognized plugins
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
            if (doVerbose)
              Log.Debug(`Entering AudioEffectGroupDevice Level ${level + 1}`);
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
            // read <Pitch><Manual Value="0" />
            Log.Information(
              `Placeholder for MidiPitcher processing: ${userName || deviceType}`
            );
            // TODO: Implement MidiPitcher parsing
            break;
          }
          // Placeholders for devices handled in C# default case
          case "MultibandDynamics":
          case "AutoFilter":
          case "Reverb":
          case "Saturator":
          case "Tuner":
          case "StereoGain": {
            Log.Information(
              `Placeholder for ${deviceType} processing: ${userName || deviceType}`
            );
            // TODO: Implement parsing for these specific device types if needed
            break;
          }
          // C# Handles these in default: MultibandDynamics, AutoFilter, Reverb, Saturator, Tuner, StereoGain
          default: {
            const outputFileNameBase = `${fileNameNoExtension} - ${trackName ?? "Master"} - (${level}-${internalDeviceCount}) - ${deviceType}`;
            if (userName) {
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

                if (fxpBytes) {
                  // TODO: Handle the returned fxpBytes (e.g., save to file, return in the main result)
                  Log.Information(
                    `Successfully converted Device/Preset (from UserName): ${userName} (${deviceType}) to FXP bytes. Handle bytes for: ${outputFileNameBase}`
                  );
                  // Example: saveBytesToFile(fxpBytes, outputDirectoryPath, `${outputFileNameBase}.fxp`);
                } else {
                  // getAsFXP logs an error if the plugin is not recognized
                  Log.Warning(
                    `FXP conversion failed or plugin not recognized for Device/Preset (from UserName): '${userName}' (${deviceType}).`
                  );
                  // TODO: Optionally save the raw bytes or XML for unrecognized plugins
                }
              } else {
                Log.Information(
                  `Device/Preset (from UserName): '${userName}' (${deviceType}) has empty buffer.`
                );
                // TODO: Implement generic preset saving (e.g., saving the raw XML part) if needed
                // Example: saveDeviceXml(deviceElement, outputDirectoryPath, outputFileNameBase);
              }
            } else {
              // Handle other device types generically
              Log.Information(
                `Processing Generic/Unhandled Device: ${deviceType} - Path: ${outputFileNameBase}`
              );
              // TODO: Implement generic preset saving (e.g., saving the raw XML part) if needed
              // Example: saveDeviceXml(deviceElement, outputDirectoryPath, outputFileNameBase);
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

// =============================================================================
// Helper Classes (Ported/Adapted from C#, which is again based on Python)
// =============================================================================

class AbletonFunctions {
  /**
   * Convert a hexadecimal value #FF00FF to RGB. Returns an array of doubles between 0 and 1.
   */
  static hexToRgbDouble(hex: string): number[] {
    hex = hex.replace(/^#/, ""); // Remove leading # if present
    if (hex.length !== 6) {
      Log.Error("Invalid hexadecimal color code:", hex);
      return [1.0, 1.0, 1.0]; // Default to white on error
    }
    // Parse hex components
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Normalize to 0.0 - 1.0 range
    const factor = 1.0 / 255.0;
    return [r * factor, g * factor, b * factor];
  }

  /**
   * Converts a list of automation points into a structured object containing
   * overall position, duration, and the points relative to the start position.
   * Based on C# ToPointList which implements Python's auto_nopl.py: def to_pl(pointsdata):
   * @param list Array of points, each with { position: number, value: number }
   * @returns Object { position: number, duration: number, points: any[] }
   */
  static toPointList(list: any[]): any {
    // auto_nopl.py: def to_pl(pointsdata):
    if (!list || list.length === 0) {
      // Handle empty list case
      return { position: 0, duration: 4, points: [] }; // Default duration 4?
    }

    // Find the min and max position from the list
    const { startPos, endPos } = this.getDurPos(list);

    // Calculate duration based on min/max positions
    // Add a small buffer (e.g., 4 beats) like C# seems to do?
    const duration = endPos - startPos + 4;

    // Trim and move points relative to the start position
    const relativePoints = this.trimMove(list, startPos, startPos + endPos);

    return {
      position: startPos, // Overall start position
      duration: duration, // Overall duration
      points: relativePoints, // Points relative to startPos
    };
  }

  /**
   * Finds the minimum and maximum position within a list of points.
   * Based on C# GetDurPos which implements Python's auto.py
   * @param list Array of points, each with { position: number }
   * @returns Object { startPos: number, endPos: number }
   */
  static getDurPos(list: any[]): { startPos: number; endPos: number } {
    // auto.py
    if (!list || list.length === 0) {
      return { startPos: 0, endPos: 0 };
    }

    let minPos = list[0].position;
    let maxPos = list[0].position;

    for (let i = 1; i < list.length; i++) {
      const pos = list[i].position;
      if (pos < minPos) minPos = pos;
      if (pos > maxPos) maxPos = pos;
    }

    // Let's return min and max directly for clarity
    return { startPos: minPos, endPos: maxPos };
  }

  /**
   * Trims points outside a specified range and moves remaining points relative to a start offset.
   * Based on C# TrimMove which implements Python's notelist_data.py and auto.py.
   * @param list Array of points { position: number, ... }
   * @param startAt Offset to subtract from positions.
   * @param endAt Position value (exclusive) to trim points after.
   * @returns New array with trimmed and moved points.
   */
  static trimMove(
    list: any[],
    startAt: number | null | undefined,
    endAt: number | null | undefined
  ): any[] {
    // notelist_data.py and auto.py
    let newList = [...list]; // Create a copy

    // 1. Trim points that are at or after endAt
    if (endAt != null) {
      newList = this.trim(newList, endAt);
    }

    // 2. Move remaining points by subtracting startAt
    if (startAt != null) {
      newList = this.move(newList, -startAt);
    }

    return newList;
  }

  /**
   * Filters a list of points, keeping only those before a specified position.
   * Based on C# Trim which implements Python's notelist_data.py and auto.py.
   * @param list Array of points { position: number, ... }
   * @param pos The position (exclusive) to trim after.
   * @returns New array with points before pos.
   */
  static trim(list: any[], pos: number): any[] {
    // notelist_data.py and auto.py
    // Keep elements where element.position is strictly less than pos
    return list.filter(element => element.position < pos);
  }

  /**
   * Moves all points in a list by a given offset, removing points that end up before position 0.
   * Based on C# Move which implements Python's notelist_data.py and auto.py.
   * @param list Array of points { position: number, ... }
   * @param posOffset The amount to add to each position.
   * @returns New array with moved points (position >= 0).
   */
  static move(list: any[], posOffset: number): any[] {
    // notelist_data.py and auto.py
    return list
      .map(element => ({
        ...element, // Copy existing properties
        position: element.position + posOffset, // Apply offset
      }))
      .filter(element => element.position >= 0); // Keep only points at or after 0
  }

  /**
   * Processes note placements, expanding loops into multiple cut segments.
   * Based on C# RemoveLoopsDoPlacements which implements Python's loops_remove.py.
   * @param notePlacements Array of note placement objects.
   * @param outPlacementLoop Set to track processed loop types (not used in current logic).
   * @returns New array of note placements with loops expanded.
   */
  static removeLoopsDoPlacements(notePlacements: any[]): any[] {
    // loops_remove.py
    const newPlacements: any[] = [];

    for (const notePlacement of notePlacements) {
      // Check if placement has 'cut' data and it's a loop type
      if (
        notePlacement.cut &&
        (notePlacement.cut.type === "loop" ||
          notePlacement.cut.type === "loop_off" ||
          notePlacement.cut.type === "loop_adv")
      ) {
        // Clone the base placement data, removing loop-specific fields
        const notePlacementBase = { ...notePlacement }; // Shallow clone
        delete notePlacementBase.cut;
        delete notePlacementBase.position;
        delete notePlacementBase.duration;

        // Extract loop parameters
        const loopBasePosition = notePlacement.position;
        const loopBaseDuration = notePlacement.duration;
        // Use nullish coalescing for defaults
        const loopStart = notePlacement.cut.start ?? 0;
        const loopLoopStart = notePlacement.cut.loopstart ?? 0;
        const loopLoopEnd = notePlacement.cut.loopend ?? loopBaseDuration; // Default end is placement duration

        // Calculate the cut points based on loop parameters
        const cutpoints = XtraMath.cutLoop(
          loopBasePosition,
          loopBaseDuration,
          loopStart,
          loopLoopStart,
          loopLoopEnd
        );

        // Create new placements for each cut segment
        for (const cutpoint of cutpoints) {
          const notePlacementCutted = { ...notePlacementBase }; // Shallow clone
          notePlacementCutted.position = cutpoint[0]; // New position
          notePlacementCutted.duration = cutpoint[1]; // New duration
          // Add 'cut' info representing the source segment
          notePlacementCutted.cut = {
            type: "cut", // Mark as a simple cut segment now
            start: cutpoint[2], // Source start within the original loop/clip
            end: cutpoint[3], // Source end within the original loop/clip
          };
          newPlacements.push(notePlacementCutted);
        }
      } else {
        // If not a loop or no cut data, add the original placement
        newPlacements.push(notePlacement);
      }
    }
    return newPlacements;
  }

  /**
   * Processes note placements with 'cut' data, trimming and moving the internal notelist.
   * Based on C# RemoveCutDoPlacements which implements Python's removecut.py.
   * Modifies the notePlacements array in place.
   * @param notePlacements Array of note placement objects.
   */
  static removeCutDoPlacements(notePlacements: any[]): void {
    // removecut.py
    for (const notePlacement of notePlacements) {
      // Check for 'cut' data of type 'cut'
      if (notePlacement.cut && notePlacement.cut.type === "cut") {
        const cutStart = notePlacement.cut.start ?? 0;
        // Calculate the end position within the source clip based on placement duration
        const cutEnd = cutStart + notePlacement.duration;

        // Trim and move the notes *inside* this placement
        if (notePlacement.notelist) {
          notePlacement.notelist = this.trimMove(
            notePlacement.notelist,
            cutStart, // Move notes relative to cutStart
            cutEnd // Trim notes after cutEnd
          );
        }

        // Remove the 'cut' property as it has been processed
        delete notePlacement.cut;
      }
    }
  }

  /**
   * Creates a 'cut' object representing loop parameters.
   * Based on C# CutLoopData which implements Python's placement_data.py.
   * @param start Start position relative to the clip start (beats).
   * @param loopStart Loop start position within the clip (beats).
   * @param loopEnd Loop end position within the clip (beats).
   * @returns Object representing the loop type and parameters.
   */
  static cutLoopData(start: number, loopStart: number, loopEnd: number): any {
    // placement_data.py
    // Determine loop type based on parameters
    if (start === 0 && loopStart === 0) {
      // Simple loop from the beginning
      return { type: "loop", loopend: loopEnd };
    } else if (loopStart === 0) {
      // Loop starts from beginning, but placement starts later
      return { type: "loop_off", start: start, loopend: loopEnd };
    } else {
      // Advanced loop with specific start and loop points
      return {
        type: "loop_adv",
        start: start,
        loopstart: loopStart,
        loopend: loopEnd,
      };
    }
  }
}

class XtraMath {
  // placement_loop.py

  /** Helper for cutLoop - handles loops where loopStart > placementStart */
  static loopBefore(
    placementPos: number,
    placementDur: number,
    placementStart: number,
    loopStart: number,
    loopEnd: number
  ): number[][] {
    const cutPoints: number[][] = [];
    const loopSize = loopEnd - loopStart;

    if (loopSize <= 0) {
      Log.Warning(
        `loopBefore: Invalid loop size (${loopSize}). loopStart=${loopStart}, loopEnd=${loopEnd}. Returning original segment.`
      );
      return [
        [
          placementPos,
          placementDur,
          placementStart,
          placementStart + placementDur,
        ],
      ];
    }

    // Position within the source material (where we read from)
    let currentReadPos = placementStart;
    // Position in the output timeline (where we write to)
    let currentWritePos = placementPos;
    // How much duration is left to place
    let remainingDuration = placementDur;

    // --- First segment: from placementStart up to loopEnd ---
    // Duration of the first segment
    const firstSegmentDur = Math.min(
      remainingDuration,
      loopEnd - currentReadPos
    );

    if (firstSegmentDur > 0) {
      cutPoints.push([
        currentWritePos, // Output position
        firstSegmentDur, // Output duration
        currentReadPos, // Source start position
        currentReadPos + firstSegmentDur, // Source end position
      ]);
      // Update positions and remaining duration
      currentWritePos += firstSegmentDur;
      remainingDuration -= firstSegmentDur;
      currentReadPos += firstSegmentDur; // This should now be == loopEnd if duration was sufficient
    }

    // --- Subsequent segments: looping from loopStart ---
    while (remainingDuration > 0) {
      // Start reading from the beginning of the loop
      currentReadPos = loopStart;
      // Duration of this segment (min of remaining duration and loop size)
      const segmentDur = Math.min(remainingDuration, loopSize);

      if (segmentDur <= 0) break; // Safety break

      cutPoints.push([
        currentWritePos, // Output position
        segmentDur, // Output duration
        currentReadPos, // Source start position (loopStart)
        currentReadPos + segmentDur, // Source end position
      ]);
      // Update positions and remaining duration
      currentWritePos += segmentDur;
      remainingDuration -= segmentDur;
      currentReadPos += segmentDur; // Move read position forward
    }

    return cutPoints;
  }

  /** Helper for cutLoop - handles loops where loopStart <= placementStart */
  static loopAfter(
    placementPos: number,
    placementDur: number,
    placementStart: number,
    loopStart: number,
    loopEnd: number
  ): number[][] {
    const cutPoints: number[][] = [];
    const loopSize = loopEnd - loopStart;

    if (loopSize <= 0) {
      Log.Warning(
        `loopAfter: Invalid loop size (${loopSize}). loopStart=${loopStart}, loopEnd=${loopEnd}. Returning original segment.`
      );
      return [
        [
          placementPos,
          placementDur,
          placementStart,
          placementStart + placementDur,
        ],
      ];
    }

    // Position within the source material (where we read from)
    let currentReadPos = placementStart;
    // Position in the output timeline (where we write to)
    let currentWritePos = placementPos;
    // How much duration is left to place
    let remainingDuration = placementDur;

    while (remainingDuration > 0) {
      // If currentReadPos is outside the loop, reset it to loopStart
      if (currentReadPos < loopStart || currentReadPos >= loopEnd) {
        currentReadPos = loopStart;
      }

      // Duration of this segment (min of remaining duration and time left in loop)
      const segmentDur = Math.min(remainingDuration, loopEnd - currentReadPos);

      if (segmentDur <= 0) {
        // This can happen if remainingDuration > 0 but currentReadPos is exactly loopEnd
        // Reset read position and continue loop
        currentReadPos = loopStart;
        continue;
      }

      cutPoints.push([
        currentWritePos, // Output position
        segmentDur, // Output duration
        currentReadPos, // Source start position
        currentReadPos + segmentDur, // Source end position
      ]);

      // Update positions and remaining duration
      currentWritePos += segmentDur;
      remainingDuration -= segmentDur;
      currentReadPos += segmentDur; // Move read position forward
    }

    return cutPoints;
  }

  /**
   * Calculates cut segments for a looped placement.
   * Based on C# CutLoop which implements Python's placement_loop.py.
   * @returns Array of [outPos, outDur, srcStart, srcEnd] tuples.
   */
  static cutLoop(
    placementPos: number, // Position of the placement on the timeline
    placementDur: number, // Duration of the placement on the timeline
    placementStart: number, // Start position within the source clip to read from
    loopStart: number, // Loop start position within the source clip
    loopEnd: number // Loop end position within the source clip
  ): number[][] {
    // Basic validation
    if (loopEnd <= loopStart) {
      Log.Warning(
        `cutLoop: Invalid loop points: loopStart=${loopStart}, loopEnd=${loopEnd}. Returning non-looped segment.`
      );
      // Return a single segment representing the original placement
      return [
        [
          placementPos,
          placementDur,
          placementStart,
          placementStart + placementDur,
        ],
      ];
    }

    // Choose the correct helper based on whether the placement starts before or after the loop point
    if (loopStart > placementStart) {
      return this.loopBefore(
        placementPos,
        placementDur,
        placementStart,
        loopStart,
        loopEnd
      );
    } else {
      return this.loopAfter(
        placementPos,
        placementDur,
        placementStart,
        loopStart,
        loopEnd
      );
    }
  }
}

class DataValues {
  // data_values.py

  /** Sets a value in a nested object structure, creating intermediate objects if they don't exist. */
  static nestedDictAddValue(dict: any, keys: string[], value: any): void {
    let current = dict;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      // Create nested object if it doesn't exist or is not an object
      if (
        !(key in current) ||
        typeof current[key] !== "object" ||
        current[key] === null
      ) {
        current[key] = {};
      }
      current = current[key];
    }
    // Set the value at the final key
    current[keys[keys.length - 1]] = value;
  }

  /** Adds a value to a list within a nested object structure, creating intermediate objects/lists if needed. */
  static nestedDictAddToList(dict: any, keys: string[], value: any): void {
    let current = dict;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      // Create nested object if it doesn't exist or is not an object
      if (
        !(key in current) ||
        typeof current[key] !== "object" ||
        current[key] === null
      ) {
        current[key] = {};
      }
      current = current[key];
    }
    const lastKey = keys[keys.length - 1];
    // Ensure the target property is an array
    if (!Array.isArray(current[lastKey])) {
      current[lastKey] = [];
    }
    // If the value itself is an array, replace the list (like C# logic)
    // Otherwise, push the single value onto the list
    if (Array.isArray(value)) {
      current[lastKey] = value; // Replace existing list with the new array
    } else {
      current[lastKey].push(value); // Add single item to the list
    }
  }
}
