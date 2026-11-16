import { Component, ElementRef, computed, effect, inject, input, signal } from '@angular/core';
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
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

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
    this.enableInteractiveAnimations();
  }

  /**
   * Markdown images render as <img>, where SVG scripts don't run. Animations (files ending in
   * "animatie.svg") have clickable controls, so they are swapped for an <object> with the same size.
   */
  private enableInteractiveAnimations(): void {
    const images = this.host.nativeElement.querySelectorAll<HTMLImageElement>('img[src$="animatie.svg"]');
    for (const img of images) {
      const swap = () => {
        const obj = document.createElement('object');
        obj.type = 'image/svg+xml';
        obj.data = img.src;
        obj.ariaLabel = img.alt;
        obj.className = 'my-8 block w-full';
        obj.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
        img.replaceWith(obj);
      };
      if (img.complete) swap();
      else img.addEventListener('load', swap, { once: true });
    }
  }
}
