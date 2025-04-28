import fs from "fs";
import path from "path";

import { Project } from "../project";
import { Referenceable } from "../referenceable";
import { deserializeFromXml, serializeToXml } from "../xmlSerializer";
import {
  AudioScenario,
  createAudioProject,
  createDummyProject,
  createEmptyProject,
  createMidiAutomationProject,
  Features,
  simpleFeatures,
} from "./test-utils";

// Adjusted path

const targetDir = path.join(__dirname, "dawproject-tests");

beforeAll(() => {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
});

afterAll(() => {
  // if (fs.existsSync(targetDir)) {
  //   fs.rmSync(targetDir, { recursive: true, force: true });
  // }
});

describe("Serializer", () => {
  test("should serialize and deserialize an empty project", () => {
    Referenceable.resetID();
    const originalProject = createEmptyProject();

    fs.writeFileSync(
      path.join(targetDir, "dawproject_empty.json"),
      JSON.stringify(originalProject, null, 2)
    );

    const xmlString = serializeToXml(originalProject);

    fs.writeFileSync(path.join(targetDir, "dawproject_empty.xml"), xmlString);

    const deserializedProject = deserializeFromXml(xmlString, Project);

    // Deep equality check might be needed depending on object structure
    // expect(JSON.parse(JSON.stringify(deserializedProject))).toEqual(JSON.parse(JSON.stringify(originalProject)));
    // For now, a direct toEqual might work if objects are plain enough after deserialization
    expect(deserializedProject).toEqual(originalProject);
  });

  test("should serialize and deserialize a simple project", () => {
    Referenceable.resetID();
    const originalProject = createDummyProject(3, simpleFeatures);

    fs.writeFileSync(
      path.join(targetDir, "dawproject_simple.json"),
      JSON.stringify(originalProject, null, 2)
    );

    const xmlString = serializeToXml(originalProject);

    fs.writeFileSync(path.join(targetDir, "dawproject_simple.xml"), xmlString);

    const deserializedProject = deserializeFromXml(xmlString, Project);
    expect(deserializedProject).toEqual(originalProject);
  });

  test("should serialize and deserialize a complex project", () => {
    Referenceable.resetID();
    const originalProject = createDummyProject(
      3,
      new Set([
        Features.CLIPS,
        Features.NOTES,
        Features.AUDIO,
        Features.CUE_MARKERS,
        Features.AUTOMATION,
        Features.ALIAS_CLIPS,
        Features.PLUGINS,
      ])
    );

    fs.writeFileSync(
      path.join(targetDir, "dawproject_complex.json"),
      JSON.stringify(originalProject, null, 2)
    );

    const xmlString = serializeToXml(originalProject);

    fs.writeFileSync(path.join(targetDir, "dawproject_complex.xml"), xmlString);

    const deserializedProject = deserializeFromXml(xmlString, Project);
    expect(deserializedProject).toEqual(originalProject);
  });

  test("should serialize and deserialize audio examples", () => {
    const scenariosToTest = [
      { scenario: AudioScenario.Warped, offset: 0, clipTime: 0, fades: false },
      { scenario: AudioScenario.Warped, offset: 0, clipTime: 0, fades: true },
      { scenario: AudioScenario.Warped, offset: 1, clipTime: 0, fades: false },
      { scenario: AudioScenario.Warped, offset: 0, clipTime: 1, fades: false },
      {
        scenario: AudioScenario.RawBeats,
        offset: 0,
        clipTime: 0,
        fades: false,
      },
      { scenario: AudioScenario.RawBeats, offset: 0, clipTime: 0, fades: true },
      {
        scenario: AudioScenario.RawBeats,
        offset: 1,
        clipTime: 0,
        fades: false,
      },
      {
        scenario: AudioScenario.RawBeats,
        offset: 0,
        clipTime: 1,
        fades: false,
      },
      {
        scenario: AudioScenario.RawSeconds,
        offset: 0,
        clipTime: 0,
        fades: false,
      },
      {
        scenario: AudioScenario.RawSeconds,
        offset: 0,
        clipTime: 0,
        fades: true,
      },
      {
        scenario: AudioScenario.RawSeconds,
        offset: 1,
        clipTime: 0,
        fades: false,
      },
      {
        scenario: AudioScenario.RawSeconds,
        offset: 0,
        clipTime: 1,
        fades: false,
      },
      {
        scenario: AudioScenario.FileWithAbsolutePath,
        offset: 0,
        clipTime: 0,
        fades: false,
      },
      {
        scenario: AudioScenario.FileWithRelativePath,
        offset: 0,
        clipTime: 0,
        fades: false,
      },
    ];

    let scenarioCount = 0;
    scenariosToTest.forEach(({ scenario, offset, clipTime, fades }) => {
      scenarioCount++;

      const originalProject = createAudioProject(
        offset,
        clipTime,
        scenario,
        fades
      );

      fs.writeFileSync(
        path.join(targetDir, `dawproject_audio_${scenarioCount}.json`),
        JSON.stringify(originalProject, null, 2)
      );

      const xmlString = serializeToXml(originalProject);

      fs.writeFileSync(
        path.join(targetDir, `dawproject_audio_${scenarioCount}.xml`),
        xmlString
      );

      const deserializedProject = deserializeFromXml(xmlString, Project);
      expect(deserializedProject).toEqual(originalProject);
    });
  });

  test("should serialize and deserialize MIDI automation examples", () => {
    const scenariosToTest = [
      { inClips: false, isPitchBend: false },
      { inClips: true, isPitchBend: false },
      { inClips: false, isPitchBend: true },
      { inClips: true, isPitchBend: true },
    ];

    let scenarioCount = 0;
    scenariosToTest.forEach(({ inClips, isPitchBend }) => {
      scenarioCount++;

      const originalProject = createMidiAutomationProject(inClips, isPitchBend);

      fs.writeFileSync(
        path.join(targetDir, `dawproject_midi_${scenarioCount}.json`),
        JSON.stringify(originalProject, null, 2)
      );

      const xmlString = serializeToXml(originalProject);

      fs.writeFileSync(
        path.join(targetDir, `dawproject_midi_${scenarioCount}.xml`),
        xmlString
      );

      const deserializedProject = deserializeFromXml(xmlString, Project);
      expect(deserializedProject).toEqual(originalProject);
    });
  });
});
