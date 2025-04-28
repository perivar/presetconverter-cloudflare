import { RealParameter } from "./realParameter";
import { TimeSignatureParameter } from "./timeSignatureParameter";
import { XmlElement } from "./xmlDecorators";

/** Transport element containing playback parameters such as Tempo and Time-signature. */
export class Transport {
  /** Tempo parameter for setting and/or automating the tempo. */
  @XmlElement({ name: "Tempo", type: "RealParameter" })
  tempo?: RealParameter;

  /** Time-signature parameter. */
  @XmlElement({ name: "TimeSignature", type: "TimeSignatureParameter" })
  timeSignature?: TimeSignatureParameter;
}
