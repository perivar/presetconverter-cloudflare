import { AutomationEvent } from "./AutomationEvent";
import { OrderedLastElementDictionary } from "./OrderedLastElementDictionary";

/**
 * Defines the types of interpolation that can be performed between automation events.
 */
export enum InterpolationType {
  /** Linear interpolation: values change at a constant rate. */
  Linear,
  /** Logarithmic interpolation: values change logarithmically, often used for parameters like volume. */
  Logarithmic,
}

/**
 * Interpolates values between two AutomationEvents.
 *
 * @param startEvent - The starting event for interpolation.
 * @param endEvent - The ending event for interpolation.
 * @param numSteps - The number of interpolation points to generate between start and end.
 *                   A value of 1 means only the start point's characteristics will be used for one point.
 * @param interpolationType - The type of interpolation to use (Linear, Logarithmic).
 * @returns An array of interpolated AutomationEvents, ordered by position.
 *          Includes a point at/near the startEvent's position and points up to/near the endEvent's position.
 *          The `endEvent` itself is explicitly added to ensure it's represented.
 * @throws RangeError if an unknown interpolationType is provided.
 */
export function interpolate(
  startEvent: AutomationEvent,
  endEvent: AutomationEvent,
  numSteps: number,
  interpolationType: InterpolationType
): AutomationEvent[] {
  // Using our custom dictionary to ensure unique positions (last one wins) and sorted output
  const dictionary = new OrderedLastElementDictionary<
    number,
    AutomationEvent
  >();

  // Ensure numSteps is at least 1. If it's 0 or less, calculations might fail or be meaningless.
  const N = Math.max(1, numSteps);

  // Calculate step sizes for value and position.
  // These steps define how much value/position changes per "step" if N points are generated.
  const valueStep = (endEvent.value - startEvent.value) / N;
  const positionStep = (endEvent.position - startEvent.position) / N;

  for (let i = 0; i < N; i++) {
    // Generates N points
    // Calculate the raw interpolated position for the current step.
    const rawPosition = startEvent.position + i * positionStep;
    // Position is usually an integer;
    const pos = Math.trunc(rawPosition);

    // 't' is the normalized progress factor (0.0 to 1.0).
    // It's crucial for non-linear interpolations like Logarithmic.
    // If N=1, t should be 0 (representing the start).
    // Otherwise, t ranges from 0 for i=0 to (N-1)/(N-1)=1 for i=N-1.
    const t = N <= 1 ? 0 : i / (N - 1);

    let interpolatedValue: number;
    switch (interpolationType) {
      case InterpolationType.Linear:
        interpolatedValue = startEvent.value + i * valueStep;
        break;
      case InterpolationType.Logarithmic:
        // Handle edge case where startValue equals endValue to avoid issues with log(0) or division by zero.
        if (startEvent.value === endEvent.value) {
          interpolatedValue = startEvent.value;
        } else {
          // Logarithmic formula: Math.log10(1 + 9 * t) maps t=[0,1] to output=[0,1] (log10(1)=0, log10(10)=1)
          // This is then scaled by the total difference in value.
          interpolatedValue =
            startEvent.value +
            (endEvent.value - startEvent.value) * Math.log10(1 + 9 * t);
        }
        break;
      default:
        // Handle unexpected interpolation types exhaustively.
        const _exhaustiveCheck: never = interpolationType;
        throw new RangeError(
          `Unsupported interpolation type: ${_exhaustiveCheck}`
        );
    }

    // Create the new event. Value is usually an integer;
    const newInterpolatedEvent = new AutomationEvent(
      pos,
      Math.trunc(interpolatedValue)
    );

    // Add or update the event in the dictionary. If multiple interpolated points
    // map to the same discrete position, the last one calculated will be stored.
    dictionary.addOrUpdate(pos, newInterpolatedEvent);
  }

  // To ensure the endEvent is accurately represented, especially due to potential
  // floating-point arithmetic and truncation, explicitly add/update it.
  // The dictionary will handle overwriting if a point at endEvent.position was already generated.
  dictionary.addOrUpdate(
    endEvent.position,
    new AutomationEvent(endEvent.position, endEvent.value)
  );

  return dictionary.values; // Returns values sorted by position (key)
}

