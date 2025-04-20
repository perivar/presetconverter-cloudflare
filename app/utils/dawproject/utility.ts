import { Channel } from "./channel"; // Will need to implement Channel.fromXml

import { ContentType } from "./contentType";
import { FileReference } from "./fileReference";
import { MixerRole } from "./mixerRole";
import { RealParameter } from "./realParameter"; // Will need to implement RealParameter.fromXml
import { Audio } from "./timeline/audio"; // Will need to implement Audio.fromXml

import { Clip } from "./timeline/clip"; // Will need to implement Clip.fromXml
import { Clips } from "./timeline/clips"; // Will need to implement Clips.fromXml

import { Timeline } from "./timeline/timeline"; // Base class
import { TimeUnit } from "./timeline/timeUnit";
import { Warp } from "./timeline/warp";
import { Track } from "./track"; // Will need to implement Track.fromXml

import { Unit } from "./unit";

export class Utility {
  static createTrack(
    name: string,
    contentTypes: Set<ContentType>,
    mixerRole: MixerRole,
    volume: number,
    pan: number
  ): Track {
    const trackChannel = new Channel(
      mixerRole,
      2, // audioChannels default
      new RealParameter(volume, Unit.LINEAR),
      new RealParameter(pan, Unit.NORMALIZED)
      // mute, solo, destination, sends, devices are optional
    );
    const track = new Track(
      contentTypes ? Array.from(contentTypes) : [], // Convert Set to Array
      true, // loaded default
      trackChannel
      // tracks are optional
    );
    track.name = name; // Set name from Nameable
    return track;
  }

  static createAudio(
    relativePath: string,
    sampleRate: number,
    channels: number,
    duration: number
  ): Audio {
    const audio = new Audio(
      sampleRate,
      channels,
      duration,
      new FileReference(relativePath, false), // file (required)
      undefined, // algorithm optional
      undefined, // name optional
      TimeUnit.SECONDS // timeUnit default
    );
    return audio;
  }

  static createWarp(time: number, contentTime: number): Warp {
    const warp = new Warp(time, contentTime);
    return warp;
  }

  static createClip(content: Timeline, time: number, duration: number): Clip {
    const clip = new Clip(
      time,
      duration,
      undefined, // contentTimeUnit optional
      undefined, // playStart optional
      undefined, // playStop optional
      undefined, // loopStart optional
      undefined, // loopEnd optional
      undefined, // fadeTimeUnit optional
      undefined, // fadeInTime optional
      undefined, // fadeOutTime optional
      content // content
      // reference optional
      // name, color, comment optional
    );
    return clip;
  }

  static createClips(...clips: Clip[]): Clips {
    const clipsTimeline = new Clips(clips);
    return clipsTimeline;
  }
}
