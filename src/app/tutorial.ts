import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface Database {
  id: string;
  name: string;
  description: string;
}

export interface TocEntry {
  title: string;
  file: string;
}

/** URL slug of a chapter: its file name without the .md extension. */
export function chapterSlug(entry: TocEntry): string {
  return entry.file.replace(/\.md$/i, '');
}

export function chapterUrl(db: string, slug: string): string {
  return `assets/${db}/${slug}.md`;
}

/** Loads a database's table of contents; call from an injection context. */
export function tocResource(db: () => string | undefined) {
  return httpResource<TocEntry[]>(() => {
    const id = db();
    return id ? `assets/${id}/toc.json` : undefined;
  });
}

@Injectable({ providedIn: 'root' })
export class Tutorial {
  readonly databases = httpResource<Database[]>(() => 'assets/databases.json');
}
