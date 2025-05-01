import { Application } from "../application";
import { Arrangement } from "../arrangement";
import { ContentType } from "../contentType"; // Added import
import { Vst3Plugin } from "../device/vst3Plugin"; // Adjusted path, assuming it exists

import { DeviceRole } from "../deviceRole"; // Added import
import { ExpressionType } from "../expressionType"; // Added import
import { FileReference } from "../fileReference";
import { Interpolation } from "../interpolation"; // Added import
import { MixerRole } from "../mixerRole"; // Added import
import { Project } from "../project";
import { RealParameter } from "../realParameter";
import { Referenceable } from "../referenceable";
import { AutomationTarget } from "../timeline/automationTarget"; // Adjusted path
import { Clip } from "../timeline/clip"; // Adjusted path
import { Clips } from "../timeline/clips"; // Adjusted path

import { Lanes } from "../timeline/lanes"; // Adjusted path
import { Marker } from "../timeline/marker"; // Adjusted path
import { Markers } from "../timeline/markers"; // Adjusted path
import { Note } from "../timeline/note"; // Adjusted path
import { Notes } from "../timeline/notes"; // Adjusted path
import { Points } from "../timeline/points"; // Adjusted path

import { RealPoint } from "../timeline/realPoint"; // Adjusted path

import { TimeUnit } from "../timeline/timeUnit"; // Added import
import { Warp } from "../timeline/warp"; // Adjusted path
import { Warps } from "../timeline/warps"; // Adjusted path
import { Transport } from "../transport";
import { Unit } from "../unit"; // Added import
import { Utility } from "../utility";

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
  const project = new Project();
  project.application = new Application("Test App", "1.0.0");
  return project;
}

