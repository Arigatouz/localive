<template>
  <div>
    <header :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }">
      <h1>{{ t('app.title') }}</h1>
      <button @click="toggleEditor" :style="{ marginLeft: '8px', backgroundColor: isActive ? '#ef4444' : '#22c55e', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer' }">
        {{ isActive ? '✕ Close Editor' : '✎ Open Editor' }}
      </button>
    </header>

    <p :style="{ color: '#64748b', marginBottom: '16px' }">
      <span v-localive-tag="'app.subtitle'">{{ t('app.subtitle') }}</span>
    </p>

    <nav>
      <button :class="{ active: currentLocale === 'en' }" @click="switchLocale('en')">English</button>
      <button :class="{ active: currentLocale === 'fr' }" @click="switchLocale('fr')">Français</button>
    </nav>

    <div class="card" :style="{ marginTop: '16px' }">
      <h2><span v-localive-tag="'card.welcome'">{{ t('card.welcome') }}</span></h2>
      <p><span v-localive-tag="'card.description'">{{ t('card.description') }}</span></p>
    </div>

    <footer :style="{ marginTop: '24px', color: '#94a3b8', fontSize: '14px' }">
      <span v-localive-tag="'footer.rights'">{{ t('footer.rights') }}</span>
    </footer>

    <LiveEditorOverlay />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLocaliveEditor, localiveSymbol, vLocaliveTag, LiveEditorOverlay } from '@localive/vue';
import { inject } from 'vue';

const { t, locale } = useI18n();
const instance = inject(localiveSymbol)!;
const { isActive, activate, deactivate } = useLocaliveEditor(instance);
const currentLocale = ref(locale.value);

function switchLocale(lng: string) {
  locale.value = lng;
  currentLocale.value = lng;
}

function toggleEditor() {
  if (isActive.value) {
    deactivate();
  } else {
    activate();
  }
}
</script>