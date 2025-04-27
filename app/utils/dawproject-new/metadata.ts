// dawproject/metadata.ts
import type { MetaData as MetaDataType, XsString } from "./metadata-schema";

/**
 * Represents metadata for the project.
 * Corresponds to the 'metaData' complex type in MetaData.xsd.
 */
export class MetaData implements MetaDataType {
  // Properties corresponding to child elements
  public Title?: XsString;
  public Artist?: XsString;
  public Album?: XsString;
  public OriginalArtist?: XsString;
  public Composer?: XsString;
  public Songwriter?: XsString;
  public Producer?: XsString;
  public Arranger?: XsString;
  public Year?: XsString;
  public Genre?: XsString;
  public Copyright?: XsString;
  public Website?: XsString;
  public Comment?: XsString;

  /**
   * @param title - The title of the project. (Optional)
   * @param artist - The artist of the project. (Optional)
   * @param album - The album the project belongs to. (Optional)
   * @param originalArtist - The original artist of the project. (Optional)
   * @param composer - The composer of the project. (Optional)
   * @param songwriter - The songwriter of the project. (Optional)
   * @param producer - The producer of the project. (Optional)
   * @param arranger - The arranger of the project. (Optional)
   * @param year - The year of the project. (Optional)
   * @param genre - The genre of the project. (Optional)
   * @param copyright - The copyright information for the project. (Optional)
   * @param website - The website associated with the project. (Optional)
   * @param comment - A comment for the project. (Optional)
   */
  constructor(
    title?: XsString,
    artist?: XsString,
    album?: XsString,
    originalArtist?: XsString,
    composer?: XsString,
    songwriter?: XsString,
    producer?: XsString,
    arranger?: XsString,
    year?: XsString,
    genre?: XsString,
    copyright?: XsString,
    website?: XsString,
    comment?: XsString
  ) {
    this.Title = title;
    this.Artist = artist;
    this.Album = album;
    this.OriginalArtist = originalArtist;
    this.Composer = composer;
    this.Songwriter = songwriter;
    this.Producer = producer;
    this.Arranger = arranger;
    this.Year = year;
    this.Genre = genre;
    this.Copyright = copyright;
    this.Website = website;
    this.Comment = comment;
  }
}
