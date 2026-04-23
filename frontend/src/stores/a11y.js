import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
const STORAGE_KEY = 'a11y_prefs_v1';
const DEFAULT_SCALE = 1;
const LARGE_SCALE = 1.125;
const MAX_SCALE = 2;
function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}
function safeParse(raw) {
    if (!raw)
        return null;
    try {
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object')
            return null;
        return data;
    }
    catch {
        return null;
    }
}
export const useA11yStore = defineStore('a11y', () => {
    const highContrast = ref(false);
    const fontScale = ref(DEFAULT_SCALE);
    const voiceEnabled = ref(false);
    const ttsEnabled = ref(false);
    const captionsOverlay = ref(true);
    const interactionFeedback = ref('focus');
    const largeTextEnabled = computed(() => fontScale.value >= LARGE_SCALE - 0.0001);
    function _applyDom() {
        const el = document.documentElement;
        el.classList.toggle('hc', highContrast.value);
        el.style.setProperty('--a11y-font-scale', String(fontScale.value));
        el.dataset.a11yLarge = largeTextEnabled.value ? '1' : '0';
        el.dataset.a11yVoice = voiceEnabled.value ? '1' : '0';
        el.dataset.a11yTts = ttsEnabled.value ? '1' : '0';
        el.dataset.a11yCaptions = captionsOverlay.value ? '1' : '0';
        el.dataset.a11yFeedback = interactionFeedback.value;
    }
    function _save() {
        const payload = {
            high_contrast: highContrast.value,
            font_scale: fontScale.value,
            voice_enabled: voiceEnabled.value,
            tts_enabled: ttsEnabled.value,
            captions_overlay: captionsOverlay.value,
            interaction_feedback: interactionFeedback.value
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
    function init() {
        const raw = localStorage.getItem(STORAGE_KEY);
        const data = safeParse(raw);
        if (data) {
            if (typeof data.high_contrast === 'boolean')
                highContrast.value = data.high_contrast;
            if (typeof data.font_scale === 'number')
                fontScale.value = clamp(data.font_scale, DEFAULT_SCALE, MAX_SCALE);
            if (typeof data.voice_enabled === 'boolean')
                voiceEnabled.value = data.voice_enabled;
            if (typeof data.tts_enabled === 'boolean')
                ttsEnabled.value = data.tts_enabled;
            if (typeof data.captions_overlay === 'boolean')
                captionsOverlay.value = data.captions_overlay;
            if (data.interaction_feedback === 'focus' || data.interaction_feedback === 'haptic' || data.interaction_feedback === 'sound') {
                interactionFeedback.value = data.interaction_feedback;
            }
        }
        _applyDom();
    }
    function setHighContrast(v) {
        highContrast.value = v;
        _applyDom();
        _save();
    }
    function toggleHighContrast() {
        setHighContrast(!highContrast.value);
    }
    function setFontScale(scale) {
        fontScale.value = clamp(scale, DEFAULT_SCALE, MAX_SCALE);
        _applyDom();
        _save();
    }
    function toggleLargeText() {
        setFontScale(largeTextEnabled.value ? DEFAULT_SCALE : LARGE_SCALE);
    }
    function setVoiceEnabled(v) {
        voiceEnabled.value = v;
        _applyDom();
        _save();
    }
    function setTtsEnabled(v) {
        ttsEnabled.value = v;
        _applyDom();
        _save();
    }
    function setCaptionsOverlay(v) {
        captionsOverlay.value = v;
        _applyDom();
        _save();
    }
    function setInteractionFeedback(v) {
        interactionFeedback.value = v;
        _applyDom();
        _save();
    }
    return {
        highContrast,
        fontScale,
        largeTextEnabled,
        voiceEnabled,
        ttsEnabled,
        captionsOverlay,
        interactionFeedback,
        init,
        setHighContrast,
        toggleHighContrast,
        setFontScale,
        toggleLargeText,
        setVoiceEnabled,
        setTtsEnabled,
        setCaptionsOverlay,
        setInteractionFeedback
    };
});
//# sourceMappingURL=a11y.js.map