import { OrderedLastElementDictionary } from "../ableton/OrderedLastElementDictionary";

describe("OrderedLastElementDictionary", () => {
  let dictionary: OrderedLastElementDictionary<number, string>;

  beforeEach(() => {
    dictionary = new OrderedLastElementDictionary<number, string>();
  });

  test("should add key-value pairs correctly", () => {
    dictionary.addOrUpdate(1, "one");
    dictionary.addOrUpdate(2, "two");
    dictionary.addOrUpdate(3, "three");

    expect(dictionary.get(1)).toBe("one");
    expect(dictionary.get(2)).toBe("two");
    expect(dictionary.get(3)).toBe("three");
    expect(dictionary.get(4)).toBeUndefined();
  });

  test("should overwrite value when adding with an existing key", () => {
    dictionary.addOrUpdate(1, "one");
    dictionary.addOrUpdate(2, "two");
    dictionary.addOrUpdate(1, "updated one");

    expect(dictionary.get(1)).toBe("updated one");
    expect(dictionary.get(2)).toBe("two");
  });

  test("should return keys in ascending order", () => {
    dictionary.addOrUpdate(3, "three");
    dictionary.addOrUpdate(1, "one");
    dictionary.addOrUpdate(2, "two");

    expect(dictionary.keys).toEqual([1, 2, 3]);
  });

  test("should return values ordered by sorted keys", () => {
    dictionary.addOrUpdate(3, "three");
    dictionary.addOrUpdate(1, "one");
    dictionary.addOrUpdate(2, "two");

    expect(dictionary.values).toEqual(["one", "two", "three"]);
  });

  test("should handle adding and updating multiple times", () => {
    dictionary.addOrUpdate(5, "five");
    dictionary.addOrUpdate(2, "two");
    dictionary.addOrUpdate(8, "eight");
    dictionary.addOrUpdate(2, "updated two");
    dictionary.addOrUpdate(5, "updated five");

    expect(dictionary.get(5)).toBe("updated five");
    expect(dictionary.get(2)).toBe("updated two");
    expect(dictionary.get(8)).toBe("eight");
    expect(dictionary.keys).toEqual([2, 5, 8]);
    expect(dictionary.values).toEqual(["updated two", "updated five", "eight"]);
  });

  test("should handle empty dictionary", () => {
    expect(dictionary.keys).toEqual([]);
    expect(dictionary.values).toEqual([]);
    expect(dictionary.get(1)).toBeUndefined();
  });

  test("should handle string keys", () => {
    const stringDictionary = new OrderedLastElementDictionary<string, number>();
    stringDictionary.addOrUpdate("c", 3);
    stringDictionary.addOrUpdate("a", 1);
    stringDictionary.addOrUpdate("b", 2);

    expect(stringDictionary.get("a")).toBe(1);
    expect(stringDictionary.get("b")).toBe(2);
    expect(stringDictionary.get("c")).toBe(3);
    expect(stringDictionary.keys).toEqual(["a", "b", "c"]);
    expect(stringDictionary.values).toEqual([1, 2, 3]);

    stringDictionary.addOrUpdate("a", 10);
    expect(stringDictionary.get("a")).toBe(10);
    expect(stringDictionary.keys).toEqual(["a", "b", "c"]);
    expect(stringDictionary.values).toEqual([10, 2, 3]);
  });
});
