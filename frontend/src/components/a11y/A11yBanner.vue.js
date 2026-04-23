/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useAnnouncerStore } from '../../stores/announcer';
const announcer = useAnnouncerStore();
const visible = ref(false);
const progressKey = ref(0);
let timer = null;
const toneClass = computed(() => {
    if (announcer.tone === 'success')
        return 'a11y-banner--success';
    if (announcer.tone === 'warning')
        return 'a11y-banner--warning';
    if (announcer.tone === 'error')
        return 'a11y-banner--error';
    return 'a11y-banner--info';
});
function clearTimer() {
    if (timer)
        window.clearTimeout(timer);
    timer = null;
}
watch(() => announcer.seq, () => {
    clearTimer();
    if (!announcer.text) {
        visible.value = false;
        return;
    }
    visible.value = true;
    progressKey.value += 1;
    timer = window.setTimeout(() => {
        visible.value = false;
    }, announcer.ttlMs);
});
onBeforeUnmount(clearTimer);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['a11y-banner__close']} */ ;
// CSS variable injection 
// CSS variable injection end 
if (__VLS_ctx.visible) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "a11y-banner" },
        ...{ class: ([__VLS_ctx.toneClass, __VLS_ctx.announcer.flash ? 'a11y-banner--flash' : '']) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "a11y-banner__inner" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "a11y-banner__text" },
    });
    (__VLS_ctx.announcer.text);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.visible))
                    return;
                __VLS_ctx.visible = false;
            } },
        ...{ class: "a11y-banner__close" },
        type: "button",
        'aria-label': "关闭提示",
    });
    __VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "a11y-banner__progress" },
        key: (__VLS_ctx.progressKey),
        ...{ style: ({ animationDuration: __VLS_ctx.announcer.ttlMs + 'ms' }) },
    });
}
/** @type {__VLS_StyleScopedClasses['a11y-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-banner__inner']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-banner__text']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-banner__close']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-banner__progress']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            announcer: announcer,
            visible: visible,
            progressKey: progressKey,
            toneClass: toneClass,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=A11yBanner.vue.js.map