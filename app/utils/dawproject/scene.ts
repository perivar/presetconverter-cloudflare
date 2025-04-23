import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { Referenceable } from "./referenceable";
import { TimelineRegistry } from "./registry/timelineRegistry";
import { Timeline } from "./timeline/timeline";
import { IScene } from "./types";
import { XML_BUILDER_OPTIONS, XML_PARSER_OPTIONS } from "./xml/options";

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
    const builder = new XMLBuilder(XML_BUILDER_OPTIONS);
    return builder.build(this.toXmlObject());
  }

  static fromXmlObject(xmlObject: any): Scene {
    const instance = new Scene(); // Create instance
    instance.populateFromXml(xmlObject); // Populate inherited attributes

    // Handle content if present
    let content: Timeline | undefined;
    if (xmlObject.Content) {
      const contentObj = xmlObject.Content;
      const tagName = Object.keys(contentObj)[0]; // Get the actual content tag name
      const TimelineClass = TimelineRegistry.getTimelineClass(tagName);

      if (TimelineClass) {
        try {
          content = TimelineClass.fromXmlObject(contentObj[tagName]);
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
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const jsonObj = parser.parse(xmlString);
    return Scene.fromXmlObject(jsonObj.Scene);
  }
}
