import { AbletonPlugin } from "./AbletonPlugin";
import { getParam } from "./XMLUtils";

export enum LimiterLookaheadMS {
  Lookahead1_5ms = 0,
  Lookahead3ms = 1,
  Lookahead6ms = 2,
}

export class AbletonLimiter implements AbletonPlugin {
  public Gain: number;
  public Ceiling: number;
  public Release: number;
  public AutoRelease: boolean;
  public LinkChannels: boolean;
  public Lookahead: LimiterLookaheadMS;

  constructor(xElement: any) {
    this.Gain = getParam(xElement, "Gain", "float", "0");
    this.Ceiling = getParam(xElement, "Ceiling", "float", "0");
    this.Release = getParam(xElement, "Release", "float", "0");
    this.AutoRelease = getParam(xElement, "AutoRelease", "bool", "false");
    this.LinkChannels = getParam(xElement, "LinkChannels", "bool", "false");
    this.Lookahead = getParam(xElement, "Lookahead", "int", "0");
  }

  public HasBeenModified(): boolean {
    const ceilingTolerance = 0.0001; // Adjust the tolerance as needed
    return (
      this.Gain !== 0 ||
      Math.abs(this.Ceiling + 0.3) > ceilingTolerance ||
      this.Release !== 300 ||
      !this.AutoRelease ||
      !this.LinkChannels ||
      this.Lookahead !== LimiterLookaheadMS.Lookahead3ms
    );
  }

  public toString(): string {
    return `Gain: ${this.Gain.toFixed(2)} dB, Ceiling: ${this.Ceiling.toFixed(2)} dB, Release: ${this.Release.toFixed(2)} ms, AutoRelease: ${this.AutoRelease}, LinkChannels: ${this.LinkChannels}, Lookahead: ${this.Lookahead}`;
  }
}
