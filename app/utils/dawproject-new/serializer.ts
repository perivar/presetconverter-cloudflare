// dawproject/serializer.ts
import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { Application } from "./application";
import { Arrangement } from "./arrangement";
import { AuPlugin } from "./au-plugin";
import { Audio } from "./audio";
import { AutomationTarget } from "./automation-target";
import { BoolParameter } from "./bool-parameter";
import { BoolPoint } from "./bool-point";
import { Channel } from "./channel";
import { ClapPlugin } from "./clap-plugin";
import { Clip } from "./clip";
import { ClipSlot } from "./clip-slot";
import { Clips } from "./clips";
import { Compressor } from "./compressor";
import { Device } from "./device";
import { EnumParameter } from "./enum-parameter";
import { EnumPoint } from "./enum-point";
import { EqBand } from "./eq-band";
import { Equalizer } from "./equalizer";
import { FileReference } from "./file-reference";
import { IntegerParameter } from "./integer-parameter";
import { IntegerPoint } from "./integer-point";
import { Lane } from "./lane";
import { Lanes } from "./lanes";
import { Limiter } from "./limiter";
import { Marker } from "./marker";
import { Markers } from "./markers";
import { MediaFile } from "./media-file";
import { MetaData } from "./metadata";
import { Nameable } from "./nameable";
import { NoiseGate } from "./noise-gate";
import { Note } from "./note";
import { Parameter } from "./parameter";
import { Points } from "./points";
import { Project } from "./project";
import { RealParameter } from "./real-parameter";
import { RealPoint } from "./real-point";
import { Referenceable } from "./referenceable";
import { Scene } from "./scene";
import { Send } from "./send";
import { TimeSignatureParameter } from "./time-signature-parameter";
import { TimeSignaturePoint } from "./time-signature-point";
import { Timeline } from "./timeline";
import { Track } from "./track";
import { Transport } from "./transport";
import { Video } from "./video";
import { Vst2Plugin } from "./vst2-plugin";
import { Vst3Plugin } from "./vst3-plugin";
import { Warp } from "./warp";
import { Warps } from "./warps";

// Interface for serialized project structure
interface SerializedProject extends Omit<Project, "Structure"> {
  Structure?: {
    Track?: Lane[];
    Channel?: Lane[];
  };
}

const parserOptions = {
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
  allowBooleanAttributes: true,
};

const builderOptions = {
  attributeNamePrefix: "@_",
  ignoreAttributes: false,
  suppressBooleanAttributes: false,
  format: true,
  indentBy: "    ",
  suppressEmptyNode: true,
};

const parser = new XMLParser(parserOptions);
const builder = new XMLBuilder(builderOptions);

/**
 * Serializes a DAW project object to an XML string.
 * @param project The DAW project object to serialize.
 * @returns The XML string representation of the project.
 */
export function serializeProject(project: Project): string {
  // Create a copy of the project to modify the structure
  const serializedProject: SerializedProject = {
    ...project,
    Structure: undefined, // Clear the original structure
  };

  // If there are structure elements, wrap them in a Structure object
  if (project.Structure && project.Structure.length > 0) {
    // Split Lane elements into Tracks and Channels
    const tracks = project.Structure.filter(
      element => element instanceof Track
    );
    const channels = project.Structure.filter(
      element => element instanceof Channel
    );

    serializedProject.Structure = {};
    if (tracks.length > 0) {
      serializedProject.Structure.Track = tracks;
    }
    if (channels.length > 0) {
      serializedProject.Structure.Channel = channels;
    }
  }

  // The root element name is "Project"
  const jsonObj = { Project: serializedProject };
  return builder.build(jsonObj);
}

const classMap: { [key: string]: any } = {
  Project: Project,
  Application: Application,
  Transport: Transport,
  Arrangement: Arrangement,
  Scene: Scene, // Scene is a child of Scenes
  Track: Track, // Track is a choice in Structure
  Channel: Channel, // Channel is a choice in Structure
  Lanes: Lanes,
  Clip: Clip,
  Clips: Clips,
  ClipSlot: ClipSlot,
  Markers: Markers,
  Marker: Marker,
  Warps: Warps,
  Warp: Warp,
  Audio: Audio,
  Video: Video,
  Points: Points,
  AutomationTarget: AutomationTarget,
  RealParameter: RealParameter,
  BoolParameter: BoolParameter,
  IntegerParameter: IntegerParameter,
  EnumParameter: EnumParameter,
  TimeSignatureParameter: TimeSignatureParameter,
  RealPoint: RealPoint,
  BoolPoint: BoolPoint,
  IntegerPoint: IntegerPoint,
  EnumPoint: EnumPoint,
  TimeSignaturePoint: TimeSignaturePoint,
  FileReference: FileReference,
  EqBand: EqBand,
  Equalizer: Equalizer,
  Compressor: Compressor,
  NoiseGate: NoiseGate,
  Limiter: Limiter,
  AuPlugin: AuPlugin,
  ClapPlugin: ClapPlugin,
  Vst2Plugin: Vst2Plugin,
  Vst3Plugin: Vst3Plugin,
  Send: Send,
  Note: Note,
  Nameable: Nameable, // Although abstract, might be needed for type checking
  Referenceable: Referenceable, // Although abstract, might be needed for type checking
  Timeline: Timeline, // Although abstract, might be needed for type checking
  Device: Device, // Although abstract, might be needed for type checking
  Parameter: Parameter, // Although abstract, might be needed for type checking
  MediaFile: MediaFile, // Although abstract, might be needed for type checking
  MetaData: MetaData,
};

