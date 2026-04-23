/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Shield, ShoppingCart, User } from 'lucide-vue-next';
import { useCartStore } from '../stores/cart';
import { useA11yStore } from '../stores/a11y';
import { useSpeechStore } from '../stores/speech';
import A11yToolbar from './a11y/A11yToolbar.vue';
const router = useRouter();
const searchQuery = ref('');
const cart = useCartStore();
const adminAuthed = ref(Boolean(localStorage.getItem('admin_access_token')));
const a11y = useA11yStore();
const speech = useSpeechStore();
const handleSearch = () => {
    const q = searchQuery.value.trim();
    router.push({ path: '/', query: q ? { q } : {} });
};
function syncAdminToken() {
    adminAuthed.value = Boolean(localStorage.getItem('admin_access_token'));
}
onMounted(() => {
    cart.init();
    syncAdminToken();
    window.addEventListener('auth:admin_login', syncAdminToken);
    window.addEventListener('auth:logout', syncAdminToken);
    window.addEventListener('storage', (e) => {
        if (e.key === 'admin_access_token')
            syncAdminToken();
    });
});
onBeforeUnmount(() => {
    window.removeEventListener('auth:admin_login', syncAdminToken);
    window.removeEventListener('auth:logout', syncAdminToken);
});
watch(() => [speech.listening, speech.partial, speech.transcript], ([listening, partial, transcript], [prevListening]) => {
    if (listening) {
        const q = String(partial || transcript || '').trim();
        if (q)
            searchQuery.value = q;
        return;
    }
    if (!listening && prevListening) {
        const q = String(transcript || '').trim();
        if (q)
            handleSearch();
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "sticky top-0 z-50 bg-[var(--c-surface)] border-b border-[var(--c-border)]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "container mx-auto px-4 min-h-16 flex items-center justify-between" },
    ...{ class: (__VLS_ctx.a11y.largeTextEnabled ? 'py-3 flex-wrap gap-3' : 'h-16') },
});
const __VLS_0 = {}.RouterLink;
/** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    to: "/",
    ...{ class: "flex items-center space-x-2 a11y-hit" },
}));
const __VLS_2 = __VLS_1({
    to: "/",
    ...{ class: "flex items-center space-x-2 a11y-hit" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-2xl font-extrabold text-[var(--c-primary)] tracking-tight" },
});
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex-grow" },
    ...{ class: (__VLS_ctx.a11y.largeTextEnabled ? 'flex w-full order-3' : 'hidden md:flex max-w-md mx-8') },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "relative w-full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onKeyup: (__VLS_ctx.handleSearch) },
    value: (__VLS_ctx.searchQuery),
    type: "text",
    placeholder: "搜索助听器型号、品牌...",
    ...{ class: "w-full pl-10 pr-4 py-2 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] focus:border-[var(--focus-ring)]" },
});
const __VLS_4 = {}.Search;
/** @type {[typeof __VLS_components.Search, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ class: "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--c-muted)]" },
}));
const __VLS_6 = __VLS_5({
    ...{ class: "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--c-muted)]" },
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: (__VLS_ctx.a11y.largeTextEnabled ? 'flex flex-wrap items-center justify-end gap-2' : 'flex items-center space-x-6') },
});
/** @type {[typeof A11yToolbar, ]} */ ;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent(A11yToolbar, new A11yToolbar({}));
const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
const __VLS_11 = {}.RouterLink;
/** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
// @ts-ignore
const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
    to: "/recommendations",
    ...{ class: "a11y-hit px-3 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] font-extrabold" },
    'aria-label': "个性化推荐",
}));
const __VLS_13 = __VLS_12({
    to: "/recommendations",
    ...{ class: "a11y-hit px-3 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] font-extrabold" },
    'aria-label': "个性化推荐",
}, ...__VLS_functionalComponentArgsRest(__VLS_12));
__VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
__VLS_14.slots.default;
var __VLS_14;
const __VLS_15 = {}.RouterLink;
/** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
    to: "/cart",
    ...{ class: "relative a11y-hit text-[var(--c-text)]" },
    'aria-label': "购物车",
}));
const __VLS_17 = __VLS_16({
    to: "/cart",
    ...{ class: "relative a11y-hit text-[var(--c-text)]" },
    'aria-label': "购物车",
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
__VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
__VLS_18.slots.default;
const __VLS_19 = {}.ShoppingCart;
/** @type {[typeof __VLS_components.ShoppingCart, ]} */ ;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    ...{ class: "h-6 w-6" },
}));
const __VLS_21 = __VLS_20({
    ...{ class: "h-6 w-6" },
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
if (__VLS_ctx.cart.totalQty > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "absolute -top-2 -right-2 bg-[var(--c-danger)] text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center" },
        'aria-live': "polite",
    });
    (__VLS_ctx.cart.totalQty);
}
var __VLS_18;
if (__VLS_ctx.adminAuthed) {
    const __VLS_23 = {}.RouterLink;
    /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
        to: "/admin",
        ...{ class: "a11y-hit text-[var(--c-muted)]" },
        title: "后台",
        'aria-label': "后台",
    }));
    const __VLS_25 = __VLS_24({
        to: "/admin",
        ...{ class: "a11y-hit text-[var(--c-muted)]" },
        title: "后台",
        'aria-label': "后台",
    }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    __VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
    __VLS_26.slots.default;
    const __VLS_27 = {}.Shield;
    /** @type {[typeof __VLS_components.Shield, ]} */ ;
    // @ts-ignore
    const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
        ...{ class: "h-6 w-6" },
    }));
    const __VLS_29 = __VLS_28({
        ...{ class: "h-6 w-6" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_28));
    var __VLS_26;
}
const __VLS_31 = {}.RouterLink;
/** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
// @ts-ignore
const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
    to: "/profile",
    ...{ class: "a11y-hit text-[var(--c-text)]" },
    'aria-label': "个人中心",
}));
const __VLS_33 = __VLS_32({
    to: "/profile",
    ...{ class: "a11y-hit text-[var(--c-text)]" },
    'aria-label': "个人中心",
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
__VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
__VLS_34.slots.default;
const __VLS_35 = {}.User;
/** @type {[typeof __VLS_components.User, ]} */ ;
// @ts-ignore
const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
    ...{ class: "h-6 w-6" },
}));
const __VLS_37 = __VLS_36({
    ...{ class: "h-6 w-6" },
}, ...__VLS_functionalComponentArgsRest(__VLS_36));
var __VLS_34;
/** @type {__VLS_StyleScopedClasses['sticky']} */ ;
/** @type {__VLS_StyleScopedClasses['top-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[var(--c-surface)]']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[var(--c-border)]']} */ ;
/** @type {__VLS_StyleScopedClasses['container']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['min-h-16']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-primary)]']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-grow']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['pl-10']} */ ;
/** @type {__VLS_StyleScopedClasses['pr-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[var(--c-border)]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[var(--c-bg)]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-[var(--focus-ring)]']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['left-3']} */ ;
/** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-muted)]']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[var(--c-border)]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[var(--c-surface)]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['-top-2']} */ ;
/** @type {__VLS_StyleScopedClasses['-right-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[var(--c-danger)]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-muted)]']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Search: Search,
            Shield: Shield,
            ShoppingCart: ShoppingCart,
            User: User,
            A11yToolbar: A11yToolbar,
            searchQuery: searchQuery,
            cart: cart,
            adminAuthed: adminAuthed,
            a11y: a11y,
            handleSearch: handleSearch,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=Header.vue.js.map