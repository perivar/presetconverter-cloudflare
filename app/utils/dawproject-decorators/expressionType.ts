/** Represents the type of an expression. */
export enum ExpressionType {
  gain = "gain",
  pan = "pan",
  transpose = "transpose",
  timbre = "timbre",
  formant = "formant",
  pressure = "pressure",

  // MIDI
  channelController = "channelController",
  channelPressure = "channelPressure",
  polyPressure = "polyPressure",
  pitchBend = "pitchBend",
  programChange = "programChange",
}
