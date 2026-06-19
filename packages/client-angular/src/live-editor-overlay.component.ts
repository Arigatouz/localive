import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef, signal } from '@angular/core';
import type { OnDestroy, OnInit } from '@angular/core';
import { LOCALIVE_INSTANCE } from './provide-localive';
import type { I18nLiveInstance, Locale, TranslationEntry } from '@localive/core';

@Component({
  selector: 'localive-overlay',
  template: `
    @if (active()) {
      <div>
        @if (hoveredElement()) {
          <div
            class="localive-hover-highlight"
            [style.position]="'fixed'"
            [style.top.px]="hoveredElement()!.getBoundingClientRect().top - 2"
            [style.left.px]="hoveredElement()!.getBoundingClientRect().left - 2"
            [style.width.px]="hoveredElement()!.getBoundingClientRect().width + 4"
            [style.height.px]="hoveredElement()!.getBoundingClientRect().height + 4"
            [style.border]="'2px solid #6366f1'"
            [style.borderRadius]="'4px'"
            [style.pointerEvents]="'none'"
            [style.zIndex]="999998"
          ></div>
        }

        <button
          class="localive-toggle-btn"
          (click)="deactivate()"
          [style.position]="'fixed'"
          [style.bottom]="'16px'"
          [style.right]="'16px'"
          [style.zIndex]="999999"
          [style.backgroundColor]="'#6366f1'"
          [style.color]="'white'"
          [style.border]="'none'"
          [style.borderRadius]="'50%'"
          [style.width]="'48px'"
          [style.height]="'48px'"
          [style.fontSize]="'20px'"
          [style.cursor]="'pointer'"
          [style.boxShadow]="'0 4px 12px rgba(0,0,0,0.3)'"
          title="Close Localive editor"
        >&#x2715;</button>

        @if (currentKey()) {
          <div
            #editorPanel
            class="localive-editor-panel"
            [style.position]="'fixed'"
            [style.top]="'50%'"
            [style.left]="'50%'"
            [style.transform]="'translate(-50%, -50%)'"
            [style.zIndex]="999999"
            [style.backgroundColor]="'white'"
            [style.border]="'1px solid #e5e7eb'"
            [style.borderRadius]="'8px'"
            [style.padding]="'16px'"
            [style.width]="'400px'"
            [style.maxHeight]="'80vh'"
            [style.overflowY]="'auto'"
            [style.boxShadow]="'0 25px 50px -12px rgba(0,0,0,0.25)'"
          >
            <div [style.display]="'flex'" [style.justifyContent]="'space-between'" [style.alignItems]="'center'" [style.marginBottom]="'12px'">
              <strong [style.fontSize]="'14px'">{{ currentKey() }}</strong>
              <button (click)="closeEditor()" [style.border]="'none'" [style.background]="'none'" [style.cursor]="'pointer'" [style.fontSize]="'18px'">&#x2715;</button>
            </div>
            <div [style.marginBottom]="'12px'">
              <label [style.display]="'block'" [style.fontSize]="'12px'" [style.color]="'#6b7280'" [style.marginBottom]="'4px'">
                {{ editingLocale() }}
              </label>
              <textarea
                [value]="editValue()"
                (input)="onEditorInput($event)"
                [style.width]="'100%'"
                [style.padding]="'8px'"
                [style.border]="'1px solid #d1d5db'"
                [style.borderRadius]="'4px'"
                [style.fontSize]="'14px'"
                [style.resize]="'vertical'"
                [style.minHeight]="'60px'"
              ></textarea>
            </div>
            <button
              (click)="saveTranslation()"
              [disabled]="saving()"
              [style.width]="'100%'"
              [style.padding]="'8px'"
              [style.backgroundColor]="saving() ? '#9ca3af' : '#6366f1'"
              [style.color]="'white'"
              [style.border]="'none'"
              [style.borderRadius]="'4px'"
              [style.cursor]="saving() ? 'not-allowed' : 'pointer'"
              [style.fontSize]="'14px'"
            >
              {{ saving() ? 'Saving...' : 'Save' }}
            </button>
          </div>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class LiveEditorOverlayComponent implements OnInit, OnDestroy {
  active = signal(false);
  currentKey = signal<string | null>(null);
  editValue = signal('');
  editingLocale = signal<Locale>('en');
  hoveredElement = signal<HTMLElement | null>(null);
  saving = signal(false);

  private cleanupFns: (() => void)[] = [];

  constructor(
    @Inject(LOCALIVE_INSTANCE) private instance: I18nLiveInstance,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const unsubscribe = this.instance.store.subscribe((state) => {
      this.active.set(state.active);
      this.cdr.markForCheck();
    });
    this.cleanupFns.push(unsubscribe);

    const onMouseOver = (e: MouseEvent) => {
      if (!this.active()) return;
      const target = e.target as HTMLElement;
      const key = this.instance.resolveKey(target);
      if (key) {
        this.hoveredElement.set(target);
        this.cdr.markForCheck();
      }
    };

    const onMouseOut = () => {
      this.hoveredElement.set(null);
      this.cdr.markForCheck();
    };

    const onClick = (e: MouseEvent) => {
      if (!this.active()) return;
      const target = e.target as HTMLElement;
      const key = this.instance.resolveKey(target);
      if (key) {
        e.preventDefault();
        e.stopPropagation();
        this.currentKey.set(key);
        this.editValue.set(this.instance.getTranslation(key, this.editingLocale()) ?? '');
        this.cdr.markForCheck();
      }
    };

    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);
    document.addEventListener('click', onClick, true);

    this.cleanupFns.push(
      () => document.removeEventListener('mouseover', onMouseOver),
      () => document.removeEventListener('mouseout', onMouseOut),
      () => document.removeEventListener('click', onClick, true),
    );
  }

  deactivate(): void {
    this.instance.deactivate();
  }

  onEditorInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.editValue.set(target.value);
  }

  closeEditor(): void {
    this.currentKey.set(null);
    this.editValue.set('');
    this.cdr.markForCheck();
  }

  async saveTranslation(): Promise<void> {
    const key = this.currentKey();
    if (!key) return;
    this.saving.set(true);
    this.cdr.markForCheck();

    try {
      const entry: TranslationEntry = {
        key,
        value: this.editValue(),
        locale: this.editingLocale(),
      };
      await this.instance.saveTranslation(entry);
    } finally {
      this.saving.set(false);
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
  }
}
