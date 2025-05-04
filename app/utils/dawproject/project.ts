import { Application } from "./application";
import { Arrangement } from "./arrangement";
import { Channel } from "./channel";
import { Lane } from "./lane";
import { Scene } from "./scene";
import { Track as TrackLane } from "./track";
import { Transport } from "./transport";
import { IProject } from "./types";
import { XmlObject } from "./XmlObject";

/** The main root element of the DAWPROJECT format. This is stored in the file project.xml file inside the container. */
export class Project extends XmlObject implements IProject {
  static CURRENT_VERSION = "1.0";

  /** Version of DAWPROJECT format this file was saved as. */
  version: string;
  /** Metadata (name/version) about the application that saved this file. */
  application: Application;
  /** Transport element containing playback parameters such as Tempo and Time-signature. */
  transport?: Transport;
  /** Track/Channel structure of this file. */
  structure: Lane[];
  /** The main Arrangement timeline of this file. */
  arrangement?: Arrangement;
  /** Clip Launcher scenes of this file. */
  scenes: Scene[];

  constructor(
    version?: string,
    application?: Application,
    transport?: Transport,
    structure?: Lane[],
    arrangement?: Arrangement,
    scenes?: Scene[]
  ) {
    super();
    this.version = version || Project.CURRENT_VERSION;
    this.application = application || new Application(); // Provide default values for required attributes
    this.transport = transport;
    this.structure = structure || [];
    this.arrangement = arrangement;
    this.scenes = scenes || [];
  }

  toXmlObject(): any {
    const obj: any = {
      Project: {
        "@_version": this.version,
      },
    };

    // Correctly handling Application element with attributes
    if (this.application) {
      obj.Project.Application = this.application.toXmlObject().Application;
    }

    if (this.transport) {
      obj.Project.Transport = this.transport.toXmlObject().Transport;
    }

    if (this.structure && this.structure.length > 0) {
      obj.Project.Structure = {
        // Need to handle different types of Lane subclasses
        ...this.structure.reduce((acc: any, lane) => {
          const laneObj = lane.toXmlObject();
          const tagName = Object.keys(laneObj)[0]; // Get the root tag name from the object
          if (!acc[tagName]) {
            acc[tagName] = [];
          }
          acc[tagName].push(laneObj[tagName]);
          return acc;
        }, {}),
      };
    }

    if (this.arrangement) {
      obj.Project.Arrangement = this.arrangement.toXmlObject().Arrangement;
    }

    if (this.scenes && this.scenes.length > 0) {
      obj.Project.Scenes = {
        Scene: this.scenes.map(scene => scene.toXmlObject().Scene),
      };
    }

    return obj;
  }

  fromXmlObject(xmlObject: any): this {
    this.version = xmlObject["@_version"] || Project.CURRENT_VERSION;
    this.application = xmlObject.Application
      ? new Application().fromXmlObject({ Application: xmlObject.Application })
      : new Application();

    this.transport = xmlObject.Transport
      ? new Transport().fromXmlObject({ Transport: xmlObject.Transport })
      : undefined;

    const structure: Lane[] = [];
    if (xmlObject.Structure) {
      // Need a mechanism to determine the correct subclass of Lane
      // based on the XML element tag (e.g., Lane, Channel, Track, etc.)
      const laneTypeMap: { [key: string]: (obj: any) => any } = {
        Channel: new Channel().fromXmlObject,
        Track: new TrackLane().fromXmlObject,
        // Add other concrete Lane subclasses here
      };

      for (const tagName in xmlObject.Structure) {
        if (laneTypeMap[tagName]) {
          const laneData = xmlObject.Structure[tagName];
          const laneArray = Array.isArray(laneData) ? laneData : [laneData];
          laneArray.forEach((laneObj: any) => {
            try {
              structure.push(laneTypeMap[tagName](laneObj) as Lane); // Cast to Lane
            } catch (e) {
              console.error(
                `Error deserializing nested lane element in Structure: ${tagName}`,
                e
              );
            }
          });
        } else {
          console.warn(
            `Skipping deserialization of unknown nested lane element in Structure: ${tagName}`
          );
        }
      }
    }

    this.arrangement = xmlObject.Arrangement
      ? new Arrangement().fromXmlObject({ Arrangement: xmlObject.Arrangement })
      : undefined;

    const scenes: Scene[] = [];
    if (xmlObject.Scenes && xmlObject.Scenes.Scene) {
      const sceneArray = Array.isArray(xmlObject.Scenes.Scene)
        ? xmlObject.Scenes.Scene
        : [xmlObject.Scenes.Scene];
      sceneArray.forEach((sceneObj: any) => {
        // This part needs a mechanism to determine the correct subclass of Scene content
        // Currently, Scene is the only concrete subclass, but use a map for consistency
        const sceneTypeMap: { [key: string]: (obj: any) => any } = {
          Scene: new Scene().fromXmlObject,
          // Add other concrete Scene subclasses here
        };

        const tagName = Object.keys(sceneObj)[0]; // Get the actual scene tag name
        if (sceneTypeMap[tagName]) {
          try {
            scenes.push(sceneTypeMap[tagName](sceneObj[tagName]) as Scene); // Cast to Scene
          } catch (e) {
            console.error(
              `Error deserializing nested scene content: ${tagName}`,
              e
            );
          }
        } else {
          console.warn(
            `Skipping deserialization of unknown nested scene content: ${tagName}`
          );
        }
      });
    }

    this.structure = structure;
    this.scenes = scenes;

    return this;
  }
}
