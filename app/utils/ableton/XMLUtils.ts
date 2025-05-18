/**
 * Result of {@link splitPath}.
 */
export interface SplitPathResult {
  /** Segments up to—but not including—the last occurrence of {@link splitOn}. */
  before: string[];
  /** Segments after the last occurrence of {@link splitOn}, with {@link removeSuffix} trimmed. */
  after: string[];
}

/**
 * Splits a path array on the **last** occurrence of `splitOn`.
 *
 * - `before` → every segment **before** the last `splitOn`.
 * - `after`  → every segment **after** the last `splitOn`,
 *              with the trailing `removeSuffix` removed if present.
 *
 * If `splitOn` is **not found**, both `before` and `after`
 * are set to clones of the original array (mirrors original C# fallback).
 *
 * @param pathArray   Full path broken into segments.
 * @param splitOn     Marker to split on (last occurrence wins).
 * @param removeSuffix Segment to drop from the end of the `after` array if present.
 * @returns An object: `{ before, after }`.
 *
 * @example
 * const path = [
 *   "AudioEffectGroupDevice", "Branches", "AudioEffectBranch",
 *   "DeviceChain", "AudioToAudioDeviceChain", "Devices",
 *   "PluginDevice", "ParameterList", "PluginFloatParameter",
 *   "ParameterValue", "AutomationTarget"
 * ];
 *
 * const { before, after } = splitPath(path, "Devices", "AutomationTarget");
 * // before = [
 * //   "AudioEffectGroupDevice", "Branches", "AudioEffectBranch",
 * //   "DeviceChain", "AudioToAudioDeviceChain"
 * // ]
 * // after  = [
 * //   "PluginDevice", "ParameterList",
 * //   "PluginFloatParameter", "ParameterValue"
 * // ]
 */
export function splitPath(
  pathArray: string[],
  splitOn: string,
  removeSuffix: string
): SplitPathResult {
  const lastIdx = pathArray.lastIndexOf(splitOn);

  if (lastIdx === -1) {
    // Return original array twice if marker absent
    const clone = [...pathArray];
    return { before: clone, after: clone };
  }

  const before = pathArray.slice(0, lastIdx);
  let after = pathArray.slice(lastIdx + 1);

  if (after[after.length - 1] === removeSuffix) {
    after = after.slice(0, -1);
  }

  return { before, after };
}

/**
 * Retrieves a nested element from a Fast‑XML‑Parser object using a compact,
 * XPath‑like string that supports **array indexes** (`Tag[n]`) and an optional
 * **id filter** (`Tag[@id='…']`) on the **final** segment.
 *
 * Segment grammar
 * ---------------
 *  • `Tag`              → first occurrence (index 0 if array)
 *  • `Tag[n]`           → **1‑based** index `n` (XPath‑style)
 *  • `Tag[@id='value']` → **only** on last segment, matches `@_id` attribute
 *
 * @param obj      Parsed XML object (created with `{ ignoreAttributes: false }`).
 * @param pathStr  Path such as `"Root/Child[2]"` or `"Root/Child[@id='foo']"`.
 * @returns        The matched element, or `undefined` if the path cannot be resolved.
 *
 * @example
 * import { XMLParser } from "fast-xml-parser";
 *
 * const xml = `<Root><Item id="a"/><Item id="b"/></Root>`;
 * const parsed = new XMLParser({ ignoreAttributes: false }).parse(xml);
 *
 * getElementByPath(parsed, "Root/Item[2]");           // ⇒ <Item id="b">
 * getElementByPath(parsed, "Root/Item[@id='a']");     // ⇒ <Item id="a">
 */
export function getElementByPath(obj: any, pathStr: string): any {
  interface Step {
    tag: string;
    index?: number; // zero‑based, if [n] was supplied
    id?: string; // only for last step
  }

  /** Parse one path segment into { tag, index?, id? }. */
  const parseSegment = (segment: string, isLast: boolean): Step => {
    // Tag[n]  -----------------------------------------
    const idx = segment.match(/^([^\[]+)\[(\d+)]$/);
    if (idx) return { tag: idx[1], index: parseInt(idx[2], 10) - 1 };

    // Tag[@id='value']  (only valid on last segment) ---
    if (isLast) {
      const id = segment.match(/^([^\[]+)\[@id=['"](.+)['"]\]$/);
      if (id) return { tag: id[1], id: id[2] };
    }

    // Plain Tag ---------------------------------------
    return { tag: segment };
  };

  const steps: Step[] = pathStr
    .split("/")
    .map((seg, i, arr) => parseSegment(seg, i === arr.length - 1));

  let node: any = obj;

  for (const { tag, index, id } of steps) {
    if (node == null || typeof node !== "object") return undefined;

    const next = node[tag];
    if (next == null) return undefined;

    // Normalise to array so we can handle both cases seamlessly
    const list = Array.isArray(next) ? next : [next];

    if (id !== undefined) {
      node = list.find((el: any) => el?.["@_id"] === id);
    } else if (index !== undefined) {
      node = list[index];
    } else {
      node = list[0];
    }
  }

  return node; // typed as `any`, never `unknown`
}
