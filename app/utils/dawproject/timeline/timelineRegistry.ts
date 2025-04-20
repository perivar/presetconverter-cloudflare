import { TimelineConstructor } from "./timeline";

export class TimelineRegistry {
  private static registry: { [key: string]: TimelineConstructor } = {};

  static register(tagName: string, timelineClass: TimelineConstructor) {
    TimelineRegistry.registry[tagName] = timelineClass;
  }

  static getTimelineClass(tagName: string): TimelineConstructor | undefined {
    return TimelineRegistry.registry[tagName];
  }
}

export function registerTimeline(tagName: string) {
  return function (target: TimelineConstructor) {
    TimelineRegistry.register(tagName, target);
  };
}
