import { Application } from "../dawproject/application";
import { Arrangement } from "../dawproject/arrangement";
import { BoolParameter } from "../dawproject/boolParameter";
import { ContentType } from "../dawproject/contentType";
import { Compressor } from "../dawproject/device/compressor";
import { DeviceRole } from "../dawproject/device/deviceRole";
import { EqBand } from "../dawproject/device/eqBand";
import { EqBandType } from "../dawproject/device/eqBandType";
import { Equalizer } from "../dawproject/device/equalizer";
import { FileReference } from "../dawproject/fileReference";
import { MetaData } from "../dawproject/metaData";
import { MixerRole } from "../dawproject/mixerRole";
import { Project } from "../dawproject/project";
import { RealParameter } from "../dawproject/realParameter";
import { Referenceable } from "../dawproject/referenceable";
import { Lanes } from "../dawproject/timeline/lanes";
import { TimeUnit } from "../dawproject/timeline/timeUnit";
import { Transport } from "../dawproject/transport";
import { Unit } from "../dawproject/unit";
import { Utility } from "../dawproject/utility";

export interface AudioTrackConfig {
  file_path: string;
  sample_duration: number;
  gain: number;
  pan: number;
  eq_settings?: {
    frequency: number;
    gain: number;
    q: number;
    enabled: boolean;
    band_type: EqBandType;
  }[];
  compressor_settings?: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
    input_gain: number;
    output_gain: number;
    auto_makeup: boolean;
  };
}

/**
 * Method to retrieve the audio file content as bytes.
 * This will need to be adapted for the target environment (e.g., Cloudflare Workers)
 * where direct file system access is not available.
 * For now, we'll assume audio data is provided as ArrayBuffer or similar.
 */
function getAudioFileAsArrayBuffer(samplePath: string): ArrayBuffer {
  // Placeholder implementation: In a real scenario, you would load the file content here.
  // For a Cloudflare Worker, you might fetch the file from an R2 bucket or other storage.
  console.warn(`Placeholder: Loading audio file from ${samplePath}`);
  // Return a dummy ArrayBuffer for now
  return new ArrayBuffer(0);
}

function createEmptyProject(): Project {
  Referenceable.resetIdCounter();
  const project = new Project();
  project.application = new Application("RoEx Automix", "1.0");
  return project;
}

/**
 * This will need to be adapted for the target environment (e.g., Cloudflare Workers)
 * using a library like JSZip for creating the zip file.
 */
export function saveTestProject(
  project: Project,
  name: string,
  configurer?: (
    metadata: MetaData,
    embeddedFiles: { [path: string]: ArrayBuffer }
  ) => void
): void {
  const metadata = new MetaData();
  const embeddedFiles: { [path: string]: ArrayBuffer } = {};

  if (configurer) {
    configurer(metadata, embeddedFiles);
  }

  // Placeholder for saving logic
  console.warn(`Placeholder: Saving project "${name}"`);
  console.log("Project XML:", project.toXmlObject());
  console.log("Metadata XML:", metadata);
  console.log("Embedded files:", embeddedFiles);

  // In a real implementation, you would use a library like JSZip to create the .dawproject file
  // and save the project.xml, metadata.xml, and embedded files within it.
  // You would also save the project.xml separately for debugging/validation.
  // Validation would also be performed here if a suitable library is available.
}

/**
 * Create a DAW project with the provided audio tracks, each with its gain, panning, EQ, and compressor settings.
 *
 * @param audioTracks List of dictionaries where each dictionary contains the following keys:
 *   - 'file_path': The location of the audio file.
 *   - 'sample_duration': The duration of the audio sample in seconds.
 *   - 'gain': The gain setting for the track (in dB).
 *   - 'pan': The panning setting for the track (range -1.0 to 1.0).
 *   - 'eq_settings': List of dictionaries with EQ band settings. Each dictionary should contain:
 *       - 'frequency': The frequency of the EQ band (in Hz).
 *       - 'gain': The gain for the EQ band (in dB).
 *       - 'q': The Q factor for the EQ band.
 *       - 'enabled': Boolean to enable/disable the EQ band.
 *       - 'band_type': Type of EQ band (e.g., 'bell', 'high_shelf', etc.).
 *   - 'compressor_settings': Dictionary with compressor settings:
 *       - 'threshold': Threshold (in dB).
 *       - 'ratio': Compression ratio.
 *       - 'attack': Attack time (in seconds).
 *       - 'release': Release time (in seconds).
 *       - 'input_gain': Input gain (in dB).
 *       - 'output_gain': Output gain (in dB).
 *       - 'auto_makeup': Boolean to enable/disable automatic makeup gain.
 */
