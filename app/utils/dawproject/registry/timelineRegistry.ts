import { Timeline, TimelineConstructor } from "../timeline/timeline";
import { BaseRegistry } from "./baseRegistry";

export class TimelineRegistry extends BaseRegistry<Timeline> {
  private static instance: TimelineRegistry;

  private constructor() {
    super("timeline");
  }

  static getInstance(): TimelineRegistry {
    if (!TimelineRegistry.instance) {
      TimelineRegistry.instance = new TimelineRegistry();
    }
    return TimelineRegistry.instance;
  }

  static register(tagName: string, timelineClass: TimelineConstructor): void {
    TimelineRegistry.getInstance().register(tagName, timelineClass);
  }

  static getTimelineClass(tagName: string): TimelineConstructor | undefined {
    return TimelineRegistry.getInstance().get(tagName);
  }
}

export function registerTimeline(tagName: string) {
  return function (target: TimelineConstructor) {
    TimelineRegistry.register(tagName, target);
  };
}
