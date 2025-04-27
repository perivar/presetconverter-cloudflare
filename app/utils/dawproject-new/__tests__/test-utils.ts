import { Application } from "../application";
import { Arrangement } from "../arrangement";
import { AutomationTarget } from "../automation-target";
import { Clip } from "../clip";
import { Clips } from "../clips";
import { FileReference } from "../file-reference";
import { Lanes } from "../lanes";
import { Marker } from "../marker";
import { Markers } from "../markers";
import { Note } from "../note";
import { Notes } from "../notes";
import { Points } from "../points";
import { Project } from "../project";
import { RealParameter } from "../real-parameter";
import { RealPoint } from "../real-point";
import { Referenceable } from "../referenceable";
import { Transport } from "../transport";
import { Utility } from "../utility";
import { Vst3Plugin } from "../vst3-plugin";
import { Warp } from "../warp";
import { Warps } from "../warps";

export enum Features {
  CUE_MARKERS = "CUE_MARKERS",
  CLIPS = "CLIPS",
  AUDIO = "AUDIO",
  NOTES = "NOTES",
  AUTOMATION = "AUTOMATION",
  ALIAS_CLIPS = "ALIAS_CLIPS",
  PLUGINS = "PLUGINS",
}

export const simpleFeatures = new Set([
  Features.CLIPS,
  Features.NOTES,
  Features.AUDIO,
]);

export function createEmptyProject(): Project {
  Referenceable.resetID();
  const application = new Application("Test App", "1.0.0");
  return new Project(application);
}

export function createDummyProject(
  numTracks: number,
  features: Set<Features>
): Project {
  const project = createEmptyProject();

  const masterTrack = Utility.createTrack(
    "Master",
    new Set(),
    "master",
    1,
    0.5
  );
  project.Structure.push(masterTrack);

  if (features.has(Features.PLUGINS)) {
    const limiter = new Vst3Plugin("Limiter", "audioFX");
    limiter.State = new FileReference("plugin-states/12323545.vstpreset");
    masterTrack.Channel!.Device!.push(limiter);
  }

  project.Arrangement = new Arrangement();
  const arrangementLanes = new Lanes();
  arrangementLanes["@_timeUnit"] = "beats";
  project.Arrangement.Lanes = arrangementLanes;

  if (features.has(Features.CUE_MARKERS)) {
    const cueMarkers = new Markers();
    project.Arrangement.Markers = cueMarkers;
    cueMarkers.Marker.push(createMarker(0, "Verse"));
    cueMarkers.Marker.push(createMarker(24, "Chorus"));
  }

  for (let i = 0; i < numTracks; i++) {
    const track = Utility.createTrack(
      `Track ${i + 1}`,
      new Set(["notes"]),
      "regular",
      1,
      0.5
    );
    project.Structure.push(track);
    track["@_color"] = `#${i}${i}${i}${i}${i}${i}`;
    track.Channel!["@_destination"] = masterTrack["@_id"];

    const trackLanes = new Lanes();
    trackLanes["@_track"] = track["@_id"];
    arrangementLanes.Lanes.push(trackLanes);

    if (features.has(Features.CLIPS)) {
      const clips = new Clips();
      trackLanes.Clips.push(clips);

      const notes = new Notes();
      for (let j = 0; j < 8; j++) {
        const note = new Note(
          (0.5 * j).toString(),
          "0.5",
          36 + 12 * (j % (1 + i)),
          0,
          "0.8",
          "0.5"
        );
        notes.Note.push(note);
      }

      const clip = new Clip(8 * i, 4.0, `Clip ${i}`);
      clip.setContent(notes);
      clips.Clip.push(clip);

      if (features.has(Features.ALIAS_CLIPS)) {
        const aliasClip = new Clip(32 + 8 * i, 4.0, `Alias Clip ${i}`);
        aliasClip["@_reference"] = notes["@_id"];
        clips.Clip.push(aliasClip);
      }

      if (i === 0 && features.has(Features.AUTOMATION)) {
        const volumeAutomation = new Points(new AutomationTarget());
        volumeAutomation.Target["@_parameter"] = track.Channel!.Volume!["@_id"];
        volumeAutomation["@_track"] = track["@_id"];
        trackLanes.Points.push(volumeAutomation);

        // fade-in over 8 quarter notes using Point array
        volumeAutomation.Point.push(createPoint(0.0, 0.0, "linear"));
        volumeAutomation.Point.push(createPoint(8.0, 1.0, "linear"));
      }
    }
  }

  return project;
}

export enum AudioScenario {
  Warped = "Warped",
  RawBeats = "RawBeats",
  RawSeconds = "RawSeconds",
  FileWithAbsolutePath = "FileWithAbsolutePath",
  FileWithRelativePath = "FileWithRelativePath",
}

export function shouldTestOffsetAndFades(scenario: AudioScenario): boolean {
  switch (scenario) {
    case AudioScenario.Warped:
    case AudioScenario.RawBeats:
    case AudioScenario.RawSeconds:
      return true;
    default:
      return false;
  }
}

