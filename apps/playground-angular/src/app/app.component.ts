import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { switchLocale } from './app.config';
import { LiveEditorOverlayComponent, LOCALIVE_INSTANCE } from '@localive/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LiveEditorOverlayComponent],
  template: `
    <header style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
      <h1>{{ translations()[currentLocale()].appTitle }}</h1>
      <button (click)="toggleEditor()"
        style="margin-left: 8px;"
        [style.backgroundColor]="isActive() ? '#ef4444' : '#22c55e'"
        [style.color]="'white'" [style.border]="'none'" [style.border-radius]="'4px'"
        [style.padding]="'8px 16px'" [style.cursor]="'pointer'">
        {{ isActive() ? '✕ Close Editor' : '✎ Open Editor' }}
      </button>
    </header>

    <p style="color: #64748b; margin-bottom: 16px;">
      <span [attr.data-i18n-key]="'app.subtitle'">{{ translations()[currentLocale()].appSubtitle }}</span>
    </p>

    <nav>
      <button [class.active]="currentLocale() === 'en'" (click)="changeLocale('en')">English</button>
      <button [class.active]="currentLocale() === 'fr'" (click)="changeLocale('fr')">Français</button>
    </nav>

    <div class="card" style="margin-top: 16px;">
      <h2><span [attr.data-i18n-key]="'card.welcome'">{{ translations()[currentLocale()].cardWelcome }}</span></h2>
      <p><span [attr.data-i18n-key]="'card.description'">{{ translations()[currentLocale()].cardDescription }}</span></p>
    </div>

    <footer style="margin-top: 24px; color: #94a3b8; font-size: 14px;">
      <span [attr.data-i18n-key]="'footer.rights'">{{ translations()[currentLocale()].footerRights }}</span>
    </footer>

    <localive-overlay></localive-overlay>
  `,
  styles: [`
    :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background: #fafafa; }
    h1 { margin-bottom: 16px; color: #1e293b; }
    nav { margin-bottom: 16px; }
    button { padding: 8px 16px; margin-right: 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: white; cursor: pointer; }
    button:hover { background: #f1f5f9; }
    button.active { background: #6366f1; color: white; border-color: #6366f1; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
  `],
})
export class AppComponent {
  isActive = signal(false);
  currentLocale = signal<'en' | 'fr'>('en');

  translations = signal({
    en: {
      appTitle: 'LocaLive Angular Playground',
      appSubtitle: 'Click any text to edit translations live',
      cardWelcome: 'Welcome to LocaLive!',
      cardDescription: 'This playground demonstrates live in-context i18n editing with Angular.',
      footerRights: 'All rights reserved.',
    },
    fr: {
      appTitle: 'LocaLive Bac à sable Angular',
      appSubtitle: 'Cliquez sur n\'importe quel texte pour modifier les traductions en direct',
      cardWelcome: 'Bienvenue dans LocaLive !',
      cardDescription: 'Ce bac à sable illustre l\'édition en contexte des traductions avec Angular.',
      footerRights: 'Tous droits réservés.',
    },
  });

  private instance = inject(LOCALIVE_INSTANCE);

  constructor() {
    this.instance.store.subscribe((state) => {
      this.isActive.set(state.active);
    });
  }

  changeLocale(locale: 'en' | 'fr') {
    this.currentLocale.set(locale);
    switchLocale(locale);
  }

  toggleEditor() {
    if (this.instance.isActive()) {
      this.instance.deactivate();
    } else {
      this.instance.activate();
    }
  }
}
