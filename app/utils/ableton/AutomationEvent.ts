/**
 * Represents an automation event with a specific position (often time-based) and a value.
 * This class implements an `equals` method for value-based comparison.
 */
export class AutomationEvent {
  /**
   * The position of the event (e.g., time in milliseconds, sample number).
   */
  public position: number;

  /**
   * The value of the event at the given position.
   */
  public value: number;

  /**
   * Creates an instance of AutomationEvent.
   * @param position - The position of the event.
   * @param value - The value of the event.
   */
  constructor(position: number, value: number) {
    this.position = position;
    this.value = value;
  }

  /**
   * Returns a string representation of the event.
   * @returns A string in the format "[Position] Value".
   */
  public toString(): string {
    return `[${this.position}] ${this.value}`;
  }

  /**
   * Checks if this event is equal to another AutomationEvent.
   * Two events are considered equal if their position and value are the same.
   * @param other - The other AutomationEvent to compare with. Can be null or undefined.
   * @returns True if the events are equal, false otherwise.
   */
  public equals(other: AutomationEvent | null | undefined): boolean {
    if (other == null) {
      // This check handles both null and undefined
      return false;
    }
    return this.position === other.position && this.value === other.value;
  }
}
