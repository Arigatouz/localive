import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocaliveContext } from './LocaliveProvider';
import type { Locale, TranslationEntry } from '@localive/core';

export function LiveEditorOverlay() {
  const instance = useLocaliveContext();
  const [active, setActive] = useState(instance.isActive());
  const [, setSelectedElement] = useState<HTMLElement | null>(null);
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [editingLocale] = useState<Locale>('en');
  const [editValue, setEditValue] = useState('');
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Subscribe to active state
  useEffect(() => {
    const unsubscribe = instance.store.subscribe((state) => {
      setActive(state.active);
    });
    return unsubscribe;
  }, [instance]);

  // Handle hover highlighting
  useEffect(() => {
    if (!active) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target === overlayRef.current || overlayRef.current?.contains(target)) return;
      const key = instance.resolveKey(target);
      if (key) {
        setHoveredElement(target);
      }
    };

    const handleMouseOut = () => {
      setHoveredElement(null);
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [active, instance]);

  // Handle click to open editor
  const handleElementClick = useCallback(
    (e: MouseEvent) => {
      if (!active) return;
      const target = e.target as HTMLElement;
      if (target === overlayRef.current || overlayRef.current?.contains(target)) return;

      const key = instance.resolveKey(target);
      if (key) {
        e.preventDefault();
        e.stopPropagation();
        setCurrentKey(key);
        setSelectedElement(target);
        const value = instance.getTranslation(key, editingLocale) ?? '';
        setEditValue(value);
      }
    },
    [active, instance, editingLocale],
  );

  useEffect(() => {
    if (!active) return;
    document.addEventListener('click', handleElementClick, true);
    return () => {
      document.removeEventListener('click', handleElementClick, true);
    };
  }, [active, handleElementClick]);

  const handleSave = useCallback(async () => {
    if (!currentKey) return;
    setSaving(true);
    try {
      const entry: TranslationEntry = {
        key: currentKey,
        value: editValue,
        locale: editingLocale,
      };
      await instance.saveTranslation(entry);
    } catch {
      // Error handled silently in dev
    } finally {
      setSaving(false);
    }
  }, [currentKey, editValue, editingLocale, instance]);

  const handleClose = useCallback(() => {
    setCurrentKey(null);
    setSelectedElement(null);
    setEditValue('');
  }, []);

  if (!active) return null;

  return createPortal(
    <>
      {/* Hover highlight */}
      {hoveredElement && (
        <div
          style={{
            position: 'fixed',
            top: hoveredElement.getBoundingClientRect().top - 2,
            left: hoveredElement.getBoundingClientRect().left - 2,
            width: hoveredElement.getBoundingClientRect().width + 4,
            height: hoveredElement.getBoundingClientRect().height + 4,
            border: '2px solid #6366f1',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 999998,
          }}
        />
      )}

      {/* Toggle button */}
      <button
        onClick={() => instance.deactivate()}
        style={{
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
        }}
        title="Close Localive editor"
      >
        ✕
      </button>

      {/* Editor panel */}
      {currentKey && (
        <div
          ref={overlayRef}
          style={{
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
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <strong style={{ fontSize: '14px' }}>{currentKey}</strong>
            <button onClick={handleClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>✕</button>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              {editingLocale}
            </label>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical',
                minHeight: '60px',
              }}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: saving ? '#9ca3af' : '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </>,
    document.body,
  );
}