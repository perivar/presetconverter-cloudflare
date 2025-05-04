import { Channel } from "./channel";
import { ContentType } from "./contentType";
import { Lane } from "./lane";
import { ITrack } from "./types";

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
        ...super.toXmlObject(), // Get attributes from Lane
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

  fromXmlObject(xmlObject: any): this {
    super.fromXmlObject(xmlObject); // Populate inherited attributes from Lane

    // Extract contentType text and split into a list
    this.contentType = xmlObject["@_contentType"]
      ? (String(xmlObject["@_contentType"]).split(",") as ContentType[])
      : []; // Cast strings to ContentType

    // Parse the loaded attribute
    this.loaded =
      xmlObject["@_loaded"] !== undefined
        ? String(xmlObject["@_loaded"]).toLowerCase() === "true"
        : undefined;

    // Initialize channel using Channel's fromXmlObject method if present
    if (xmlObject.Channel) {
      this.channel = new Channel().fromXmlObject({
        Channel: xmlObject.Channel,
      });
    }

    // Recursively parse nested Track elements
    const tracks: Track[] = [];
    if (xmlObject.Track) {
      const trackArray = Array.isArray(xmlObject.Track)
        ? xmlObject.Track
        : [xmlObject.Track];
      trackArray.forEach((trackObj: any) => {
        tracks.push(new Track().fromXmlObject(trackObj));
      });
    }
    this.tracks = tracks;

    return this;
  }
}