export function createProjectWithAudioTracks(
  audioTracks: AudioTrackConfig[]
): Project {
  const project = createEmptyProject();
  project.transport = new Transport();
  project.transport.tempo = new RealParameter(120.0, Unit.BPM);

  const masterTrack = Utility.createTrack(
    "Master",
    new Set(),
    MixerRole.MASTER,
    1.0,
    0.5
  );
  project.structure.push(masterTrack);
  project.arrangement = new Arrangement();
  project.arrangement.lanes = new Lanes();
  project.arrangement.lanes.timeUnit = TimeUnit.SECONDS;

  const embeddedFiles: { [path: string]: ArrayBuffer } = {};

  audioTracks.forEach((trackInfo, i) => {
    // Create audio track
    const trackName = trackInfo.file_path.split("/").pop() || `Track_${i + 1}`;
    const audioTrack = Utility.createTrack(
      trackName,
      new Set([ContentType.AUDIO]),
      MixerRole.REGULAR,
      trackInfo.gain,
      trackInfo.pan
    );
    // Assuming masterTrack.channel is not undefined
    if (masterTrack.channel) {
      audioTrack.channel!.destination = masterTrack.channel;
    }
    project.structure.push(audioTrack);

    // Load audio file
    const samplePath = trackInfo.file_path;
    // Assuming sample_duration is provided in the input
    const sampleDuration = trackInfo.sample_duration;
    const audio = Utility.createAudio(
      trackName, // Use trackName as the path within the DAWproject
      44100,
      2,
      sampleDuration
    );
    audio.file = new FileReference(trackName, false); // Embedded file

    // Add the audio file to the embedded files
    // In a real implementation, you would read the file content here
    embeddedFiles[trackName] = getAudioFileAsArrayBuffer(samplePath);

    // Create and add clip to the track
    const audioClip = Utility.createClip(audio, 0, sampleDuration);
    audioClip.contentTimeUnit = TimeUnit.SECONDS;
    audioClip.playStart = 0;

    const clips = Utility.createClips(audioClip);
    clips.track = audioTrack.name;

    // Add clips to arrangement lanes
    // The commented out lines below are from the Python example but not needed in the TS structure
    // track_lanes = Lanes()
    // track_lanes.lanes.append(clips)
    project.arrangement!.lanes!.lanes.push(clips);

    // Apply EQ settings
    if (trackInfo.eq_settings && audioTrack.channel) {
      const eqBands: EqBand[] = [];
      trackInfo.eq_settings.forEach(eqBandInfo => {
        const eqBand = new EqBand(
          eqBandInfo.band_type,
          new RealParameter(eqBandInfo.frequency, Unit.HERTZ),
          new RealParameter(eqBandInfo.gain, Unit.DECIBEL),
          new RealParameter(eqBandInfo.q, Unit.LINEAR),
          new BoolParameter(eqBandInfo.enabled)
          // order is optional
        );
        eqBands.push(eqBand);
      });
      const equalizer = new Equalizer(
        DeviceRole.AUDIO_FX, // Swapped order
        `Eq_${i + 1}`, // Swapped order
        eqBands
        // input_gain, output_gain are optional
      );
      audioTrack.channel.devices.push(equalizer);
    }

    // Apply Compressor settings
    if (trackInfo.compressor_settings && audioTrack.channel) {
      const compInfo = trackInfo.compressor_settings;
      const compressor = new Compressor(
        DeviceRole.AUDIO_FX, // Swapped order
        `Compressor_${i + 1}`, // Swapped order
        new RealParameter(compInfo.threshold, Unit.DECIBEL),
        new RealParameter(compInfo.ratio, Unit.LINEAR), // Assuming ratio is linear
        new RealParameter(compInfo.attack, Unit.SECONDS),
        new RealParameter(compInfo.release, Unit.SECONDS),
        new RealParameter(compInfo.input_gain, Unit.DECIBEL),
        new RealParameter(compInfo.output_gain, Unit.DECIBEL),
        new BoolParameter(compInfo.auto_makeup) // Create BoolParameter instance
      );
      audioTrack.channel.devices.push(compressor);
    }
  });

  // Save the project with embedded files
  // This part needs to be async and adapted for the target environment
  // saveTestProject(project, "RoEx_Automix", (meta, files) => {
  //   Object.assign(files, embeddedFiles);
  // });

  return project; // Return the project object for now
}
