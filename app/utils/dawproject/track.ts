import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { Channel } from "./channel";
import { ContentType } from "./contentType";
import { Lane } from "./lane";
import { ITrack } from "./types";
import { XML_BUILDER_OPTIONS, XML_PARSER_OPTIONS } from "./xml/options";

/** Represents a sequencer track.  */
export class Track extends Lane implements ITrack {
  /** Role of this track in timelines & arranger. Can be multiple (comma-separated). */
  contentType: ContentType[];
  /** If this track is loaded/active of not. */
  loaded?: boolean;
  /** Mixer channel used for the output of this track. */
  channel?: Channel;
  /** Child tracks, typically used to represent group/folder tracks with contentType="tracks". */
  tracks: Track[]; // Nested tracks

  constructor(
    contentType: ContentType[] = [],
    loaded?: boolean,
    channel?: Channel,
    tracks?: Track[],
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(name, color, comment);
    this.contentType = contentType;
    this.loaded = loaded;
    this.channel = channel;
    this.tracks = tracks || [];
  }

  toXmlObject(): any {
    const obj: any = {
      Track: {
        ...super.getXmlAttributes(), // Get attributes from Lane
      },
    };

    // Set content_type as XML attribute
    if (this.contentType && this.contentType.length > 0) {
      obj.Track["@_contentType"] = this.contentType.join(",");
    }

    // Set loaded as XML attribute
    if (this.loaded !== undefined) {
      obj.Track["@_loaded"] = this.loaded;
    }

    // Append Channel as a nested XML element if present
    if (this.channel) {
      obj.Track.Channel = this.channel.toXmlObject().Channel;
    }

    // Recursively add nested tracks
    if (this.tracks && this.tracks.length > 0) {
      obj.Track.Track = this.tracks.map(track => track.toXmlObject().Track);
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Track {
    const instance = new Track(); // Create instance of Track
    instance.populateFromXml(xmlObject); // Populate inherited attributes

    // Extract contentType text and split into a list
    instance.contentType = xmlObject["@_contentType"]
      ? (String(xmlObject["@_contentType"]).split(",") as ContentType[])
      : []; // Cast strings to ContentType

    // Parse the loaded attribute
    instance.loaded =
      xmlObject["@_loaded"] !== undefined
        ? String(xmlObject["@_loaded"]).toLowerCase() === "true"
        : undefined;

    // Initialize channel using Channel's fromXmlObject method if present
    if (xmlObject.Channel) {
      instance.channel = Channel.fromXmlObject({ Channel: xmlObject.Channel }); // Wrap in expected structure
    }

    // Recursively parse nested Track elements
    const tracks: Track[] = [];
    if (xmlObject.Track) {
      const trackArray = Array.isArray(xmlObject.Track)
        ? xmlObject.Track
        : [xmlObject.Track];
      trackArray.forEach((trackObj: any) => {
        tracks.push(Track.fromXmlObject(trackObj)); // Assuming Track has fromXmlObject
      });
    }
    instance.tracks = tracks;

    return instance;
  }

  static fromXml(xmlString: string): Track {
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return Track.fromXmlObject(jsonObj.Track);
  }
}
