import { XMLParser, XMLValidator } from "fast-xml-parser";

import { makeValidFileName, makeValidIdentifier } from "../StringUtils";
import { AbletonEq3 } from "./AbletonEq3";
import { AbletonEq8 } from "./AbletonEq8";
import { Log } from "./Log";
import { convertAutomationToMidi, convertToMidi } from "./Midi"; // Import MIDI functions

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
    // inData[id][3].Add(autoPl); (Original Python logic)
    // inData[id].Add(autoPointList); // C# simplified logic
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
    file: string, // Filename for context
    outputDirectoryPath: string, // Used by device handlers (though simplified here)
    doList: boolean, // Not used in this simplified version
    doVerbose: boolean // Controls verbose logging
  ): any | null {
    // all credits go to SatyrDiamond and the DawVert code
    // https://raw.githubusercontent.com/SatyrDiamond/DawVert/main/plugin_input/r_ableton.py
    Log.Information(`Starting Ableton Live content processing for: ${file}`);
    // Clear static maps for fresh processing
    this.inData.clear();
    this.automationTargetLookup.clear();

    // C# uses System.Xml.Linq, TS uses fast-xml-parser
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
      track_data: {}, // Use object/dictionary for easier lookup by ID
      track_order: [],
      track_placements: {}, // Use object/dictionary
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
          null, // No trackId for master
          "Master",
          ["master", "master_1"], // Location identifier for master
          outputDirectoryPath,
          file,
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
    const trackElements: any[] = [];
    const trackTypes = ["MidiTrack", "AudioTrack", "GroupTrack", "ReturnTrack"];
    if (xTracks) {
      trackTypes.forEach(type => {
        const tracksOfType = xTracks[type];
        if (tracksOfType) {
          const trackArray = Array.isArray(tracksOfType)
            ? tracksOfType
            : [tracksOfType];
          trackElements.push(
            ...trackArray.filter(t => typeof t === "object" && t !== null)
          );
        }
      });
    }

    // Read Tracks
    if (doVerbose) Log.Debug(`Found ${trackElements.length} Tracks ...`);

    for (const xTrackData of trackElements) {
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
      let trackType = "Unknown"; // Determined based on content

      // Determine track type (more robustly than C# version)
      const deviceChain = xTrackData?.DeviceChain;
      const mainSequencer = deviceChain?.MainSequencer;
      const clipTimeable = mainSequencer?.ClipTimeable;
      const arrangerAutomation = clipTimeable?.ArrangerAutomation;
      const events = arrangerAutomation?.Events;

      // Infer type based on XML structure/elements present
      if (events?.MidiClip) {
        trackType = "MidiTrack";
      } else if (events?.AudioClip) {
        trackType = "AudioTrack";
      } else if (xTrackData.TrackDelay && xTrackData.IsFolded) {
        // Heuristic for GroupTrack
        trackType = "GroupTrack";
      } else if (xTrackData.ReturnTrack) {
        // Check if it's explicitly a ReturnTrack element
        trackType = "ReturnTrack";
      } else if (trackName?.toLowerCase().includes("return")) {
        // Fallback heuristic for ReturnTrack
        trackType = "ReturnTrack";
      }
      // Note: The original C# code determines type *before* the switch, which seems odd.
      // This TS version determines type first, then switches.

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
              `Reading MIDI Track. Id: ${trackId}, Name: ${trackName}, Volume: ${trackVol}, Pan: ${trackPan}`
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
          cvpj.track_data[midiTrackId] = trackData;
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
              // C# calculates abletonNoteKey = midiKey - 60; TS uses midiKey directly. Keep TS for now.

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
                    key: midiKey, // Use the key from the KeyTrack
                    position: noteTime * 4, // Convert to beats
                    duration: noteDuration * 4,
                    vol: noteVelocity / 127.0, // Normalize velocity (0-1)
                    off_vol: noteOffVelocity / 127.0, // Normalize off velocity
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
              `Reading Audio Track. Id: ${trackId}, Name: ${trackName}, Volume: ${trackVol}, Pan: ${trackPan}`
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
          cvpj.track_data[audioTrackId] = trackData;
          cvpj.track_order.push(audioTrackId);

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

            // C# checks FreezeStart/End, TS checks directly
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
          trackPlacementData = { audio: [] };
          break; // End AudioTrack case
        }
        case "ReturnTrack": {
          const returnTrackId = `return_${returnId}`; // Use counter for unique ID
          fxLoc = ["return", returnTrackId];
          if (doVerbose)
            Log.Debug(
              `Reading Return Track. Id: ${trackId}, Name: ${trackName}, Volume: ${trackVol}, Pan: ${trackPan}`
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
          cvpj.track_data[returnTrackId] = trackData;
          cvpj.track_order.push(returnTrackId);
          returnId++; // Increment return track counter
          // No placement data typically associated with return tracks initially
          break; // End ReturnTrack case
        }
        case "GroupTrack": {
          const groupTrackId = `group_${trackId}`;
          fxLoc = ["group", groupTrackId];
          if (doVerbose)
            Log.Debug(
              `Reading Group Track. Id: ${trackId}, Name: ${trackName}, Volume: ${trackVol}, Pan: ${trackPan}`
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
          cvpj.track_data[groupTrackId] = trackData;
          cvpj.track_order.push(groupTrackId);
          // No placement data typically associated with group tracks initially
          break; // End GroupTrack case
        }
        default: {
          Log.Warning(
            `Encountered unknown track type for track ID ${trackId}, Name: ${trackName}. Skipping specific processing.`
          );
          // Basic track data might still be useful
          const unknownTrackId = `unknown_${trackId}`;
          fxLoc = ["unknown", unknownTrackId];
          trackData = {
            type: "unknown",
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
          cvpj.track_data[unknownTrackId] = trackData;
          cvpj.track_order.push(unknownTrackId);
          break;
        }
      } // End switch (trackType)

      // Add placement data if it was generated
      if (Object.keys(trackPlacementData).length > 0) {
        const currentTrackId = fxLoc[1]; // Get the generated ID (e.g., midi_123)
        if (currentTrackId) {
          cvpj.track_placements[currentTrackId] = trackPlacementData;
        } else {
          Log.Warning(
            `Could not add placement data for track ${trackName} (ID: ${trackId}) due to missing fxLoc ID.`
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
            trackId, // Original Ableton ID
            trackName,
            fxLoc, // Location identifier (e.g., ["track", "midi_123"])
            outputDirectoryPath,
            file,
            1, // Start at level 1 for track devices
            doVerbose
          );
        }
      }
    } // End for loop over trackElements

    // --- Final Steps ---
    this.inOutput(cvpj); // Process collected automation data
    // fix output
    this.compat(cvpj); // Apply compatibility fixes (loop/cut removal)

    // --- MIDI Conversion ---
    const fileNameNoExtension = file.includes(".")
      ? file.substring(0, file.lastIndexOf("."))
      : file;
    const midiNotesJson = convertToMidi(cvpj, fileNameNoExtension, doVerbose);
    // TODO: Handle the returned midiNotesJson (e.g., save or process further)
    if (midiNotesJson) {
      Log.Information("Note MIDI conversion successful (JSON generated).");
    }

    const midiAutomationJsonArray = convertAutomationToMidi(
      cvpj,
      fileNameNoExtension,
      doVerbose
    );
    // TODO: Handle the returned midiAutomationJsonArray (e.g., save or process further)
    if (midiAutomationJsonArray) {
      Log.Information(
        `Automation MIDI conversion successful (${midiAutomationJsonArray.length} file(s) generated in JSON format).`
      );
    }

    // --- Audio Clip Collection (Placeholder) ---
    // C#: CollectAndCopyAudioClips(uniqueAudioClipList.ToList(), folderName ?? "", Path.Combine(outputDirectoryPath, "AudioClips"));
    Log.Information("Audio clip collection skipped in this port.");
    if (doVerbose)
      Log.Debug("Found unique audio clips:", Array.from(uniqueAudioClipList));

    Log.Information(
      "AbletonProject.handleAbletonLiveContent: Parsing completed."
    );

    return cvpj; // Return the converted project data
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
    rootXElement: any, // Root needed for XPath-like lookup (simulated)
    xDevice: any, // The device element (e.g., Eq8, PluginDevice) being processed
    trackId: string | null, // Ableton track ID
    trackName: string | null, // Track name
    fxLoc: string[], // Location identifier (e.g., ["track", "midi_123"])
    fxLocDetails: string[] // Device type and ID (e.g., ["Eq8", "5"])
  ): void {
    // add all AutomationTargets
    // Recursive function to find AutomationTarget elements and their paths
    const findAutomationTargets = (
      element: any,
      currentPath: string[] // Tracks the path down the XML structure
    ): { id: number; path: string[] }[] => {
      let targets: { id: number; path: string[] }[] = [];
      if (!element || typeof element !== "object") return targets;

      // Handle arrays by iterating through items
      if (Array.isArray(element)) {
        element.forEach(item => {
          targets = targets.concat(findAutomationTargets(item, currentPath));
        });
        return targets;
      }

      // Iterate through object keys
      for (const key in element) {
        // Skip attributes (starting with @_)
        if (key.startsWith("@_")) continue;

        const value = element[key];
        const newPath = [...currentPath, key]; // Append current key to path

        if (key === "AutomationTarget") {
          // Found an AutomationTarget element
          const targetArray = Array.isArray(value) ? value : [value]; // Ensure array
          targetArray.forEach(target => {
            if (target && typeof target === "object") {
              const idStr = this.getAttr(target, "Id", "0");
              const id = parseInt(idStr, 10);
              if (!isNaN(id) && id > 0) {
                // Store the ID and the path leading to it
                targets.push({ id: id, path: newPath });
              }
            }
          });
        } else if (value && typeof value === "object") {
          // Recursively search deeper if the value is an object or array
          targets = targets.concat(findAutomationTargets(value, newPath));
        }
      }
      return targets;
    };

    // Start the search from the device element
    // Pass only the device details as the starting path for the parameter name
    const automationTargets = findAutomationTargets(xDevice, []);

    // Process found targets
    for (const targetInfo of automationTargets) {
      const autoNumId = targetInfo.id;
      let parameterPath = "UnknownParameter"; // Default path

      // Construct a meaningful parameter path string
      // C# uses XPath, TS uses the collected path array
      const pathSegments = targetInfo.path;

      // Get path elements
      // "Ableton/LiveSet/Tracks/GroupTrack/DeviceChain/DeviceChain/Devices/AudioEffectGroupDevice/Branches/AudioEffectBranch/DeviceChain/AudioToAudioDeviceChain/Devices/AutoFilter/Cutoff/AutomationTarget"
      // "Ableton/LiveSet/Tracks/GroupTrack/DeviceChain/DeviceChain/Devices/AudioEffectGroupDevice/Branches/AudioEffectBranch/DeviceChain/AudioToAudioDeviceChain/Devices/PluginDevice/ParameterList/PluginFloatParameter/ParameterValue/AutomationTarget"
      // Example path: [ 'Volume', 'Manual', 'AutomationTarget' ]
      // Example path: [ 'ParameterList', 'PluginFloatParameter', 'ParameterValue', 'AutomationTarget' ]

      // Try to create a more readable path
      if (pathSegments.length > 1) {
        // Often the parameter name is the segment before 'AutomationTarget' or 'Manual'/'ParameterValue'
        let paramNameIndex = pathSegments.length - 2;
        if (
          pathSegments[paramNameIndex] === "Manual" ||
          pathSegments[paramNameIndex] === "ParameterValue"
        ) {
          paramNameIndex--;
        }
        if (paramNameIndex >= 0) {
          parameterPath = pathSegments[paramNameIndex];
        } else {
          // Fallback if structure is unexpected
          parameterPath = pathSegments.join("_");
        }
      } else {
        parameterPath = pathSegments.join("_"); // Fallback
      }

      // Special handling for PluginDevice based on C# logic
      if (fxLocDetails[0] === "PluginDevice") {
        // lookup VST Plugin Name using the path
        const pluginDesc = xDevice?.PluginDesc;
        const vstPluginInfo = pluginDesc?.VstPluginInfo;
        const vstPlugName = vstPluginInfo
          ? this.getValue(vstPluginInfo, "PlugName", "")
          : "";

        if (vstPlugName) {
          // Use VST name and parameter name/ID for uniqueness
          // remove PluginDevice/
          // pathFixed = pathFixed.Replace("PluginDevice", "");
          // and add back the path suffix
          // pathFixed = $"{vstPlugName}{pathFixed}";
          // pathFixed = vstPlugName; // Simplified C# logic
          parameterPath = `${vstPlugName}_${parameterPath}`;
        } else {
          parameterPath = `PluginDevice_${parameterPath}`;
        }
      } else {
        // For native devices, use device type and parameter path
        parameterPath = `${fxLocDetails[0]}_${parameterPath}`;
      }

      // add
      // Create the target object to store in the lookup map
      const autoTarget = {
        trackid: trackId,
        trackname: trackName,
        loc: fxLoc, // Store the track/master location
        details: fxLocDetails, // Store device type/id
        path: makeValidIdentifier(parameterPath), // Ensure path is a valid identifier
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
    trackId: string | null, // Original Ableton track ID
    trackName: string | null, // Name of the track
    fxLoc: string[], // Location identifier (e.g., ["track", "midi_123"])
    outputDirectoryPath: string, // Base path for saving presets (if implemented)
    file: string, // Original filename for context
    level: number = 1, // Recursion level for groups
    doVerbose?: boolean
  ): void {
    // C# comments on paths:
    // Path for MasterTrack: Ableton/LiveSet/MasterTrack/DeviceChain/DeviceChain/Devices/*
    // Path for Tracks: Ableton/LiveSet/Tracks/[Audio|Group|Midi]Track/DeviceChain/DeviceChain/Devices/*
    // where * is internal plugins like <Eq8>, <Limiter>
    // as well as <PluginDevice Id="X"> elements
    // or * can be a whole new group of effects AudioEffectGroupDevice
    // ../AudioEffectGroupDevice/Branches/AudioEffectBranch/DeviceChain/AudioToAudioDeviceChain/Devices/*
    // where * is plugins as well as another AudioEffectGroupDevice with same recursive behaviour

    // Ensure devices is an array for iteration
    let devices: any[] = [];
    if (xTrackDevicesSource) {
      // The actual devices are children of the <Devices> tag
      // e.g., <Devices><Eq8>...</Eq8><PluginDevice>...</PluginDevice></Devices>
      // We need to iterate over the *keys* of xTrackDevicesSource if it's the parsed <Devices> object
      if (
        typeof xTrackDevicesSource === "object" &&
        !Array.isArray(xTrackDevicesSource)
      ) {
        // Extract the device elements (values) from the Devices object
        devices = Object.values(xTrackDevicesSource).flat(); // Use flat in case a type has multiple instances as an array
      } else if (Array.isArray(xTrackDevicesSource)) {
        // If it's already an array (e.g., passed recursively)
        devices = xTrackDevicesSource;
      }
    }

    if (devices.length === 0) return; // No devices to process

    const fileNameNoExtension = file.includes(".")
      ? file.substring(0, file.lastIndexOf("."))
      : file;

    // Read Tracks (Devices in this context)
    if (doVerbose)
      Log.Debug(
        `Found ${devices.length} device elements for track: ${trackName ?? "Master"} ${trackId ?? ""} ${level > 1 ? `[Group Level ${level}]` : ""}`
      );

    let internalDeviceCount = 0;
    for (const deviceWrapper of devices) {
      // In fast-xml-parser, the deviceWrapper might be the object like { Eq8: { ... } }
      // or just the content if it was flattened. We need the type name (key).
      if (!deviceWrapper || typeof deviceWrapper !== "object") continue;

      // Find the actual device type key (e.g., "Eq8", "PluginDevice")
      // There should ideally be only one key representing the device type per wrapper object
      const deviceType = Object.keys(deviceWrapper).find(
        key => !key.startsWith("@_")
      );

      if (!deviceType) {
        Log.Warning(
          `doDevices: Could not determine device type for element at level ${level}, index ${internalDeviceCount}. Keys: ${Object.keys(deviceWrapper)}`
        );
        continue;
      }

      const deviceElement = deviceWrapper[deviceType];
      if (!deviceElement || typeof deviceElement !== "object") {
        Log.Warning(
          `doDevices: Invalid device element content for type ${deviceType} at level ${level}, index ${internalDeviceCount}.`
        );
        continue;
      }

      internalDeviceCount++;
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
        : true;

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

      // Add automation targets found within this device
      this.addAutomationTargets(
        rootXElement,
        deviceElement,
        trackId,
        trackName,
        fxLoc,
        [deviceType, deviceId] // Pass device type and ID
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
            // Example: steinbergFreq.write(Path.Combine(outputDirectoryPath, "Frequency", ...));
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
          // fast-xml-parser puts text content in "#text"
          const vstPluginBufferHex = xVstPluginBuffer
            ? (xVstPluginBuffer["#text"] ?? "")
            : "";

          // check if this is a zlib file
          // Serum presets are zlib compressed, but don't deflate
          // if (vstPluginBufferBytes[0] == 0x78 && vstPluginBufferBytes[1] == 0x01) ...

          // TODO: Implement VST preset saving/conversion (e.g., to FXP) if needed
          // This requires converting the hex string to bytes, similar to C#'s XmlHelpers.GetInnerValueAsByteArray
          // and then using an FXP library or logic (like C#'s SaveAsFXP).

          if (vstPluginBufferHex.length > 0) {
            const outputFileNameBase = `${fileNameNoExtension} - ${trackName ?? "Master"} - (${level}-${internalDeviceCount}) - ${makeValidFileName(vstPlugName)}`;
            Log.Information(
              `Processing VST Preset: ${outputFileNameBase} (FXP conversion skipped)`
            );
            // Example: const bytes = hexToBytes(vstPluginBufferHex);
            // Example: saveAsFXP(bytes, vstPlugName, outputDirectoryPath, outputFileNameBase);
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
            const branchAudioChain = branchDeviceChain?.AudioToAudioDeviceChain; // Specific chain type for audio effects
            const nestedDevices = branchAudioChain?.Devices;

            if (nestedDevices) {
              // Recursive call to process nested devices
              this.doDevices(
                rootXElement,
                nestedDevices, // Pass the nested <Devices> element/object
                trackId,
                trackName,
                fxLoc, // Keep the same track location context
                outputDirectoryPath,
                file,
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
          // Handle other device types generically
          const outputFileNameBase = `${fileNameNoExtension} - ${trackName ?? "Master"} - (${level}-${internalDeviceCount}) - ${deviceType}`;
          if (userName) {
            // we are likely processing an .adv preset file
            // TODO: This is not always a correct assumption!
            // C# tries to extract VST bytes from RawData here, skipped in TS
            Log.Information(
              `Processing Device/Preset (from UserName): ${userName} (${deviceType}) - Generic handling. Path: ${outputFileNameBase}`
            );
          } else {
            Log.Information(
              `Processing Generic/Unhandled Device: ${deviceType} - Path: ${outputFileNameBase}`
            );
          }
          // TODO: Implement generic preset saving (e.g., saving the raw XML part) if needed
          // Example: saveDeviceXml(deviceElement, outputDirectoryPath, outputFileNameBase);
          break;
        }
      } // End switch (deviceType)
    } // End for loop over devices
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
          placements.notes,
          new Set() // Pass an empty set (equivalent to C# HashSet)
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
    // C# calls GetDurPos, let's implement that logic here or call a helper
    const { startPos, endPos } = this.getDurPos(list);

    // Calculate duration based on min/max positions
    // Add a small buffer (e.g., 4 beats) like C# seems to do?
    const duration = endPos - startPos + 4;

    // Trim and move points relative to the start position
    // C# calls TrimMove(pointsData, durPos.Item1, durPos.Item1 + durPos.Item2);
    // The second parameter to TrimMove in C# seems wrong (should be endPos?). Let's use endPos.
    const relativePoints = this.trimMove(list, startPos, endPos); // endAt should be exclusive in trim

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

    // C# returns Tuple.Create(posFinal, durationFinal); where durationFinal is maxPos
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
  static removeLoopsDoPlacements(
    notePlacements: any[],
    outPlacementLoop: Set<string> // C# parameter, seems unused in logic
  ): any[] {
    // loops_remove.py
    const newPlacements: any[] = [];

    for (const notePlacement of notePlacements) {
      // Check if placement has 'cut' data and it's a loop type
      if (
        notePlacement.cut &&
        (notePlacement.cut.type === "loop" ||
          notePlacement.cut.type === "loop_off" ||
          notePlacement.cut.type === "loop_adv")
        // C# includes: && !outPlacementLoop.Contains(cutType) - skipping this check
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
          const notePlacementCutted = { ...notePlacementBase }; // Clone base
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
      // currentReadPos is reset to loopStart in the next iteration
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
