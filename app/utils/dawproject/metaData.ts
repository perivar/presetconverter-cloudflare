import { XMLBuilder, XMLParser } from "fast-xml-parser";

import { IMetaData } from "./types";
import { XmlObject } from "./XmlObject";

/** Metadata root element of the DAWPROJECT format. This is stored in the file metadata.xml file inside the container. */
export class MetaData extends XmlObject implements IMetaData {
  /** Title of the song/project. */
  title?: string;
  /** Recording Artist. */
  artist?: string;
  /** Album. */
  album?: string;
  /** Original Artist. */
  originalArtist?: string;
  /** Composer. */
  composer?: string;
  /** Songwriter. */
  songwriter?: string;
  /** Producer. */
  producer?: string;
  /** Arranger. */
  arranger?: string;
  /** Year this project/song was recorded. */
  year?: string;
  /** Genre/style */
  genre?: string;
  /** Copyright notice. */
  copyright?: string;
  /** URL to website related to this project. */
  website?: string;
  /** General comment or description. */
  comment?: string;

  constructor(
    title?: string,
    artist?: string,
    album?: string,
    originalArtist?: string,
    composer?: string,
    songwriter?: string,
    producer?: string,
    arranger?: string,
    year?: string,
    genre?: string,
    copyright?: string,
    website?: string,
    comment?: string
  ) {
    super();
    this.title = title;
    this.artist = artist;
    this.album = album;
    this.originalArtist = originalArtist;
    this.composer = composer;
    this.songwriter = songwriter;
    this.producer = producer;
    this.arranger = arranger;
    this.year = year;
    this.genre = genre;
    this.copyright = copyright;
    this.website = website;
    this.comment = comment;
  }

  toXml(): string {
    const builder = new XMLBuilder({ attributeNamePrefix: "" });
    return builder.build(this.toXmlObject());
  }

  static fromXml(xmlString: string): MetaData {
    const parser = new XMLParser({ attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlString);
    return MetaData.fromXmlObject(jsonObj.MetaData);
  }

  toXmlObject(): any {
    const obj: any = { MetaData: {} };
    if (this.title !== undefined) obj.MetaData.Title = this.title;
    if (this.artist !== undefined) obj.MetaData.Artist = this.artist;
    if (this.album !== undefined) obj.MetaData.Album = this.album;
    if (this.originalArtist !== undefined)
      obj.MetaData.OriginalArtist = this.originalArtist;
    if (this.composer !== undefined) obj.MetaData.Composer = this.composer;
    if (this.songwriter !== undefined)
      obj.MetaData.Songwriter = this.songwriter;
    if (this.producer !== undefined) obj.MetaData.Producer = this.producer;
    if (this.arranger !== undefined) obj.MetaData.Arranger = this.arranger;
    if (this.year !== undefined) obj.MetaData.Year = this.year;
    if (this.genre !== undefined) obj.MetaData.Genre = this.genre;
    if (this.copyright !== undefined) obj.MetaData.Copyright = this.copyright;
    if (this.website !== undefined) obj.MetaData.Website = this.website;
    if (this.comment !== undefined) obj.MetaData.Comment = this.comment;
    return obj;
  }

  static fromXmlObject(xmlObject: any): MetaData {
    const md = xmlObject || {};
    return new MetaData(
      md.Title,
      md.Artist,
      md.Album,
      md.OriginalArtist,
      md.Composer,
      md.Songwriter,
      md.Producer,
      md.Arranger,
      md.Year,
      md.Genre,
      md.Copyright,
      md.Website,
      md.Comment
    );
  }
}