export function createAudioProject(
  playStartOffset: number,
  clipTime: number,
  scenario: AudioScenario,
  withFades: boolean
): Project {
  const project = createEmptyProject();

  const masterTrack = Utility.createTrack(
    "Master",
    new Set(),
    "master",
    1,
    0.5
  );
  const audioTrack = Utility.createTrack(
    "Audio",
    new Set(["audio"]),
    "regular",
    1,
    0.5
  );
  audioTrack.Channel!["@_destination"] = masterTrack["@_id"];

  project.Structure.push(masterTrack);
  project.Structure.push(audioTrack);

  project.Arrangement = new Arrangement();
  project.Transport = new Transport();
  project.Transport.Tempo = new RealParameter("bpm");
  project.Transport.Tempo["@_value"] = "155.0";

  const arrangementLanes = new Lanes();
  project.Arrangement.Lanes = arrangementLanes;
  const arrangementIsInSeconds = scenario === AudioScenario.RawSeconds;
  arrangementLanes["@_timeUnit"] = arrangementIsInSeconds ? "seconds" : "beats";

  const sample = "white-glasses.wav";
  const sampleDuration = 3.097;
  const audio = Utility.createAudio(sample, 44100, 2, sampleDuration);

  if (scenario === AudioScenario.FileWithAbsolutePath) {
    audio.File["@_external"] = true;
    audio.File["@_path"] = `/path/to/test-data/${sample}`;
  } else if (scenario === AudioScenario.FileWithRelativePath) {
    audio.File["@_external"] = true;
    audio.File["@_path"] = `../test-data/${sample}`;
  }

  let audioClip: Clip;

  if (scenario === AudioScenario.Warped) {
    const warps = new Warps("seconds");
    warps.Warp.push(new Warp(0, 0));
    warps.Warp.push(new Warp(8, sampleDuration));

    audioClip = new Clip(clipTime, 8);
    audioClip.setContent(warps);
    audioClip["@_contentTimeUnit"] = "beats";
    audioClip["@_playStart"] = playStartOffset;

    if (withFades) {
      audioClip["@_fadeTimeUnit"] = "beats";
      audioClip["@_fadeInTime"] = 0.25;
      audioClip["@_fadeOutTime"] = 0.25;
    }
  } else {
    audioClip = new Clip(clipTime, arrangementIsInSeconds ? sampleDuration : 8);
    audioClip.setContent(audio);
    audioClip["@_contentTimeUnit"] = "seconds";
    audioClip["@_playStart"] = playStartOffset;
    audioClip["@_playStop"] = sampleDuration;

    if (withFades) {
      audioClip["@_fadeTimeUnit"] = "seconds";
      audioClip["@_fadeInTime"] = 0.1;
      audioClip["@_fadeOutTime"] = 0.1;
    }
  }

  const clips = new Clips();
  clips.Clip.push(audioClip);
  clips["@_track"] = audioTrack["@_id"];
  arrangementLanes.Clips.push(clips);

  return project;
}

export function createMidiAutomationProject(
  inClips: boolean,
  isPitchBend: boolean
): Project {
  const project = createEmptyProject();

  const masterTrack = Utility.createTrack(
    "Master",
    new Set(),
    "master",
    1,
    0.5
  );
  const instrumentTrack = Utility.createTrack(
    "Notes",
    new Set(["notes"]),
    "regular",
    1,
    0.5
  );
  instrumentTrack.Channel!["@_destination"] = masterTrack["@_id"];

  project.Structure.push(masterTrack);
  project.Structure.push(instrumentTrack);

  project.Arrangement = new Arrangement();
  project.Transport = new Transport();
  project.Transport.Tempo = new RealParameter("bpm");
  project.Transport.Tempo["@_value"] = "123.0";

  const arrangementLanes = new Lanes();
  project.Arrangement.Lanes = arrangementLanes;
  arrangementLanes["@_timeUnit"] = "beats";

  const automation = new Points(new AutomationTarget());
  automation["@_unit"] = "normalized";

  if (isPitchBend) {
    automation.Target["@_expression"] = "pitchBend";
    automation.Target["@_channel"] = 0;
  } else {
    automation.Target["@_expression"] = "channelController";
    automation.Target["@_channel"] = 0;
    automation.Target["@_controller"] = 1;
  }

  // Add automation points using Point array
  automation.Point.push(createPoint(0, 0.0, "linear"));
  automation.Point.push(createPoint(1, 0.0, "linear"));
  automation.Point.push(createPoint(2, 0.5, "linear"));
  automation.Point.push(createPoint(3, 0.5, "linear"));
  automation.Point.push(createPoint(4, 1.0, "linear"));
  automation.Point.push(createPoint(5, 1.0, "linear"));
  automation.Point.push(createPoint(6, 0.5, "linear"));
  automation.Point.push(createPoint(7, 1, "hold"));
  automation.Point.push(createPoint(8, 0.5, "hold"));

  if (inClips) {
    const noteClip = new Clip(0, 8);
    noteClip.setContent(automation);
    const clips = new Clips();
    clips.Clip.push(noteClip);
    clips["@_track"] = instrumentTrack["@_id"];
    arrangementLanes.Clips.push(clips);
  } else {
    automation["@_track"] = instrumentTrack["@_id"];
    arrangementLanes.Points.push(automation);
  }

  return project;
}

function createMarker(time: number, name: string): Marker {
  const marker = new Marker(time, name);
  return marker;
}

function createPoint(
  time: number,
  value: number,
  interpolation: "linear" | "hold"
): RealPoint {
  return new RealPoint(time.toString(), value.toString(), interpolation);
}
