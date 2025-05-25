// =============================================================================
// Helper Classes (Ported/Adapted from C#, which is again based on Python)
// =============================================================================

import { Log } from "./Log";

export class XtraMath {
  // placement_loop.py

  /** Helper for cutLoop - handles loops where loopStart > placementStart */
  static loopBefore(
    placementPos: number,
    placementDur: number,
    placementStart: number,
    loopStart: number,
    loopEnd: number
  ): number[][] {
    const cutPoints: number[][] = [];
    const loopSize = loopEnd - loopStart;

    if (loopSize <= 0) {
      Log.Warning(
        `loopBefore: Invalid loop size (${loopSize}). loopStart=${loopStart}, loopEnd=${loopEnd}. Returning original segment.`
      );
      return [
        [
          placementPos,
          placementDur,
          placementStart,
          placementStart + placementDur,
        ],
      ];
    }

    // Position within the source material (where we read from)
    let currentReadPos = placementStart;
    // Position in the output timeline (where we write to)
    let currentWritePos = placementPos;
    // How much duration is left to place
    let remainingDuration = placementDur;

    // --- First segment: from placementStart up to loopEnd ---
    // Duration of the first segment
    const firstSegmentDur = Math.min(
      remainingDuration,
      loopEnd - currentReadPos
    );

    if (firstSegmentDur > 0) {
      cutPoints.push([
        currentWritePos, // Output position
        firstSegmentDur, // Output duration
        currentReadPos, // Source start position
        currentReadPos + firstSegmentDur, // Source end position
      ]);
      // Update positions and remaining duration
      currentWritePos += firstSegmentDur;
      remainingDuration -= firstSegmentDur;
      currentReadPos += firstSegmentDur; // This should now be == loopEnd if duration was sufficient
    }

    // --- Subsequent segments: looping from loopStart ---
    while (remainingDuration > 0) {
      // Start reading from the beginning of the loop
      currentReadPos = loopStart;
      // Duration of this segment (min of remaining duration and loop size)
      const segmentDur = Math.min(remainingDuration, loopSize);

      if (segmentDur <= 0) break; // Safety break

      cutPoints.push([
        currentWritePos, // Output position
        segmentDur, // Output duration
        currentReadPos, // Source start position (loopStart)
        currentReadPos + segmentDur, // Source end position
      ]);
      // Update positions and remaining duration
      currentWritePos += segmentDur;
      remainingDuration -= segmentDur;
      currentReadPos += segmentDur; // Move read position forward
    }

    return cutPoints;
  }

  /** Helper for cutLoop - handles loops where loopStart <= placementStart */
  static loopAfter(
    placementPos: number,
    placementDur: number,
    placementStart: number,
    loopStart: number,
    loopEnd: number
  ): number[][] {
    const cutPoints: number[][] = [];
    const loopSize = loopEnd - loopStart;

    if (loopSize <= 0) {
      Log.Warning(
        `loopAfter: Invalid loop size (${loopSize}). loopStart=${loopStart}, loopEnd=${loopEnd}. Returning original segment.`
      );
      return [
        [
          placementPos,
          placementDur,
          placementStart,
          placementStart + placementDur,
        ],
      ];
    }

    // Position within the source material (where we read from)
    let currentReadPos = placementStart;
    // Position in the output timeline (where we write to)
    let currentWritePos = placementPos;
    // How much duration is left to place
    let remainingDuration = placementDur;

    while (remainingDuration > 0) {
      // If currentReadPos is outside the loop, reset it to loopStart
      if (currentReadPos < loopStart || currentReadPos >= loopEnd) {
        currentReadPos = loopStart;
      }

      // Duration of this segment (min of remaining duration and time left in loop)
      const segmentDur = Math.min(remainingDuration, loopEnd - currentReadPos);

      if (segmentDur <= 0) {
        // This can happen if remainingDuration > 0 but currentReadPos is exactly loopEnd
        // Reset read position and continue loop
        currentReadPos = loopStart;
        continue;
      }

      cutPoints.push([
        currentWritePos, // Output position
        segmentDur, // Output duration
        currentReadPos, // Source start position
        currentReadPos + segmentDur, // Source end position
      ]);

      // Update positions and remaining duration
      currentWritePos += segmentDur;
      remainingDuration -= segmentDur;
      currentReadPos += segmentDur; // Move read position forward
    }

    return cutPoints;
  }

  /**
   * Calculates cut segments for a looped placement.
   * Based on C# CutLoop which implements Python's placement_loop.py.
   * @returns Array of [outPos, outDur, srcStart, srcEnd] tuples.
   */
  static cutLoop(
    placementPos: number, // Position of the placement on the timeline
    placementDur: number, // Duration of the placement on the timeline
    placementStart: number, // Start position within the source clip to read from
    loopStart: number, // Loop start position within the source clip
    loopEnd: number // Loop end position within the source clip
  ): number[][] {
    // Basic validation
    if (loopEnd <= loopStart) {
      Log.Warning(
        `cutLoop: Invalid loop points: loopStart=${loopStart}, loopEnd=${loopEnd}. Returning non-looped segment.`
      );
      // Return a single segment representing the original placement
      return [
        [
          placementPos,
          placementDur,
          placementStart,
          placementStart + placementDur,
        ],
      ];
    }

    // Choose the correct helper based on whether the placement starts before or after the loop point
    if (loopStart > placementStart) {
      return this.loopBefore(
        placementPos,
        placementDur,
        placementStart,
        loopStart,
        loopEnd
      );
    } else {
      return this.loopAfter(
        placementPos,
        placementDur,
        placementStart,
        loopStart,
        loopEnd
      );
    }
  }
}
