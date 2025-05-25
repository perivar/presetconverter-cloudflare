// =============================================================================
// Helper Classes (Ported/Adapted from C#, which is again based on Python)
// =============================================================================

export class DataValues {
  // data_values.py

  /** Sets a value in a nested object structure, creating intermediate objects if they don't exist. */
  static nestedDictAddValue(dict: any, keys: string[], value: any): void {
    let current = dict;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      // Create nested object if it doesn't exist or is not an object
      if (
        !(key in current) ||
        typeof current[key] !== "object" ||
        current[key] === null
      ) {
        current[key] = {};
      }
      current = current[key];
    }
    // Set the value at the final key
    current[keys[keys.length - 1]] = value;
  }

  /** Adds a value to a list within a nested object structure, creating intermediate objects/lists if needed. */
  static nestedDictAddToList(dict: any, keys: string[], value: any): void {
    let current = dict;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      // Create nested object if it doesn't exist or is not an object
      if (
        !(key in current) ||
        typeof current[key] !== "object" ||
        current[key] === null
      ) {
        current[key] = {};
      }
      current = current[key];
    }
    const lastKey = keys[keys.length - 1];
    // Ensure the target property is an array
    if (!Array.isArray(current[lastKey])) {
      current[lastKey] = [];
    }
    // If the value itself is an array, replace the list (like C# logic)
    // Otherwise, push the single value onto the list
    if (Array.isArray(value)) {
      current[lastKey] = value; // Replace existing list with the new array
    } else {
      current[lastKey].push(value); // Add single item to the list
    }
  }
}
