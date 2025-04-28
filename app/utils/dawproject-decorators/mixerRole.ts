/** Represents the role of a mixer channel. */
export enum MixerRole {
  regular = "regular",
  master = "master",
  effectTrack = "effect", // Corresponds to @XmlEnumValue("effect")
  subMix = "submix", // Corresponds to @XmlEnumValue("submix")
  vca = "vca", // Corresponds to @XmlEnumValue("vca")
}
