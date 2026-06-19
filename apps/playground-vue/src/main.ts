import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import { createLocalivePlugin } from '@localive/vue';
import { withVueI18n } from '@localive/adapter-vue-i18n';
import App from './App.vue';
import en from './locales/en.json';
import fr from './locales/fr.json';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: en.en,
    fr: fr.fr,
  },
});

const localive = createLocalivePlugin({
  adapter: withVueI18n(i18n.global),
  locales: ['en', 'fr'],
  defaultLocale: 'en',
});

const app = createApp(App);
app.use(i18n);
app.use(localive);
app.mount('#app');