// dawproject/transport.ts
import type { Transport as TransportType } from "./project-schema";
import type { RealParameter } from "./real-parameter";
import type { TimeSignatureParameter } from "./time-signature-parameter";

/**
 * Represents the transport section of the project (tempo, time signature, etc.).
 * Corresponds to the 'transport' complex type in Project.xsd.
 */
export class Transport implements TransportType {
  // Add XmlElement properties (inherited from the type definition)
  public "@_xmlns"?: string;
  [ns: `@_xmlns:${string}`]: string | undefined;

  // Properties corresponding to child elements

  /**
   * The tempo parameter for the transport.
   * (Optional child element)
   */
  public Tempo?: RealParameter;

  /**
   * The time signature parameter for the transport.
   * (Optional child element)
   */
  public TimeSignature?: TimeSignatureParameter;

  /**
   * @param tempo - The tempo parameter for the transport. (Optional child element)
   * @param timeSignature - The time signature parameter for the transport. (Optional child element)
   */
  constructor(tempo?: RealParameter, timeSignature?: TimeSignatureParameter) {
    this.Tempo = tempo;
    this.TimeSignature = timeSignature;
  }
}
