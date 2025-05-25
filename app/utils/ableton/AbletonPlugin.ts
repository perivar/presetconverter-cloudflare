/**
 * Represents an Ableton plugin.
 * This abstract class provides a base structure for Ableton plugin implementations,
 * requiring concrete implementations of core methods.
 */
export abstract class AbletonPlugin {
  /**
   * Constructs a new AbletonPlugin instance.
   */
  constructor() {
    // Default constructor
  }

  /**
   * Returns a string representation of the plugin.
   * Must be implemented by subclasses.
   * @returns A string representing the plugin.
   */
  abstract toString(): string;

  /**
   * Checks if the plugin has been modified.
   * Must be implemented by subclasses.
   * @returns A boolean indicating whether the plugin has been modified.
   */
  abstract hasBeenModified(): boolean;
}
