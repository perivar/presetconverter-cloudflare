export class GenericCompressorLimiter {
  constructor(
    public Name: string,
    public Threshold: number, // dB
    public Ratio: number, // e.g. 4 means 4:1
    public MakeupGain: number, // dB
    public Attack: number, // ms
    public Release: number, // seconds
    public Knee: number = 0, // dB width
    public Fade: number = 0, // optional
    public RateS?: number, // optional auto-fade
    public IsIn: boolean = true,
    public Analog: boolean = false
  ) {}

  public getRatioLabel(): string {
    return `${this.Ratio}:1`;
  }

  public toString(): string {
    const sb: string[] = [];
    sb.push(`Name: ${this.Name}`);
    sb.push(`Threshold: ${this.Threshold.toFixed(2)} dB`);
    sb.push(`Ratio: ${this.getRatioLabel()}`);
    sb.push(`Makeup Gain: ${this.MakeupGain.toFixed(2)} dB`);
    sb.push(`Attack: ${this.Attack.toFixed(2)} ms`);
    sb.push(`Release: ${this.Release.toFixed(2)} s`);
    sb.push(`Knee: ${this.Knee.toFixed(2)} dB`);
    sb.push(`Fade: ${this.Fade}`);
    if (this.RateS !== undefined) {
      sb.push(`Rate S (Autofade duration): ${this.RateS} s`);
    }
    sb.push(`In: ${this.IsIn}`);
    sb.push(`Analog: ${this.Analog}`);
    sb.push("\n");
    sb.push(`Knee (dB) | Interpretation           | Use case`);
    sb.push(
      `----------|--------------------------|-------------------------------------------`
    );
    sb.push(
      `0         | Hard knee                | Snappy, aggressive compression (drums, FX)`
    );
    sb.push(
      `3         | Mild soft knee           | Transparent compression with subtle onset`
    );
    sb.push(
      `6         | Moderate soft knee       | Master bus, vocals, general use`
    );
    sb.push(
      `9–12      | Very soft knee           | Extremely transparent, subtle leveling`
    );

    return sb.join("\n");
  }
}
