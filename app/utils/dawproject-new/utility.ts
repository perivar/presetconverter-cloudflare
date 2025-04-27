// dawproject/utility.ts
import { Audio } from "./audio";
import { Channel } from "./channel";
import { Clip } from "./clip";
import { Clips } from "./clips";
import { FileReference } from "./file-reference";
import type {
  ContentType,
  MixerRole,
  XsDouble,
  XsInt,
  XsString,
} from "./project-schema";
import { RealParameter } from "./real-parameter";
import { Track } from "./track";
import { Warp } from "./warp";

/**
 * Utility class with helper functions for creating DAW projects and elements.
 */
export class Utility {
  /**
   * Create a track with the specified properties.
   */
  public static createTrack(
    name: XsString,
    contentTypes: Set<ContentType>,
    mixerRole: MixerRole,
    volume: number = 1.0,
    pan: number = 0.5
  ): Track {
    const track = new Track();
    track.Channel = new Channel();
    track["@_name"] = name;

    const volumeParameter = new RealParameter("linear");
    volumeParameter["@_value"] = volume.toString();
    track.Channel.Volume = volumeParameter;

    const panParameter = new RealParameter("normalized");
    panParameter["@_value"] = pan.toString();
    track.Channel.Pan = panParameter;

    track["@_contentType"] = Array.from(contentTypes).join(" ");
    track.Channel["@_role"] = mixerRole;

    return track;
  }

  /**
   * Create an Audio object.
   */
  public static createAudio(
    relativePath: XsString,
    sampleRate: XsInt,
    channels: XsInt,
    duration: XsDouble
  ): Audio {
    const fileReference = new FileReference(relativePath, false);
    const audio = new Audio(sampleRate, channels, duration, fileReference);
    audio["@_timeUnit"] = "seconds";
    return audio;
  }

  /**
   * Create a Warp point.
   */
  public static createWarp(time: XsDouble, contentTime: XsDouble): Warp {
    const warp = new Warp(time, contentTime);
    return warp;
  }

  /**
   * Create a clip with the specified content.
   */
  public static createClip(
    content: any, // Timeline type
    time: XsDouble,
    duration: XsDouble
  ): Clip {
    const clip = new Clip(time, duration);
    clip.setContent(content);
    return clip;
  }

  /**
   * Create a Clips container with multiple clips.
   */
  public static createClips(clips: Clip[]): Clips {
    const timeline = new Clips();
    timeline.Clip = clips;
    return timeline;
  }
}
