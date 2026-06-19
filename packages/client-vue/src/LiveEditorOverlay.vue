<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { inject } from 'vue';
import { localiveSymbol } from './symbols';
import type { I18nLiveInstance, Locale, TranslationEntry } from '@localive/core';

const instance = inject(localiveSymbol) as I18nLiveInstance;

const active = ref(instance.isActive());
const currentKey = ref<string | null>(null);
const editValue = ref('');
const editingLocale = ref<Locale>('en');
const hoveredElement = ref<HTMLElement | null>(null);
const saving = ref(false);

const overlayRef = ref<HTMLDivElement | null>(null);

let unsubscribeStore: (() => void) | null = null;

onMounted(() => {
  unsubscribeStore = instance.store.subscribe((state) => {
    active.value = state.active;
  });
});

onUnmounted(() => {
  unsubscribeStore?.();
  cleanupListeners();
});

function handleMouseOver(e: MouseEvent) {
  if (!active.value) return;
  const target = e.target as HTMLElement;
  if (overlayRef.value?.contains(target)) return;
  const key = instance.resolveKey(target);
  if (key) {
    hoveredElement.value = target;
  }
}

function handleMouseOut() {
  hoveredElement.value = null;
}

function handleClick(e: MouseEvent) {
  if (!active.value) return;
  const target = e.target as HTMLElement;
  if (overlayRef.value?.contains(target)) return;
  const key = instance.resolveKey(target);
  if (key) {
    e.preventDefault();
    e.stopPropagation();
    currentKey.value = key;
    editValue.value = instance.getTranslation(key, editingLocale.value) ?? '';
  }
}

function handleSave() {
  if (!currentKey.value) return;
  saving.value = true;
  const entry: TranslationEntry = {
    key: currentKey.value,
    value: editValue.value,
    locale: editingLocale.value,
  };
  instance.saveTranslation(entry).finally(() => {
    saving.value = false;
  });
}

function handleClose() {
  currentKey.value = null;
  editValue.value = '';
}

let cleanupListeners: () => void = () => {};

onMounted(() => {
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleClick, true);
  cleanupListeners = () => {
    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('mouseout', handleMouseOut);
    document.removeEventListener('click', handleClick, true);
  };
});

onUnmounted(() => {
  cleanupListeners();
});
</script>

<template>
  <Teleport to="body">
    <template v-if="active">
      <!-- Hover highlight -->
      <div
        v-if="hoveredElement"
        :style="{
          position: 'fixed',
          top: hoveredElement.getBoundingClientRect().top - 2 + 'px',
          left: hoveredElement.getBoundingClientRect().left - 2 + 'px',
          width: hoveredElement.getBoundingClientRect().width + 4 + 'px',
          height: hoveredElement.getBoundingClientRect().height + 4 + 'px',
          border: '2px solid #6366f1',
          borderRadius: '4px',
          pointerEvents: 'none',
          zIndex: 999998,
        }"
      />

      <!-- Toggle button -->
      <button
        @click="instance.deactivate()"
        :style="{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 999999,
          backgroundColor: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          fontSize: '20px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }"
        title="Close Localive editor"
      >
        ✕
      </button>

      <!-- Editor panel -->
      <div
        v-if="currentKey"
        ref="overlayRef"
        :style="{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 999999,
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          width: '400px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        }"
      >
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <strong style="font-size: 14px">{{ currentKey }}</strong>
          <button @click="handleClose" style="border: none; background: none; cursor: pointer; font-size: 18px">✕</button>
        </div>
        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px;">
            {{ editingLocale }}
          </label>
          <textarea
            v-model="editValue"
            :style="{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical',
              minHeight: '60px',
            }"
          />
        </div>
        <button
          @click="handleSave"
          :disabled="saving"
          :style="{
            width: '100%',
            padding: '8px',
            backgroundColor: saving ? '#9ca3af' : '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }"
        >
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </template>
  </Teleport>
</template>