/**
 * Recursively deserializes a JSON object representing an XML element into a TypeScript class instance.
 * @param jsonElement The JSON object for the element.
 * @param expectedType The expected TypeScript class constructor.
 * @returns An instance of the expected TypeScript class.
 */
function deserializeElement(jsonElement: any, expectedType: any): any {
  if (!jsonElement) {
    return undefined;
  }

  // Handle arrays of elements
  if (Array.isArray(jsonElement)) {
    return jsonElement.map(item => deserializeElement(item, expectedType));
  }

  let instance: any;

  // Handle specific classes with required constructor parameters
  if (expectedType === Project) {
    const applicationJson = jsonElement.Application;
    const application = deserializeElement(applicationJson, Application);
    instance = new Project(application, jsonElement["@_version"]);
    // Manually assign other optional properties
    if (jsonElement.Transport) {
      instance.Transport = deserializeElement(jsonElement.Transport, Transport);
    }
    if (jsonElement.Structure) {
      // Structure contains a choice of Track or Channel (unbounded)
      // Need to iterate through the children and determine their type
      instance.Structure = [];
      for (const key in jsonElement.Structure) {
        if (key === "Track") {
          instance.Structure = instance.Structure.concat(
            deserializeElement(jsonElement.Structure.Track, Track)
          );
        } else if (key === "Channel") {
          instance.Structure = instance.Structure.concat(
            deserializeElement(jsonElement.Structure.Channel, Channel)
          );
        }
      }
    }
    if (jsonElement.Arrangement) {
      instance.Arrangement = deserializeElement(
        jsonElement.Arrangement,
        Arrangement
      );
    }
    if (jsonElement.Scenes) {
      // Scenes contains unbounded Scene elements
      instance.Scenes = deserializeElement(jsonElement.Scenes.Scene, Scene);
    }
  } else if (expectedType === Application) {
    instance = new Application(jsonElement["@_name"], jsonElement["@_version"]);
  } else if (expectedType === Marker) {
    instance = new Marker(
      jsonElement["@_time"],
      jsonElement["@_name"],
      jsonElement["@_color"],
      jsonElement["@_comment"]
    );
  } else if (expectedType === Clip) {
    instance = new Clip(
      jsonElement["@_time"],
      jsonElement["@_duration"],
      jsonElement["@_name"],
      jsonElement["@_color"],
      jsonElement["@_comment"],
      jsonElement["@_contentTimeUnit"],
      jsonElement["@_playStart"],
      jsonElement["@_playStop"],
      jsonElement["@_loopStart"],
      jsonElement["@_loopEnd"],
      jsonElement["@_fadeTimeUnit"],
      jsonElement["@_fadeInTime"],
      jsonElement["@_fadeOutTime"],
      jsonElement["@_reference"]
    );
    if (jsonElement.content) {
      // Clip content is a choice, need to determine the actual type
      for (const key in jsonElement.content) {
        const contentType = classMap[key];
        if (contentType) {
          instance.setContent(
            deserializeElement(jsonElement.content[key], contentType)
          );
          break; // Only one content element is allowed
        }
      }
    }
  }
  // Add more specific deserialization logic for other classes with required constructor parameters here
  else {
    // Default deserialization for classes without required constructor parameters
    instance = new expectedType();
    for (const key in jsonElement) {
      if (key.startsWith("@_")) {
        instance[key] = jsonElement[key];
      } else {
        const childJson = jsonElement[key];
        const childExpectedType = classMap[key];
        if (childExpectedType) {
          instance[key] = deserializeElement(childJson, childExpectedType);
        } else {
          instance[key] = childJson;
        }
      }
    }
  }

  return instance;
}

/**
 * Deserializes an XML string to a DAW project object.
 * @param xmlString The XML string to deserialize.
 * @returns The deserialized DAW project object.
 */
export function deserializeProject(xmlString: string): Project {
  const jsonObj = parser.parse(xmlString);
  // Assuming the root element is "Project"
  const projectJson = jsonObj.Project;

  if (!projectJson) {
    throw new Error(
      "Invalid DAW project XML: Root 'Project' element not found."
    );
  }

  // Start deserialization from the root Project element
  const project = deserializeElement(projectJson, Project);

  return project;
}
