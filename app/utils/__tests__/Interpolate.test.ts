import { AutomationEvent } from "../ableton/AutomationEvent";
import {
  interpolate,
  interpolateEvents,
  InterpolationType,
} from "../ableton/Interpolate";

describe("Automation Interpolation Utils", () => {
  describe("interpolate (helper function)", () => {
    it("should perform linear interpolation correctly with numSteps > 1", () => {
      const start = new AutomationEvent(0, 0);
      const end = new AutomationEvent(20, 200); // Position diff 20, Value diff 200
      const numSteps = 2; // Generates 2 points in the loop, then endEvent is added.
      // posStep = 10, valStep = 100

      const result = interpolate(
        start,
        end,
        numSteps,
        InterpolationType.Linear
      );

      // Expected points:
      // i=0: pos=0 + 0*10 = 0,  val=0 + 0*100 = 0
      // i=1: pos=0 + 1*10 = 10, val=0 + 1*100 = 100
      // Then endEvent (20, 200) is added.
      // Dictionary ensures sorted unique positions.
      expect(result).toEqual([
        new AutomationEvent(0, 0),
        new AutomationEvent(10, 100),
        new AutomationEvent(20, 200),
      ]);
      expect(result.length).toBe(3);
    });

    it("should perform linear interpolation with numSteps = 1", () => {
      const start = new AutomationEvent(0, 0);
      const end = new AutomationEvent(10, 100);
      const numSteps = 1; // Generates 1 point in the loop (the start point), then endEvent.
      // posStep = 10, valStep = 100

      const result = interpolate(
        start,
        end,
        numSteps,
        InterpolationType.Linear
      );

      // Expected points:
      // i=0: pos=0 + 0*10 = 0,  val=0 + 0*100 = 0
      // Then endEvent (10, 100) is added.
      expect(result).toEqual([
        new AutomationEvent(0, 0),
        new AutomationEvent(10, 100),
      ]);
      expect(result.length).toBe(2);
    });

    it("should handle linear interpolation when start and end events are the same", () => {
      const start = new AutomationEvent(0, 0);
      const end = new AutomationEvent(0, 0);
      const numSteps = 5;

      const result = interpolate(
        start,
        end,
        numSteps,
        InterpolationType.Linear
      );
      // Loop generates (0,0) multiple times. Dictionary keeps one. endEvent is (0,0).
      expect(result).toEqual([new AutomationEvent(0, 0)]);
      expect(result.length).toBe(1);
    });

    it("should perform logarithmic interpolation correctly with numSteps > 1", () => {
      const start = new AutomationEvent(0, 10); // Log doesn't like 0, use a small positive value
      const end = new AutomationEvent(20, 1000);
      const numSteps = 2; // N = 2. t will be 0 and 1.
      // posStep = 10.

      const result = interpolate(
        start,
        end,
        numSteps,
        InterpolationType.Logarithmic
      );

      // i=0: t=0. pos=0. val = 10 + (990) * log10(1) = 10. Event (0,10)
      // i=1: t=1. pos=10. val = 10 + (990) * log10(10) = 10 + 990 = 1000. Event (10,1000)
      // Then endEvent (20, 1000) is added.
      expect(result).toEqual([
        new AutomationEvent(0, 10),
        new AutomationEvent(10, 1000),
        new AutomationEvent(20, 1000), // End event
      ]);
      expect(result.length).toBe(3);
    });

    it("should perform logarithmic interpolation with numSteps = 1", () => {
      const start = new AutomationEvent(0, 10);
      const end = new AutomationEvent(10, 100);
      const numSteps = 1; // N = 1. t will be 0.

      const result = interpolate(
        start,
        end,
        numSteps,
        InterpolationType.Logarithmic
      );

      // i=0: t=0. pos=0. val = 10 + (90) * log10(1) = 10. Event (0,10)
      // Then endEvent (10,100) is added.
      expect(result).toEqual([
        new AutomationEvent(0, 10),
        new AutomationEvent(10, 100),
      ]);
      expect(result.length).toBe(2);
    });

    it("should handle logarithmic interpolation when start and end values are the same", () => {
      const start = new AutomationEvent(0, 100);
      const end = new AutomationEvent(10, 100); // Same value
      const numSteps = 2;
      // posStep = 5

      const result = interpolate(
        start,
        end,
        numSteps,
        InterpolationType.Logarithmic
      );
      // i=0: pos=0, val=100
      // i=1: pos=5, val=100
      // Then endEvent (10,100) is added.
      expect(result).toEqual([
        new AutomationEvent(0, 100),
        new AutomationEvent(5, 100),
        new AutomationEvent(10, 100),
      ]);
      expect(result.length).toBe(3);
    });

    it("should handle position truncation correctly", () => {
      const start = new AutomationEvent(0, 0);
      const end = new AutomationEvent(5, 50); // posDiff=5, valDiff=50
      const numSteps = 2; // posStep = 2.5, valStep = 25

      const result = interpolate(
        start,
        end,
        numSteps,
        InterpolationType.Linear
      );
      // i=0: pos=trunc(0 + 0*2.5)=0, val=trunc(0 + 0*25)=0. Event (0,0)
      // i=1: pos=trunc(0 + 1*2.5)=2, val=trunc(0 + 1*25)=25. Event (2,25)
      // Then endEvent (5,50) is added.
      expect(result).toEqual([
        new AutomationEvent(0, 0),
        new AutomationEvent(2, 25), // Position 2.5 truncated to 2
        new AutomationEvent(5, 50),
      ]);
    });
  });

  describe("interpolateEvents (main function)", () => {
    it("should return an empty array for empty input", () => {
      expect(interpolateEvents([])).toEqual([]);
    });

    it("should return the same single event for single event input", () => {
      const event = new AutomationEvent(0, 100);
      const result = interpolateEvents([event]);
      expect(result).toEqual([new AutomationEvent(0, 100)]); // Returns a new instance
      expect(result[0]).not.toBe(event); // Check it's a copy
    });

    it("should not interpolate if values are the same between events", () => {
      const events = [
        new AutomationEvent(0, 100),
        new AutomationEvent(10, 100), // Same value
        new AutomationEvent(20, 100), // Same value
      ];
      const result = interpolateEvents(events);
      // Expected: Add (0,100). current=(0,100) != lastAdded(null)
      // current=(10,100), next=(20,100). Values same. Add (10,100). current=(10,100) != lastAdded(0,100)
      // last event (20,100). current=(20,100) != lastAdded(10,100)
      expect(result).toEqual([
        new AutomationEvent(0, 100),
        new AutomationEvent(10, 100),
        new AutomationEvent(20, 100),
      ]);
    });

    it("should not interpolate if positions are the same between events", () => {
      const events = [
        new AutomationEvent(0, 100),
        new AutomationEvent(0, 200), // Same position
        new AutomationEvent(0, 300), // Same position
      ];
      const result = interpolateEvents(events);
      expect(result).toEqual([
        new AutomationEvent(0, 100),
        new AutomationEvent(0, 200),
        new AutomationEvent(0, 300),
      ]);
    });

    it("should perform linear interpolation when values and positions differ", () => {
      const events = [
        new AutomationEvent(0, 0),
        new AutomationEvent(20, 200), // Diff value: 200. numInterpolationSteps = 200/10 = 20.
      ];
      const result = interpolateEvents(events);

      // This will call interpolate( (0,0), (20,200), 20, Linear )
      // Which generates 20 points (0,0)...(19,190) then adds (20,200) from endEvent
      // Total 21 points.
      expect(result.length).toBe(21);
      expect(result[0]).toEqual(new AutomationEvent(0, 0));
      expect(result[1]).toEqual(new AutomationEvent(1, 10)); // posStep = 1, valStep = 10
      expect(result[10]).toEqual(new AutomationEvent(10, 100));
      expect(result[20]).toEqual(new AutomationEvent(20, 200));
    });

    it("should handle a sequence with interpolation and no interpolation segments", () => {
      const events = [
        new AutomationEvent(0, 0), // Event A
        new AutomationEvent(20, 40), // Event B: Interpolate A-B. valDiff=40. steps=40/10=4
        // interpolate((0,0), (20,40), 4)
        // -> (0,0), (5,10), (10,20), (15,30), (20,40)
        new AutomationEvent(30, 40), // Event C: No interpolation B-C (same value). (20,40) added if distinct from last.
        new AutomationEvent(50, 80), // Event D: Interpolate C-D. valDiff=40. steps=4
        // interpolate((30,40), (50,80), 4)
        // -> (30,40), (35,50), (40,60), (45,70), (50,80)
      ];
      const result = interpolateEvents(events);

      const expected: AutomationEvent[] = [
        // From A to B (numSteps=4)
        new AutomationEvent(0, 0),
        new AutomationEvent(5, 10), // posStep=5, valStep=10
        new AutomationEvent(10, 20),
        new AutomationEvent(15, 30),
        new AutomationEvent(20, 40), // lastAddedEvent = (20,40)

        // Between B and C: B=(20,40), C=(30,40). Values are same.
        // currentEvent=(20,40). lastAddedEvent=(20,40). They are equal. So (20,40) is NOT added again.
        // This behavior differs from the original C# if my C# analysis was correct about always adding currentEvent.
        // The TS version is more robust against duplicates here.

        // From C to D (numSteps=4)
        // currentEvent=(30,40). lastAddedEvent=(20,40). Not equal.
        // interpolate((30,40), (50,80), 4) -> first event is (30,40)
        new AutomationEvent(30, 40), // This (30,40) is from the start of the C-D interpolation
        new AutomationEvent(35, 50), // posStep=5, valStep=10
        new AutomationEvent(40, 60),
        new AutomationEvent(45, 70),
        new AutomationEvent(50, 80), // lastAddedEvent = (50,80)
      ];

      // Final event check: events[events.length-1] is (50,80)
      // lastAddedEvent is (50,80). They are equal. So it's not added again.

      expect(result).toEqual(expected);
      expect(result.length).toBe(10);
    });

    it("should correctly add the last event if not already covered", () => {
      const events = [
        new AutomationEvent(0, 0),
        new AutomationEvent(15, 150), // valDiff=150, numSteps=15. Interpolate will generate 15 pts. (0,0), (1,10), ..., (14,140)
        new AutomationEvent(25, 200), // valDiff=50, numSteps=5. Interpolate will generate 5 + 1 pts. (15,150), (16,160), ..., (20,200)
      ];

      const result = interpolateEvents(events);

      expect(result.length).toBe(15 + 5 + 1); // 15 + 5 from interpolation and 1 for the last event
      expect(result[0]).toEqual(new AutomationEvent(0, 0));
      expect(result[15]).toEqual(new AutomationEvent(15, 150));
      expect(result[20]).toEqual(new AutomationEvent(25, 200));
    });

    it("should handle small value differences resulting in numSteps = 1", () => {
      const events = [
        new AutomationEvent(0, 0),
        new AutomationEvent(10, 5), // valueDifference = 5. numSteps = max(floor(5/10), 1) = 1.
      ];
      // Calls interpolate((0,0), (10,5), 1, Linear)
      // -> results in [(0,0), (10,5)]
      const result = interpolateEvents(events);
      expect(result).toEqual([
        new AutomationEvent(0, 0),
        new AutomationEvent(10, 5),
      ]);
      expect(result.length).toBe(2);
    });

    it("should avoid duplicate consecutive events in the output", () => {
      const events = [
        new AutomationEvent(0, 0),
        new AutomationEvent(10, 0), // No interpolation, (0,0) then (10,0)
        new AutomationEvent(10, 0), // No interpolation, (10,0) is current, lastAdded was (10,0), so skipped
        new AutomationEvent(20, 0), // No interpolation, (10,0) then (20,0)
      ];
      const result = interpolateEvents(events);
      expect(result).toEqual([
        new AutomationEvent(0, 0),
        new AutomationEvent(10, 0),
        new AutomationEvent(20, 0),
      ]);
    });

    it("should correctly handle a trailing event that does not require interpolation", () => {
      const events = [
        new AutomationEvent(0, 0),
        new AutomationEvent(10, 100), // Interpolate: (0,0)...(10,100). numSteps=10. lastAdded=(10,100)
        new AutomationEvent(20, 100), // No interpolation. current=(10,100). lastAdded=(10,100). SKIPPED.
        // lastAdded STAYS (10,100)
      ];
      // Loop finishes. lastAdded=(10,100).
      // finalOriginalEvent = (20,100).
      // lastAdded.equals(finalOriginalEvent) is FALSE (positions differ).
      // interpolatedEvents.last.equals(finalOriginalEvent) is FALSE.
      // So, (20,100) is added.

      const result = interpolateEvents(events);
      const expectedLength = 11 + 1; // 11 from interpolation, +1 for the final event.
      expect(result.length).toBe(expectedLength);
      expect(result[10]).toEqual(new AutomationEvent(10, 100));
      expect(result[11]).toEqual(new AutomationEvent(20, 100)); // The explicitly added last event
    });
  });
});
