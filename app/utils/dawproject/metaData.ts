/** Metadata root element of the DAWPROJECT format. This is stored in the file metadata.xml file inside the container. */
import { IMetaData } from "./types";

/** Metadata root element of the DAWPROJECT format. This is stored in the file metadata.xml file inside the container. */
export class MetaData implements IMetaData {
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

  toXml(): Element {
    const root = document.createElement("MetaData");

    if (this.title !== undefined) {
      const titleElem = document.createElement("Title");
      titleElem.textContent = this.title;
      root.appendChild(titleElem);
    }
    if (this.artist !== undefined) {
      const artistElem = document.createElement("Artist");
      artistElem.textContent = this.artist;
      root.appendChild(artistElem);
    }
    if (this.album !== undefined) {
      const albumElem = document.createElement("Album");
      albumElem.textContent = this.album;
      root.appendChild(albumElem);
    }
    if (this.originalArtist !== undefined) {
      const originalArtistElem = document.createElement("OriginalArtist");
      originalArtistElem.textContent = this.originalArtist;
      root.appendChild(originalArtistElem);
    }
    if (this.composer !== undefined) {
      const composerElem = document.createElement("Composer");
      composerElem.textContent = this.composer;
      root.appendChild(composerElem);
    }
    if (this.songwriter !== undefined) {
      const songwriterElem = document.createElement("Songwriter");
      songwriterElem.textContent = this.songwriter;
      root.appendChild(songwriterElem);
    }
    if (this.producer !== undefined) {
      const producerElem = document.createElement("Producer");
      producerElem.textContent = this.producer;
      root.appendChild(producerElem);
    }
    if (this.arranger !== undefined) {
      const arrangerElem = document.createElement("Arranger");
      arrangerElem.textContent = this.arranger;
      root.appendChild(arrangerElem);
    }
    if (this.year !== undefined) {
      const yearElem = document.createElement("Year");
      yearElem.textContent = this.year;
      root.appendChild(yearElem);
    }
    if (this.genre !== undefined) {
      const genreElem = document.createElement("Genre");
      genreElem.textContent = this.genre;
      root.appendChild(genreElem);
    }
    if (this.copyright !== undefined) {
      const copyrightElem = document.createElement("Copyright");
      copyrightElem.textContent = this.copyright;
      root.appendChild(copyrightElem);
    }
    if (this.website !== undefined) {
      const websiteElem = document.createElement("Website");
      websiteElem.textContent = this.website;
      root.appendChild(websiteElem);
    }
    if (this.comment !== undefined) {
      const commentElem = document.createElement("Comment");
      commentElem.textContent = this.comment;
      root.appendChild(commentElem);
    }

    return root;
  }

  static fromXml(element: Element): MetaData {
    const title = element.querySelector("Title")?.textContent || undefined;
    const artist = element.querySelector("Artist")?.textContent || undefined;
    const album = element.querySelector("Album")?.textContent || undefined;
    const originalArtist =
      element.querySelector("OriginalArtist")?.textContent || undefined;
    const composer =
      element.querySelector("Composer")?.textContent || undefined;
    const songwriter =
      element.querySelector("Songwriter")?.textContent || undefined;
    const producer =
      element.querySelector("Producer")?.textContent || undefined;
    const arranger =
      element.querySelector("Arranger")?.textContent || undefined;
    const year = element.querySelector("Year")?.textContent || undefined;
    const genre = element.querySelector("Genre")?.textContent || undefined;
    const copyright =
      element.querySelector("Copyright")?.textContent || undefined;
    const website = element.querySelector("Website")?.textContent || undefined;
    const comment = element.querySelector("Comment")?.textContent || undefined;

    return new MetaData(
      title,
      artist,
      album,
      originalArtist,
      composer,
      songwriter,
      producer,
      arranger,
      year,
      genre,
      copyright,
      website,
      comment
    );
  }
}
