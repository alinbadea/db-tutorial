import { Component, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { chapterSlug, tocResource } from '../tutorial';

@Component({
  selector: 'app-database',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './database.html',
})
export class DatabaseView {
  readonly db = input.required<string>();

  protected readonly toc = tocResource(this.db);
  protected readonly tocOpen = signal(false);
  protected readonly slug = chapterSlug;
}
