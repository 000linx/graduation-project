import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useA11yStore } from '@/stores/a11y';
describe('a11y store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
        document.documentElement.className = '';
        document.documentElement.removeAttribute('data-a11y-large');
        document.documentElement.style.removeProperty('--a11y-font-scale');
    });
    it('init loads prefs from storage and applies to document', () => {
        localStorage.setItem('a11y_prefs_v1', JSON.stringify({
            high_contrast: true,
            font_scale: 1.5,
            voice_enabled: true,
            tts_enabled: false,
            captions_overlay: true,
            interaction_feedback: 'sound'
        }));
        const store = useA11yStore();
        store.init();
        expect(store.highContrast).toBe(true);
        expect(store.fontScale).toBe(1.5);
        expect(document.documentElement.classList.contains('hc')).toBe(true);
        expect(document.documentElement.style.getPropertyValue('--a11y-font-scale')).toBe('1.5');
        expect(document.documentElement.getAttribute('data-a11y-large')).toBe('1');
        expect(document.documentElement.dataset.a11yVoice).toBe('1');
        expect(document.documentElement.dataset.a11yFeedback).toBe('sound');
    });
    it('toggleLargeText switches between default and large baseline', () => {
        const store = useA11yStore();
        store.init();
        expect(store.fontScale).toBe(1);
        store.toggleLargeText();
        expect(store.fontScale).toBeCloseTo(1.125, 6);
        expect(document.documentElement.getAttribute('data-a11y-large')).toBe('1');
        store.toggleLargeText();
        expect(store.fontScale).toBe(1);
        expect(document.documentElement.getAttribute('data-a11y-large')).toBe('0');
    });
});
//# sourceMappingURL=a11yStore.spec.js.map