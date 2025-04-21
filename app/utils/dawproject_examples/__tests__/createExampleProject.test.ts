import fs from "fs";
import os from "os";
import path from "path";

import { ContentType } from "../../dawproject/contentType";
import { Referenceable } from "../../dawproject/referenceable";
import { TimeUnit } from "../../dawproject/timeline/timeUnit";
import { Track } from "../../dawproject/track";
import { createDummyProject, Features } from "../createExampleProject";

const simpleFeatures = new Set<Features>(["CLIPS", "NOTES", "AUDIO"]);
const targetDir = path.join(os.tmpdir(), "dawproject-tests");

beforeAll(() => {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
});

beforeEach(() => {
  Referenceable.resetIdCounter();
});

afterAll(() => {
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
});

describe("DAW Project", () => {
  test("should create basic project", () => {
    const project = createDummyProject(3, simpleFeatures);
    expect(project).toBeDefined();
    expect(project.structure.length).toBe(4); // 3 tracks + master
    expect(project.arrangement).toBeDefined();
  });

  test("should have master track", () => {
    const project = createDummyProject(1, simpleFeatures);
    const masterTrack = project.structure[0] as Track;
    expect(masterTrack.name).toBe("Master");
    expect(masterTrack.channel).toBeDefined();
  });

  test("should handle all features", () => {
    const project = createDummyProject(
      3,
      new Set<Features>([
        "CUE_MARKERS",
        "CLIPS",
        "AUDIO",
        "NOTES",
        "AUTOMATION",
        "ALIAS_CLIPS",
        "PLUGINS",
      ])
    );

    // Verify arrangement exists
    expect(project.arrangement).toBeDefined();

    if (project.arrangement) {
      // Check markers
      expect(project.arrangement.markers).toBeDefined();
      expect(project.arrangement.markers?.markers.length).toBe(2);
    }

    // Check master track plugins
    const masterTrack = project.structure[0] as Track;
    expect(masterTrack.channel?.devices).toBeDefined();
    expect(masterTrack.channel?.devices?.length).toBeGreaterThan(0);

    // Check track routing
    const regularTrack = project.structure[1] as Track;
    expect(regularTrack.channel?.destination).toBe(masterTrack.channel);
  });

  test("should create correct track structure", () => {
    const project = createDummyProject(2, simpleFeatures);

    // Check track count
    expect(project.structure.length).toBe(3); // 2 tracks + master

    // Check track names
    const tracks = project.structure as Track[];
    expect(tracks[0].name).toBe("Master");
    expect(tracks[1].name).toBe("Track 1");
    expect(tracks[2].name).toBe("Track 2");

    // Check arrangement
    expect(project.arrangement?.lanes?.timeUnit).toBe(TimeUnit.BEATS);
  });

  test("should create correct lane content", () => {
    const project = createDummyProject(1, new Set(["CLIPS", "NOTES"]));

    if (project.arrangement?.lanes) {
      const trackLanes = project.arrangement.lanes.lanes;
      expect(trackLanes.length).toBeGreaterThan(0);

      // Find track with notes capability
      const notesTrack = trackLanes.find(lane => {
        if (lane instanceof Track) {
          return lane.contentType.includes(ContentType.NOTES);
        }
        return false;
      }) as Track | undefined;

      expect(notesTrack).toBeDefined();
      expect(notesTrack?.contentType).toContain(ContentType.NOTES);
    }
  });

  test("should create automation points", () => {
    const project = createDummyProject(1, new Set(["AUTOMATION"]));

    if (project.arrangement?.lanes) {
      const trackLanes = project.arrangement.lanes.lanes;

      // Find automation points
      const pointsLane = trackLanes.find(lane => {
        if (lane instanceof Track) {
          return lane.contentType.includes(ContentType.AUTOMATION);
        }
        return false;
      });

      expect(pointsLane).toBeDefined();
      if (pointsLane instanceof Track) {
        expect(pointsLane.contentType).toContain(ContentType.AUTOMATION);
      }
    }
  });
});

export type { Features };