export function createDummyProject(
  numTracks: number,
  features: Set<Features>
): Project {
  const project = createEmptyProject();
  project.transport = new Transport();
  project.transport.tempo = new RealParameter(Unit.bpm);
  project.transport.tempo.value = 120.0;

  const masterTrack = Utility.createTrack(
    "Master",
    new Set(),
    MixerRole.master, // Use enum
    1,
    0.5
  );
  project.structure.push(masterTrack);

  if (features.has(Features.PLUGINS)) {
    const limiter = new Vst3Plugin(); // Assuming default constructor
    limiter.name = "Limiter"; // Assuming nameable properties
    limiter.deviceRole = DeviceRole.audioFX; // Use enum
    limiter.state = new FileReference("plugin-states/12323545.vstpreset");
    masterTrack.channel!.devices.push(limiter);
  }

  const arrangementLanes = new Lanes();
  arrangementLanes.timeUnit = TimeUnit.beats; // Use enum
  project.arrangement = new Arrangement(arrangementLanes); // Pass lanes to constructor

  if (features.has(Features.CUE_MARKERS)) {
    const cueMarkers = new Markers();
    project.arrangement.markers = cueMarkers;
    cueMarkers.markers.push(createMarker(0, "Verse"));
    cueMarkers.markers.push(createMarker(24, "Chorus"));
  }

  for (let i = 0; i < numTracks; i++) {
    const track = Utility.createTrack(
      `Track ${i + 1}`,
      new Set([ContentType.notes]), // Use enum
      MixerRole.regular, // Use enum
      1,
      0.5
    );
    project.structure.push(track);
    track.color = `#${i}${i}${i}${i}${i}${i}`; // Use color property from Nameable
    track.channel!.destination = masterTrack.channel; // Assign channel directly

    const trackLanes = new Lanes();
    trackLanes.track = track; // Assign track directly
    arrangementLanes.lanes.push(trackLanes);

    if (features.has(Features.CLIPS)) {
      const clips = new Clips();
      trackLanes.lanes.push(clips);

      const notes = new Notes();
      for (let j = 0; j < 8; j++) {
        const note = new Note(
          0.5 * j, // time
          0.5, // duration
          36 + 12 * (j % (1 + i)), // key
          undefined, // channel
          0.8, // velocity
          0.5 // releaseVelocity
        );
        notes.notes.push(note); // Use 'notes' array
      }

      const clip = new Clip(8 * i); // Pass time to constructor
      clip.duration = 4.0;
      clip.name = `Clip ${i}`;
      clip.content = notes; // Assign content directly
      clips.clips.push(clip); // Use 'clips' array

      if (features.has(Features.ALIAS_CLIPS)) {
        const aliasClip = new Clip(32 + 8 * i);
        aliasClip.duration = 4.0;
        aliasClip.name = `Alias Clip ${i}`;
        aliasClip.reference = notes; // Assign reference directly
        clips.clips.push(aliasClip);
      }

      if (i === 0 && features.has(Features.AUTOMATION)) {
        const target = new AutomationTarget();
        target.parameter = track.channel!.volume; // Assign parameter directly
        const volumeAutomation = new Points(target);
        volumeAutomation.track = track; // Assign track directly
        trackLanes.lanes.push(volumeAutomation); // Add points to the lanes array

        // fade-in over 8 quarter notes using Point array
        volumeAutomation.points.push(
          createPoint(0.0, 0.0, Interpolation.linear)
        ); // Use enum
        volumeAutomation.points.push(
          createPoint(8.0, 1.0, Interpolation.linear)
        ); // Use enum
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
    MixerRole.master,
    1,
    0.5
  );
  const audioTrack = Utility.createTrack(
    "Audio",
    new Set([ContentType.audio]),
    MixerRole.regular,
    1,
    0.5
  );
  audioTrack.channel!.destination = masterTrack.channel;

  project.structure.push(masterTrack);
  project.structure.push(audioTrack);

  const arrangementLanes = new Lanes();
  project.arrangement = new Arrangement(arrangementLanes);
  project.transport = new Transport();
  project.transport.tempo = new RealParameter(Unit.bpm);
  project.transport.tempo.value = 155.0;

  const arrangementIsInSeconds = scenario === AudioScenario.RawSeconds;
  arrangementLanes.timeUnit = arrangementIsInSeconds
    ? TimeUnit.seconds
    : TimeUnit.beats;

  const sample = "white-glasses.wav";
  const sampleDuration = 3.097;
  const audio = Utility.createAudio(sample, 44100, 2, sampleDuration);

  if (scenario === AudioScenario.FileWithAbsolutePath) {
    audio.file.external = true;
    audio.file.path = `/path/to/test-data/${sample}`;
  } else if (scenario === AudioScenario.FileWithRelativePath) {
    audio.file.external = true;
    audio.file.path = `../test-data/${sample}`;
  }

  let audioClip: Clip;

  if (scenario === AudioScenario.Warped) {
    const warps = new Warps(TimeUnit.seconds); // Pass contentTimeUnit
    warps.warp.push(new Warp(0, 0)); // Use 'warp' array
    warps.warp.push(new Warp(8, sampleDuration)); // Use 'warp' array
    warps.content = audio; // Assign audio content to warps

    audioClip = new Clip(clipTime);
    audioClip.duration = 8;
    audioClip.content = warps; // Assign warps as content
    audioClip.contentTimeUnit = TimeUnit.beats;
    audioClip.playStart = playStartOffset;

    if (withFades) {
      audioClip.fadeTimeUnit = TimeUnit.beats;
      audioClip.fadeInTime = 0.25;
      audioClip.fadeOutTime = 0.25;
    }
  } else {
    audioClip = new Clip(clipTime);
    audioClip.duration = arrangementIsInSeconds ? sampleDuration : 8;
    audioClip.content = audio; // Assign audio directly
    audioClip.contentTimeUnit = TimeUnit.seconds;
    audioClip.playStart = playStartOffset;
    audioClip.playStop = sampleDuration;

    if (withFades) {
      audioClip.fadeTimeUnit = TimeUnit.seconds;
      audioClip.fadeInTime = 0.1;
      audioClip.fadeOutTime = 0.1;
    }
  }

  const clips = new Clips();
  clips.clips.push(audioClip); // Use 'clips' array
  clips.track = audioTrack; // Assign track directly
  // arrangementLanes.lanes.push(clips); // Add to arrangement lanes?
  arrangementLanes.lanes.push(clips); // Add clips to the arrangement lanes array

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
    MixerRole.master,
    1,
    0.5
  );
  const instrumentTrack = Utility.createTrack(
    "Notes",
    new Set([ContentType.notes]),
    MixerRole.regular,
    1,
    0.5
  );
  instrumentTrack.channel!.destination = masterTrack.channel;

  project.structure.push(masterTrack);
  project.structure.push(instrumentTrack);

  const arrangementLanes = new Lanes();
  project.arrangement = new Arrangement(arrangementLanes);
  project.transport = new Transport();
  project.transport.tempo = new RealParameter(Unit.bpm);
  project.transport.tempo.value = 123.0;

  arrangementLanes.timeUnit = TimeUnit.beats;

  const target = new AutomationTarget();
  const automation = new Points(target);
  automation.unit = Unit.normalized;

  if (isPitchBend) {
    target.expression = ExpressionType.pitchBend; // Use enum
    target.channel = 0;
  } else {
    target.expression = ExpressionType.channelController; // Use enum
    target.channel = 0;
    target.controller = 1;
  }

  // Add automation points using Point array
  automation.points.push(createPoint(0, 0.0, Interpolation.linear));
  automation.points.push(createPoint(1, 0.0, Interpolation.linear));
  automation.points.push(createPoint(2, 0.5, Interpolation.linear));
  automation.points.push(createPoint(3, 0.5, Interpolation.linear));
  automation.points.push(createPoint(4, 1.0, Interpolation.linear));
  automation.points.push(createPoint(5, 1.0, Interpolation.linear));
  automation.points.push(createPoint(6, 0.5, Interpolation.linear));
  automation.points.push(createPoint(7, 1, Interpolation.hold));
  automation.points.push(createPoint(8, 0.5, Interpolation.hold));

  if (inClips) {
    const noteClip = new Clip(0);
    noteClip.duration = 8;
    noteClip.content = automation;
    const clips = new Clips();
    clips.clips.push(noteClip);
    clips.track = instrumentTrack;
    // arrangementLanes.lanes.push(clips);
    arrangementLanes.lanes.push(clips); // Add clips to the arrangement lanes array
  } else {
    automation.track = instrumentTrack;
    // arrangementLanes.lanes.push(automation);
    arrangementLanes.lanes.push(automation); // Add points to the arrangement lanes array
  }

  return project;
}

function createMarker(time: number, name: string): Marker {
  return new Marker(time, name);
}

function createPoint(
  time: number,
  value: number,
  interpolation: Interpolation // Use enum
): RealPoint {
  return new RealPoint(time, value, interpolation);
}