/**
 * Interpolates a list of AutomationEvents to create smoother transitions.
 *
 * - If two consecutive events have different values AND different positions, new events are generated
 *   between them using the specified interpolation logic.
 * - If values or positions are the same between consecutive events, the original `currentEvent` is added (if distinct from the previously added event).
 * - Duplicate consecutive events (same position and value) are avoided in the output.
 *
 * @param events - The list of AutomationEvents to interpolate.
 *                 It's assumed these events are roughly sorted by position, though the interpolation
 *                 itself operates on pairs and the internal dictionary sorts by position.
 * @returns A new array of AutomationEvents with interpolated values, effectively "smoothed".
 */
export function interpolateEvents(
  events: AutomationEvent[]
): AutomationEvent[] {
  const interpolatedEvents: AutomationEvent[] = [];
  let lastAddedEvent: AutomationEvent | null = null;

  // Handle edge cases: empty or single-event list
  if (!events || events.length === 0) {
    return [];
  }
  // If only one event, return it (or a copy to maintain immutability if desired)
  if (events.length === 1) {
    // Creating a new instance to avoid modifying original if it was passed by reference and modified elsewhere
    return [new AutomationEvent(events[0].position, events[0].value)];
  }

  // Iterate through event pairs (current, next)
  for (let i = 0; i < events.length - 1; i++) {
    const currentEvent = events[i];
    const nextEvent = events[i + 1];

    // Check if interpolation is needed: both value and position must differ.
    if (
      currentEvent.value !== nextEvent.value &&
      currentEvent.position !== nextEvent.position
    ) {
      // Calculate the absolute difference in values.
      const valueDifference = Math.abs(nextEvent.value - currentEvent.value);

      // Determine the number of interpolation steps.
      // The divisor (10) controls granularity: smaller means more steps.
      // Math.max ensures at least 1 step.
      // Math.floor is used because numSteps should be an integer.
      const numInterpolationSteps = Math.max(
        Math.floor(valueDifference / 10),
        1
      );

      // Perform interpolation between currentEvent and nextEvent
      const newSubEvents = interpolate(
        currentEvent,
        nextEvent,
        numInterpolationSteps,
        InterpolationType.Linear // Defaulting to Linear, could be a parameter
      );

      // Add the newly generated interpolated events to the main list,
      // ensuring no consecutive duplicates are added.
      for (const subEvent of newSubEvents) {
        if (
          lastAddedEvent === null ||
          !(
            lastAddedEvent instanceof AutomationEvent &&
            lastAddedEvent.equals(subEvent)
          )
        ) {
          interpolatedEvents.push(subEvent);
          lastAddedEvent = subEvent;
        }
      }
    } else {
      // No interpolation needed (values or positions are the same).
      // Add the currentEvent if it's different from the last one added.
      // Explicitly create a new AutomationEvent to ensure it has the equals method.
      const currentEventInstance = new AutomationEvent(
        currentEvent.position,
        currentEvent.value
      );
      if (
        lastAddedEvent === null ||
        !(
          lastAddedEvent instanceof AutomationEvent &&
          lastAddedEvent.equals(currentEventInstance)
        )
      ) {
        interpolatedEvents.push(currentEventInstance); // Add the original current event
        lastAddedEvent = currentEventInstance;
      }
    }
  }

  // After the loop, ensure the very last event from the original list is included
  // if it wasn't already added or represented by the last interpolation.
  const finalOriginalEvent = events[events.length - 1];
  if (lastAddedEvent === null || !lastAddedEvent.equals(finalOriginalEvent)) {
    // Before pushing, ensure it's not already the last element in interpolatedEvents.
    // This can happen if the interpolate function for the last pair already added it.
    if (
      interpolatedEvents.length === 0 ||
      !(
        interpolatedEvents[interpolatedEvents.length - 1] instanceof
          AutomationEvent &&
        interpolatedEvents[interpolatedEvents.length - 1].equals(
          finalOriginalEvent
        )
      )
    ) {
      interpolatedEvents.push(
        new AutomationEvent(
          finalOriginalEvent.position,
          finalOriginalEvent.value
        )
      );
      // lastAddedEvent = finalOriginalEvent; // Optionally update, though not strictly needed as loop is over
    }
  }

  return interpolatedEvents;
}
