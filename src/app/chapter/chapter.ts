import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';
import { chapterSlug, chapterUrl, tocResource } from '../tutorial';

@Component({
  selector: 'app-chapter',
  imports: [MarkdownComponent, RouterLink],
  templateUrl: './chapter.html',
})
export class Chapter {
  readonly db = input.required<string>();
  readonly chapter = input<string>();

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly toc = tocResource(this.db);
  protected readonly failed = signal(false);
  protected readonly slug = chapterSlug;

  protected readonly src = computed(() => {
    const chapter = this.chapter();
    return chapter ? chapterUrl(this.db(), chapter) : undefined;
  });

  private readonly index = computed(() =>
    (this.toc.value() ?? []).findIndex((e) => chapterSlug(e) === this.chapter()),
  );
  protected readonly prev = computed(() => {
    const i = this.index();
    return i > 0 ? this.toc.value()![i - 1] : undefined;
  });
  protected readonly next = computed(() => {
    const i = this.index();
    return i >= 0 ? this.toc.value()![i + 1] : undefined;
  });

  constructor() {
    // Opening a database without a chapter jumps to its first chapter.
    effect(() => {
      const first = this.toc.value()?.[0];
      if (!this.chapter() && first) {
        this.router.navigate([chapterSlug(first)], { relativeTo: this.route, replaceUrl: true });
      }
    });

    effect(() => {
      this.src();
      this.failed.set(false);
    });
  }

  protected onLoad(): void {
    window.scrollTo({ top: 0 });
  }
}
