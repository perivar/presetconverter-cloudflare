// dawproject/points.ts
import { AutomationTarget } from "./automation-target";
import type { Point } from "./point";
import type {
  Points as PointsType,
  TimeUnit,
  Unit,
  XsString,
} from "./project-schema";
import { Timeline } from "./timeline";

/**
 * A timeline of points for automation or expression.
 * All the points should be of the same element-type and match the target.
 */
export class Points extends Timeline implements PointsType {
  /**
   * The parameter or expression this timeline should target.
   * (Required child element)
   */
  public Target: AutomationTarget = new AutomationTarget();

  /**
   * The contained points. They should all be of the same type and match the target parameter.
   * (Required child element - unbounded)
   */
  public Point: Point[] = [];

  /**
   * A unit should be provided for when used with RealPoint elements.
   * (Optional attribute)
   */
  public "@_unit"?: Unit;

  /**
   * @param target - The target of the automation. (Required child element)
   * @param timeUnit - The time unit used for the timeline. (Optional attribute inherited from Timeline)
   * @param unit - The unit of the automation values. (Optional attribute)
   * @param track - A reference to the track this timeline belongs to. (Optional attribute inherited from Timeline - xs:IDREF)
   * @param name - The name of the points collection. (Optional attribute inherited from Nameable)
   * @param color - The color of the points collection. (Optional attribute inherited from Nameable)
   * @param comment - A comment for the points collection. (Optional attribute inherited from Nameable)
   */
  constructor(
    target: AutomationTarget,
    timeUnit: TimeUnit = "beats",
    unit?: Unit,
    track?: XsString,
    name?: XsString,
    color?: XsString,
    comment?: XsString
  ) {
    super(timeUnit, track, name, color, comment);
    this.Target = target;
    this["@_unit"] = unit;
  }
}
