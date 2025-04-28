import { Channel } from "./channel";
import { ContentType } from "./contentType";
import { FileReference } from "./fileReference";
import { MixerRole } from "./mixerRole";
import { RealParameter } from "./realParameter";
// Needed for accessing static ID
import { Audio } from "./timeline/audio";
import { Clip } from "./timeline/clip";
import { Clips } from "./timeline/clips";
import { TimeUnit } from "./timeline/timeUnit";
import { Warp } from "./timeline/warp";
import { Track } from "./track";
import { Unit } from "./unit";

// Needed for accessing static ID

export class Utility {
  public static createTrack(
    name: string,
    contentTypes: Set<ContentType>,
    mixerRole: MixerRole,
    volume: number,
    pan: number
  ): Track {
    const track = new Track();
    track.channel = new Channel();
    track.name = name;
    const volumeParameter = new RealParameter(Unit.linear);
    volumeParameter.value = volume;
    track.channel.volume = volumeParameter;

    const panParameter = new RealParameter(Unit.normalized);
    panParameter.value = pan;
    track.channel.pan = panParameter;

    track.contentType = Array.from(contentTypes);
    track.channel.role = mixerRole;

    return track;
  }

  public static createAudio(
    relativePath: string,
    sampleRate: number,
    channels: number,
    duration: number
  ): Audio {
    const fileReference = new FileReference(relativePath, false);
    const audio = new Audio(fileReference, sampleRate, channels, duration);
    audio.timeUnit = TimeUnit.seconds;
    return audio;
  }

  public static createWarp(time: number, contentTime: number): Warp {
    return new Warp(time, contentTime);
  }

  public static createClip(content: any, time: number, duration: number): Clip {
    const clip = new Clip(time);
    clip.content = content;
    clip.duration = duration;
    return clip;
  }

  public static createClips(...clips: Clip[]): Clips {
    const timeline = new Clips();
    timeline.clips = clips;
    return timeline;
  }
}
