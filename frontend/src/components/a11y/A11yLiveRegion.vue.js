/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed } from 'vue';
import { useAnnouncerStore } from '../../stores/announcer';
const announcer = useAnnouncerStore();
const isAssertive = computed(() => announcer.politeness === 'assertive');
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sr-only" },
    'aria-hidden': "false",
});
if (!__VLS_ctx.isAssertive) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (__VLS_ctx.announcer.seq),
        role: "status",
        'aria-live': "polite",
        'aria-atomic': "true",
    });
    (__VLS_ctx.announcer.text);
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (__VLS_ctx.announcer.seq),
        role: "alert",
        'aria-live': "assertive",
        'aria-atomic': "true",
    });
    (__VLS_ctx.announcer.text);
}
/** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            announcer: announcer,
            isAssertive: isAssertive,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=A11yLiveRegion.vue.js.map