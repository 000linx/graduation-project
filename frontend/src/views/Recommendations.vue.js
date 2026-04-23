/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart';
import { useRecoStore } from '../stores/reco';
import { useA11yStore } from '../stores/a11y';
import HearingProfileForm from '../components/reco/HearingProfileForm.vue';
import { notify } from '../utils/notify';
const router = useRouter();
const cart = useCartStore();
const reco = useRecoStore();
const a11y = useA11yStore();
const debTimer = ref(null);
const autoEnabled = ref(false);
const lastSig = ref('');
const liveText = ref('');
const topItems = computed(() => reco.items.slice(0, 12));
const updatedAt = ref(null);
function scheduleFetch() {
    if (!autoEnabled.value)
        return;
    if (!reco.profile.hearing_level)
        return;
    if (debTimer.value)
        window.clearTimeout(debTimer.value);
    debTimer.value = window.setTimeout(async () => {
        await refresh();
    }, 200);
}
function signature(items) {
    return (items || []).map((x) => `${x?.rank}:${x?.product?._id}`).join('|');
}
async function refresh() {
    await reco.fetchRecommendations();
    updatedAt.value = Date.now();
    const sig = signature(reco.items);
    if (sig && sig !== lastSig.value) {
        lastSig.value = sig;
        liveText.value = `推荐结果已更新，共 ${reco.items.length} 条`;
        await reco.track('impression', { meta: { items: reco.items.map((x) => ({ product_id: x.product?._id, rank: x.rank })) } });
    }
}
async function openProduct(item) {
    await reco.track('click', { product_id: item.product?._id, rank: item.rank });
    router.push(`/product/${item.product?._id}`);
}
function imageOf(p) {
    return String(p?.image_url || p?.image || '');
}
async function addFromReco(item) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        notify('请先登录后再加入购物车', { tone: 'warning', flash: true });
        router.push({ path: '/login', query: { redirect: '/recommendations' } });
        return;
    }
    try {
        await cart.addToCart(String(item.product?._id), 1);
        await reco.track('add_to_cart', { product_id: item.product?._id, rank: item.rank });
        notify('已加入购物车', { tone: 'success' });
    }
    catch (e) {
        notify(e?.response?.data?.message || e?.message || '加入失败', { tone: 'error', flash: true });
    }
}
onMounted(async () => {
    reco.init();
    cart.init();
    if (reco.profile.hearing_level) {
        autoEnabled.value = true;
        await refresh();
    }
});
watch(() => [reco.profile.hearing_level, reco.profile.scenes.join(','), reco.profile.budget_min, reco.profile.budget_max, reco.profile.brands.join(',')], () => scheduleFetch());
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "max-w-6xl mx-auto px-4 py-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-start md:items-center justify-between mb-6 gap-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-3xl font-extrabold text-[var(--c-text)]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-base font-bold text-[var(--c-muted)] mt-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-2" },
});
const __VLS_0 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    ...{ class: "a11y-hit" },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    ...{ class: "a11y-hit" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (...[$event]) => {
        __VLS_ctx.router.push('/');
    }
};
__VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
__VLS_3.slots.default;
var __VLS_3;
const __VLS_8 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    ...{ class: "a11y-hit" },
    disabled: (!__VLS_ctx.reco.profile.hearing_level),
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    ...{ class: "a11y-hit" },
    disabled: (!__VLS_ctx.reco.profile.hearing_level),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onClick: (...[$event]) => {
        __VLS_ctx.autoEnabled = true;
        __VLS_ctx.refresh();
    }
};
__VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
__VLS_11.slots.default;
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 gap-6" },
    ...{ class: (__VLS_ctx.a11y.largeTextEnabled ? 'lg:grid-cols-1' : 'lg:grid-cols-3') },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-6 lg:sticky lg:top-24 h-fit" },
});
/** @type {[typeof HearingProfileForm, ]} */ ;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent(HearingProfileForm, new HearingProfileForm({
    ...{ 'onRecommended': {} },
}));
const __VLS_17 = __VLS_16({
    ...{ 'onRecommended': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
let __VLS_19;
let __VLS_20;
let __VLS_21;
const __VLS_22 = {
    onRecommended: (...[$event]) => {
        __VLS_ctx.autoEnabled = true;
        __VLS_ctx.refresh();
    }
};
var __VLS_18;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "lg:col-span-2" },
});
if (!__VLS_ctx.reco.profile.hearing_level) {
    const __VLS_23 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
        type: "info",
        showIcon: true,
        title: "请先选择听力损失等级",
        ...{ class: "mb-4" },
    }));
    const __VLS_25 = __VLS_24({
        type: "info",
        showIcon: true,
        title: "请先选择听力损失等级",
        ...{ class: "mb-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_24));
}
else if (__VLS_ctx.reco.error) {
    const __VLS_27 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.reco.error),
        ...{ class: "mb-4" },
    }));
    const __VLS_29 = __VLS_28({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.reco.error),
        ...{ class: "mb-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_28));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-col md:flex-row md:items-center md:justify-between gap-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "text-xl font-extrabold text-[var(--c-text)]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-sm font-bold text-[var(--c-muted)]" },
});
(__VLS_ctx.reco.variant);
if (__VLS_ctx.updatedAt) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-sm font-bold text-[var(--c-muted)]" },
});
(__VLS_ctx.topItems.length);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sr-only" },
    role: "status",
    'aria-live': "polite",
    'aria-atomic': "true",
});
(__VLS_ctx.liveText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mt-4" },
});
if (__VLS_ctx.reco.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-3" },
    });
    const __VLS_31 = {}.ElSkeleton;
    /** @type {[typeof __VLS_components.ElSkeleton, typeof __VLS_components.elSkeleton, ]} */ ;
    // @ts-ignore
    const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
        rows: (6),
        animated: true,
    }));
    const __VLS_33 = __VLS_32({
        rows: (6),
        animated: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
}
else if (__VLS_ctx.topItems.length === 0) {
    const __VLS_35 = {}.ElEmpty;
    /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
        description: "暂无推荐结果",
    }));
    const __VLS_37 = __VLS_36({
        description: "暂无推荐结果",
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-4" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.topItems))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (item.product?._id),
            ...{ class: "rounded-2xl border-2 border-[var(--c-border)] p-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex flex-col md:flex-row gap-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.reco.loading))
                        return;
                    if (!!(__VLS_ctx.topItems.length === 0))
                        return;
                    __VLS_ctx.openProduct(item);
                } },
            type: "button",
            ...{ class: "w-full md:w-32 md:h-32 rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-bg)] overflow-hidden" },
            'aria-label': (`查看详情：${item.product?.name || ''}`),
        });
        __VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
        if (__VLS_ctx.imageOf(item.product)) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                src: (__VLS_ctx.imageOf(item.product)),
                alt: (item.product?.name),
                loading: "lazy",
                decoding: "async",
                ...{ class: "w-full h-full object-cover" },
            });
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "w-full h-full flex items-center justify-center text-sm font-extrabold text-[var(--c-muted)]" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex-1 space-y-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-start justify-between gap-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-base font-extrabold text-[var(--c-text)]" },
        });
        (item.rank);
        (item.product?.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-sm font-bold text-[var(--c-muted)]" },
        });
        (item.product?.category || '-');
        (Number(item.product?.price ?? 0).toFixed(0));
        if (item.product?.stock != null) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (Number(item.product?.stock ?? 0));
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center gap-2" },
        });
        const __VLS_39 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
            ...{ 'onClick': {} },
            ...{ class: "a11y-hit" },
        }));
        const __VLS_41 = __VLS_40({
            ...{ 'onClick': {} },
            ...{ class: "a11y-hit" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_40));
        let __VLS_43;
        let __VLS_44;
        let __VLS_45;
        const __VLS_46 = {
            onClick: (...[$event]) => {
                if (!!(__VLS_ctx.reco.loading))
                    return;
                if (!!(__VLS_ctx.topItems.length === 0))
                    return;
                __VLS_ctx.openProduct(item);
            }
        };
        __VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
        __VLS_42.slots.default;
        var __VLS_42;
        const __VLS_47 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_48 = __VLS_asFunctionalComponent(__VLS_47, new __VLS_47({
            ...{ 'onClick': {} },
            type: "primary",
            ...{ class: "a11y-hit" },
        }));
        const __VLS_49 = __VLS_48({
            ...{ 'onClick': {} },
            type: "primary",
            ...{ class: "a11y-hit" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_48));
        let __VLS_51;
        let __VLS_52;
        let __VLS_53;
        const __VLS_54 = {
            onClick: (...[$event]) => {
                if (!!(__VLS_ctx.reco.loading))
                    return;
                if (!!(__VLS_ctx.topItems.length === 0))
                    return;
                __VLS_ctx.addFromReco(item);
            }
        };
        __VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
        __VLS_50.slots.default;
        var __VLS_50;
        if (Array.isArray(item.reasons) && item.reasons.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "pt-1" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "text-sm font-extrabold text-[var(--c-text)]" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "mt-2 flex flex-wrap gap-2" },
            });
            for (const [r] of __VLS_getVForSourceType((item.reasons))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    key: (r.factor),
                    ...{ class: "px-3 py-2 rounded-full border-2 border-[var(--c-border)] bg-[var(--c-surface)] text-sm font-extrabold text-[var(--c-text)]" },
                });
                (r.detail);
            }
        }
    }
}
/** @type {__VLS_StyleScopedClasses['max-w-6xl']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['md:items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-muted)]']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[var(--c-surface)]']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[var(--c-border)]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:sticky']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:top-24']} */ ;
/** @type {__VLS_StyleScopedClasses['h-fit']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:col-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[var(--c-surface)]']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[var(--c-border)]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['md:flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['md:items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['md:justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-muted)]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-muted)]']} */ ;
/** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[var(--c-border)]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['md:flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['md:w-32']} */ ;
/** @type {__VLS_StyleScopedClasses['md:h-32']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[var(--c-border)]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[var(--c-bg)]']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-muted)]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-muted)]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[var(--c-border)]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[var(--c-surface)]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            HearingProfileForm: HearingProfileForm,
            router: router,
            reco: reco,
            a11y: a11y,
            autoEnabled: autoEnabled,
            liveText: liveText,
            topItems: topItems,
            updatedAt: updatedAt,
            refresh: refresh,
            openProduct: openProduct,
            imageOf: imageOf,
            addFromReco: addFromReco,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=Recommendations.vue.js.map