import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { Arrangement } from "./arrangement";
import { Channel } from "./channel";
import { Referenceable } from "./referenceable";
import { Scene as SceneTimeline } from "./scene"; // Renamed to avoid conflict
import { Audio } from "./timeline/audio";
import { Clips } from "./timeline/clips";
import { ClipSlot } from "./timeline/clipSlot";
import { Markers } from "./timeline/markers";
import { Notes } from "./timeline/notes";
import { Points } from "./timeline/points";
import { Timeline } from "./timeline/timeline";
import { Video } from "./timeline/video";
import { Warps } from "./timeline/warps";
import { Track } from "./track";
import { IScene } from "./types";

/** Represents a clip launcher Scene of a DAW. */
export class Scene extends Referenceable implements IScene {
  /** Content timeline of this scene, will typically be structured like this:
   * <pre>{@code
   * <Scene>
   *   <Lanes>
   *     <ClipSlot track="...">
   *        <Clip>
   *           ...
   *        </Clip>
   *     </ClipSlot>
   *      ...
   *   </Lanes>
   * </Scene>
   * }</pre>
   * */
  content?: Timeline;

  constructor(
    content?: Timeline,
    name?: string,
    color?: string,
    comment?: string
  ) {
    super(name, color, comment);
    this.content = content;
  }

  toXmlObject(): any {
    const obj: any = {
      Scene: {
        ...super.getXmlAttributes(), // Get attributes from Referenceable
      },
    };

    if (this.content) {
      // Assuming content is a Timeline subclass and has a toXmlObject method
      const contentObj = this.content.toXmlObject();
      const tagName = Object.keys(contentObj)[0];
      obj.Scene.Content = { [tagName]: contentObj[tagName] }; // Wrap in "Content" tag
    }

    return obj;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Scene {
    const instance = new Scene(); // Create instance
    instance.populateFromXml(xmlObject); // Populate inherited attributes

    let content: Timeline | undefined;
    if (xmlObject.Content) {
      // Handling content which is wrapped in a "Content" tag
      const contentObj = xmlObject.Content;
      const tagName = Object.keys(contentObj)[0]; // Get the actual content tag name

      // Need a mechanism to determine the correct subclass of Timeline
      // based on the XML element tag (e.g., Timeline, Lanes, Notes, Clips, etc.)
      const timelineTypeMap: { [key: string]: (obj: any) => any } = {
        Clips: Clips.fromXmlObject,
        Notes: Notes.fromXmlObject,
        Audio: Audio.fromXmlObject,
        Video: Video.fromXmlObject,
        Markers: Markers.fromXmlObject,
        Arrangement: Arrangement.fromXmlObject,
        Scene: SceneTimeline.fromXmlObject, // Use the renamed import
        Track: Track.fromXmlObject,
        Channel: Channel.fromXmlObject,
        ClipSlot: ClipSlot.fromXmlObject,
        Points: Points.fromXmlObject,
        Warps: Warps.fromXmlObject,
        // Add other Timeline subclasses here
      };

      if (timelineTypeMap[tagName]) {
        try {
          content = timelineTypeMap[tagName](contentObj[tagName]) as Timeline; // Cast to Timeline
        } catch (e) {
          console.error(
            `Error deserializing nested timeline content ${tagName} in Scene:`,
            e
          );
        }
      } else {
        console.warn(
          `Skipping deserialization of unknown nested timeline content in Scene: ${tagName}`
        );
      }
    }
    instance.content = content;

    return instance;
  }

  static fromXml(xmlString: string): Scene {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return Scene.fromXmlObject(jsonObj.Scene);
  }
}
