/// <reference types="../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import Header from './components/Header.vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
// @ts-ignore  // 临时忽略类型声明缺失，建议后续添加 element-plus.d.ts 声明文件
import { ElConfigProvider } from 'element-plus';
import { useA11yStore } from './stores/a11y';
import { useRecoStore } from './stores/reco';
import SpeechCaptionOverlay from './components/a11y/SpeechCaptionOverlay.vue';
import A11yBanner from './components/a11y/A11yBanner.vue';
import A11yLiveRegion from './components/a11y/A11yLiveRegion.vue';
const route = useRoute();
const isAdminRoute = computed(() => (route.path === '/admin' || route.path.startsWith('/admin/')) && route.path !== '/admin/login');
const a11y = useA11yStore();
a11y.init();
const reco = useRecoStore();
reco.init();
const elSize = computed(() => (a11y.fontScale >= 1.125 ? 'large' : 'default'));
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.ElConfigProvider;
/** @type {[typeof __VLS_components.ElConfigProvider, typeof __VLS_components.elConfigProvider, typeof __VLS_components.ElConfigProvider, typeof __VLS_components.elConfigProvider, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    size: (__VLS_ctx.elSize),
}));
const __VLS_2 = __VLS_1({
    size: (__VLS_ctx.elSize),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
if (__VLS_ctx.isAdminRoute) {
    const __VLS_5 = {}.RouterView;
    /** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({}));
    const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "min-h-screen flex flex-col bg-[var(--c-bg)] text-[var(--c-text)]" },
    });
    /** @type {[typeof Header, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(Header, new Header({}));
    const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
        ...{ class: "flex-grow container mx-auto px-4 py-8" },
    });
    const __VLS_12 = {}.RouterView;
    /** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({}));
    const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.footer, __VLS_intrinsicElements.footer)({
        ...{ class: "border-t py-8 text-center text-[var(--c-muted)] bg-[var(--c-surface)] border-[var(--c-border)]" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
}
/** @type {[typeof A11yBanner, ]} */ ;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent(A11yBanner, new A11yBanner({}));
const __VLS_17 = __VLS_16({}, ...__VLS_functionalComponentArgsRest(__VLS_16));
/** @type {[typeof SpeechCaptionOverlay, ]} */ ;
// @ts-ignore
const __VLS_19 = __VLS_asFunctionalComponent(SpeechCaptionOverlay, new SpeechCaptionOverlay({}));
const __VLS_20 = __VLS_19({}, ...__VLS_functionalComponentArgsRest(__VLS_19));
/** @type {[typeof A11yLiveRegion, ]} */ ;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(A11yLiveRegion, new A11yLiveRegion({}));
const __VLS_23 = __VLS_22({}, ...__VLS_functionalComponentArgsRest(__VLS_22));
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[var(--c-bg)]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-grow']} */ ;
/** @type {__VLS_StyleScopedClasses['container']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-muted)]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[var(--c-surface)]']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[var(--c-border)]']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Header: Header,
            ElConfigProvider: ElConfigProvider,
            SpeechCaptionOverlay: SpeechCaptionOverlay,
            A11yBanner: A11yBanner,
            A11yLiveRegion: A11yLiveRegion,
            isAdminRoute: isAdminRoute,
            elSize: elSize,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=App.vue.js.map