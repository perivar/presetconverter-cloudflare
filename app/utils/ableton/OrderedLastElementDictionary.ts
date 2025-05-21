/**
 * A dictionary-like class that stores key-value pairs.
 * - If a key is added multiple times, the last value associated with that key is stored (overwritten).
 * - The `values()` and `keys()` getters return elements ordered by their corresponding keys (ascending).
 *
 * @template TKey The type of the keys in the dictionary. Must be comparable (e.g., number, string) for sorting.
 * @template TValue The type of the values in the dictionary.
 */
export class OrderedLastElementDictionary<
  TKey extends number | string,
  TValue,
> {
  private dictionary: Map<TKey, TValue>;

  constructor() {
    this.dictionary = new Map<TKey, TValue>();
  }

  /**
   * Adds a new key-value pair to the dictionary or updates the value if the key already exists.
   * @param key - The key to add or update.
   * @param value - The value associated with the key.
   */
  public addOrUpdate(key: TKey, value: TValue): void {
    this.dictionary.set(key, value);
  }

  /**
   * Gets the value associated with the specified key.
   * @param key - The key whose value to retrieve.
   * @returns The value associated with the key, or undefined if the key is not found.
   */
  public get(key: TKey): TValue | undefined {
    return this.dictionary.get(key);
  }

  /**
   * Gets an array of keys in the dictionary, sorted in ascending order.
   * @returns A sorted array of keys.
   */
  public get keys(): TKey[] {
    // Retrieve keys, convert to array, and sort.
    // Default sort for numbers and strings works as expected for ascending order.
    return Array.from(this.dictionary.keys()).sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
  }

  /**
   * Gets an array of values in the dictionary, ordered by their corresponding sorted keys.
   * @returns An array of values, ordered by sorted keys.
   */
  public get values(): TValue[] {
    const sortedKeys = this.keys; // Use the sorted keys getter
    // Map sorted keys to their values. The '!' asserts that the key exists,
    // which it must if it came from this.keys.
    return sortedKeys.map(key => this.dictionary.get(key)!);
  }
}
