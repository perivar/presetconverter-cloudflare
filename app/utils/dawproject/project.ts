import { Application } from "./application";
import { Arrangement } from "./arrangement";
import { Lane } from "./lane";
import { LaneRegistry } from "./registry/laneRegistry";
import { Scene } from "./scene";
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
      ? new Application().fromXmlObject(xmlObject.Application)
      : new Application();

    this.transport = xmlObject.Transport
      ? new Transport().fromXmlObject(xmlObject.Transport)
      : undefined;

    const structure: Lane[] = [];
    if (xmlObject.Structure) {
      // Use the LaneRegistry to determine the correct subclass of Lane
      for (const tagName in xmlObject.Structure) {
        // Skip attributes (those starting with @_)
        if (tagName.startsWith("@_")) continue;

        const laneData = xmlObject.Structure[tagName];
        const laneArray = Array.isArray(laneData) ? laneData : [laneData];

        laneArray.forEach((laneObj: any) => {
          try {
            const laneInstance = LaneRegistry.createLaneFromXml(
              tagName,
              laneObj
            );
            if (laneInstance) {
              structure.push(laneInstance);
            } else {
              console.warn(
                `Skipping deserialization of unknown nested lane element in Structure: ${tagName}`
              );
            }
          } catch (e) {
            console.error(
              `Error deserializing nested lane element in Structure: ${tagName}`,
              e
            );
          }
        });
      }
    }
    this.structure = structure;

    this.arrangement = xmlObject.Arrangement
      ? new Arrangement().fromXmlObject(xmlObject.Arrangement)
      : undefined;

    const scenes: Scene[] = [];
    if (xmlObject.Scenes && xmlObject.Scenes.Scene) {
      const sceneArray = Array.isArray(xmlObject.Scenes.Scene)
        ? xmlObject.Scenes.Scene
        : [xmlObject.Scenes.Scene];

      sceneArray.forEach((sceneObj: any) => {
        scenes.push(new Scene().fromXmlObject(sceneObj));
      });
    }
    this.scenes = scenes;

    return this;
  }
}
