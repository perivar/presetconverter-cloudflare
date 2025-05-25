// =============================================================================
// Helper Classes (Ported/Adapted from C#, which is again based on Python)
// =============================================================================

import { Log } from "./Log";
import { XtraMath } from "./XtraMath";

export class AbletonFunctions {
  /**
   * Convert a hexadecimal value #FF00FF to RGB. Returns an array of doubles between 0 and 1.
   */
  static hexToRgbDouble(hex: string): number[] {
    hex = hex.replace(/^#/, ""); // Remove leading # if present
    if (hex.length !== 6) {
      Log.Error("Invalid hexadecimal color code:", hex);
      return [1.0, 1.0, 1.0]; // Default to white on error
    }
    // Parse hex components
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Normalize to 0.0 - 1.0 range
    const factor = 1.0 / 255.0;
    return [r * factor, g * factor, b * factor];
  }

  /**
   * Converts a list of automation points into a structured object containing
   * overall position, duration, and the points relative to the start position.
   * Based on C# ToPointList which implements Python's auto_nopl.py: def to_pl(pointsdata):
   * @param list Array of points, each with { position: number, value: number }
   * @returns Object { position: number, duration: number, points: any[] }
   */
  static toPointList(list: any[]): any {
    // auto_nopl.py: def to_pl(pointsdata):
    if (!list || list.length === 0) {
      // Handle empty list case
      return { position: 0, duration: 4, points: [] }; // Default duration 4?
    }

    // Find the min and max position from the list
    const { startPos, endPos } = this.getDurPos(list);

    // Calculate duration based on min/max positions
    // Add a small buffer (e.g., 4 beats) like C# seems to do?
    const duration = endPos - startPos + 4;

    // Trim and move points relative to the start position
    const relativePoints = this.trimMove(list, startPos, startPos + endPos);

    return {
      position: startPos, // Overall start position
      duration: duration, // Overall duration
      points: relativePoints, // Points relative to startPos
    };
  }

  /**
   * Finds the minimum and maximum position within a list of points.
   * Based on C# GetDurPos which implements Python's auto.py
   * @param list Array of points, each with { position: number }
   * @returns Object { startPos: number, endPos: number }
   */
  static getDurPos(list: any[]): { startPos: number; endPos: number } {
    // auto.py
    if (!list || list.length === 0) {
      return { startPos: 0, endPos: 0 };
    }

    let minPos = list[0].position;
    let maxPos = list[0].position;

    for (let i = 1; i < list.length; i++) {
      const pos = list[i].position;
      if (pos < minPos) minPos = pos;
      if (pos > maxPos) maxPos = pos;
    }

    // Let's return min and max directly for clarity
    return { startPos: minPos, endPos: maxPos };
  }

  /**
   * Trims points outside a specified range and moves remaining points relative to a start offset.
   * Based on C# TrimMove which implements Python's notelist_data.py and auto.py.
   * @param list Array of points { position: number, ... }
   * @param startAt Offset to subtract from positions.
   * @param endAt Position value (exclusive) to trim points after.
   * @returns New array with trimmed and moved points.
   */
  static trimMove(
    list: any[],
    startAt: number | null | undefined,
    endAt: number | null | undefined
  ): any[] {
    // notelist_data.py and auto.py
    let newList = [...list]; // Create a copy

    // 1. Trim points that are at or after endAt
    if (endAt != null) {
      newList = this.trim(newList, endAt);
    }

    // 2. Move remaining points by subtracting startAt
    if (startAt != null) {
      newList = this.move(newList, -startAt);
    }

    return newList;
  }

  /**
   * Filters a list of points, keeping only those before a specified position.
   * Based on C# Trim which implements Python's notelist_data.py and auto.py.
   * @param list Array of points { position: number, ... }
   * @param pos The position (exclusive) to trim after.
   * @returns New array with points before pos.
   */
  static trim(list: any[], pos: number): any[] {
    // notelist_data.py and auto.py
    // Keep elements where element.position is strictly less than pos
    return list.filter(element => element.position < pos);
  }

  /**
   * Moves all points in a list by a given offset, removing points that end up before position 0.
   * Based on C# Move which implements Python's notelist_data.py and auto.py.
   * @param list Array of points { position: number, ... }
   * @param posOffset The amount to add to each position.
   * @returns New array with moved points (position >= 0).
   */
  static move(list: any[], posOffset: number): any[] {
    // notelist_data.py and auto.py
    return list
      .map(element => ({
        ...element, // Copy existing properties
        position: element.position + posOffset, // Apply offset
      }))
      .filter(element => element.position >= 0); // Keep only points at or after 0
  }

  /**
   * Processes note placements, expanding loops into multiple cut segments.
   * Based on C# RemoveLoopsDoPlacements which implements Python's loops_remove.py.
   * @param notePlacements Array of note placement objects.
   * @param outPlacementLoop Set to track processed loop types (not used in current logic).
   * @returns New array of note placements with loops expanded.
   */
  static removeLoopsDoPlacements(notePlacements: any[]): any[] {
    // loops_remove.py
    const newPlacements: any[] = [];

    for (const notePlacement of notePlacements) {
      // Check if placement has 'cut' data and it's a loop type
      if (
        notePlacement.cut &&
        (notePlacement.cut.type === "loop" ||
          notePlacement.cut.type === "loop_off" ||
          notePlacement.cut.type === "loop_adv")
      ) {
        // Clone the base placement data, removing loop-specific fields
        const notePlacementBase = { ...notePlacement }; // Shallow clone
        delete notePlacementBase.cut;
        delete notePlacementBase.position;
        delete notePlacementBase.duration;

        // Extract loop parameters
        const loopBasePosition = notePlacement.position;
        const loopBaseDuration = notePlacement.duration;
        // Use nullish coalescing for defaults
        const loopStart = notePlacement.cut.start ?? 0;
        const loopLoopStart = notePlacement.cut.loopstart ?? 0;
        const loopLoopEnd = notePlacement.cut.loopend ?? loopBaseDuration; // Default end is placement duration

        // Calculate the cut points based on loop parameters
        const cutpoints = XtraMath.cutLoop(
          loopBasePosition,
          loopBaseDuration,
          loopStart,
          loopLoopStart,
          loopLoopEnd
        );

        // Create new placements for each cut segment
        for (const cutpoint of cutpoints) {
          const notePlacementCutted = { ...notePlacementBase }; // Shallow clone
          notePlacementCutted.position = cutpoint[0]; // New position
          notePlacementCutted.duration = cutpoint[1]; // New duration
          // Add 'cut' info representing the source segment
          notePlacementCutted.cut = {
            type: "cut", // Mark as a simple cut segment now
            start: cutpoint[2], // Source start within the original loop/clip
            end: cutpoint[3], // Source end within the original loop/clip
          };
          newPlacements.push(notePlacementCutted);
        }
      } else {
        // If not a loop or no cut data, add the original placement
        newPlacements.push(notePlacement);
      }
    }
    return newPlacements;
  }

  /**
   * Processes note placements with 'cut' data, trimming and moving the internal notelist.
   * Based on C# RemoveCutDoPlacements which implements Python's removecut.py.
   * Modifies the notePlacements array in place.
   * @param notePlacements Array of note placement objects.
   */
  static removeCutDoPlacements(notePlacements: any[]): void {
    // removecut.py
    for (const notePlacement of notePlacements) {
      // Check for 'cut' data of type 'cut'
      if (notePlacement.cut && notePlacement.cut.type === "cut") {
        const cutStart = notePlacement.cut.start ?? 0;
        // Calculate the end position within the source clip based on placement duration
        const cutEnd = cutStart + notePlacement.duration;

        // Trim and move the notes *inside* this placement
        if (notePlacement.notelist) {
          notePlacement.notelist = this.trimMove(
            notePlacement.notelist,
            cutStart, // Move notes relative to cutStart
            cutEnd // Trim notes after cutEnd
          );
        }

        // Remove the 'cut' property as it has been processed
        delete notePlacement.cut;
      }
    }
  }

  /**
   * Creates a 'cut' object representing loop parameters.
   * Based on C# CutLoopData which implements Python's placement_data.py.
   * @param start Start position relative to the clip start (beats).
   * @param loopStart Loop start position within the clip (beats).
   * @param loopEnd Loop end position within the clip (beats).
   * @returns Object representing the loop type and parameters.
   */
  static cutLoopData(start: number, loopStart: number, loopEnd: number): any {
    // placement_data.py
    // Determine loop type based on parameters
    if (start === 0 && loopStart === 0) {
      // Simple loop from the beginning
      return { type: "loop", loopend: loopEnd };
    } else if (loopStart === 0) {
      // Loop starts from beginning, but placement starts later
      return { type: "loop_off", start: start, loopend: loopEnd };
    } else {
      // Advanced loop with specific start and loop points
      return {
        type: "loop_adv",
        start: start,
        loopstart: loopStart,
        loopend: loopEnd,
      };
    }
  }
}
