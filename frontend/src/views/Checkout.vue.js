/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import http, { unwrap } from '../api/http';
import { notify } from '../utils/notify';
import { useRecoStore } from '../stores/reco';
const router = useRouter();
const reco = useRecoStore();
const loading = ref(false);
const submitting = ref(false);
const error = ref(null);
const items = ref([]);
const form = reactive({
    shipping_address: ''
});
const canSubmit = computed(() => items.value.length > 0 && form.shipping_address.trim().length > 0);
async function fetchCart() {
    loading.value = true;
    error.value = null;
    try {
        const resp = await http.get('/api/cart/items');
        const data = unwrap(resp);
        const raw = Array.isArray(data?.items) ? data.items : [];
        items.value = raw.map((x) => ({
            product_id: String(x.product_id),
            quantity: Number(x.quantity ?? 1)
        }));
    }
    catch (e) {
        error.value = e?.response?.data?.message || e?.message || '加载失败';
    }
    finally {
        loading.value = false;
    }
}
async function submitOrder() {
    if (!canSubmit.value)
        return;
    submitting.value = true;
    try {
        const payload = {
            shipping_address: form.shipping_address.trim(),
            items: items.value.map((x) => ({ product_id: x.product_id, quantity: x.quantity }))
        };
        await http.post('/api/order/create', payload);
        await reco.track('purchase', { meta: { items: payload.items } });
        notify('订单创建成功', { tone: 'success' });
        await router.replace('/profile');
    }
    catch (e) {
        notify(e?.response?.data?.message || e?.message || '创建订单失败', { tone: 'error', flash: true });
    }
    finally {
        submitting.value = false;
    }
}
onMounted(fetchCart);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "max-w-3xl mx-auto py-12 px-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center justify-between mb-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-3xl font-extrabold text-[var(--c-text)]" },
});
const __VLS_0 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.loading),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (__VLS_ctx.fetchCart)
};
__VLS_3.slots.default;
var __VLS_3;
if (__VLS_ctx.error) {
    const __VLS_8 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.error),
        ...{ class: "mb-6" },
    }));
    const __VLS_10 = __VLS_9({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.error),
        ...{ class: "mb-6" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-[var(--c-surface)] rounded-2xl p-8 shadow-sm border-2 border-[var(--c-border)] space-y-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-lg font-extrabold text-[var(--c-text)]" },
});
const __VLS_12 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    data: (__VLS_ctx.items),
    stripe: true,
    ...{ class: "border rounded-xl" },
}));
const __VLS_14 = __VLS_13({
    data: (__VLS_ctx.items),
    stripe: true,
    ...{ class: "border rounded-xl" },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.loading) }, null, null);
__VLS_15.slots.default;
const __VLS_16 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    prop: "product_id",
    label: "商品ID",
    minWidth: "220",
}));
const __VLS_18 = __VLS_17({
    prop: "product_id",
    label: "商品ID",
    minWidth: "220",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
const __VLS_20 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    prop: "quantity",
    label: "数量",
    width: "120",
}));
const __VLS_22 = __VLS_21({
    prop: "quantity",
    label: "数量",
    width: "120",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
var __VLS_15;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-lg font-extrabold text-[var(--c-text)]" },
});
const __VLS_24 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    modelValue: (__VLS_ctx.form.shipping_address),
    placeholder: "请输入收货地址",
}));
const __VLS_26 = __VLS_25({
    modelValue: (__VLS_ctx.form.shipping_address),
    placeholder: "请输入收货地址",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex justify-end" },
});
const __VLS_28 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    ...{ 'onClick': {} },
    type: "primary",
    disabled: (!__VLS_ctx.canSubmit),
    loading: (__VLS_ctx.submitting),
}));
const __VLS_30 = __VLS_29({
    ...{ 'onClick': {} },
    type: "primary",
    disabled: (!__VLS_ctx.canSubmit),
    loading: (__VLS_ctx.submitting),
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
let __VLS_32;
let __VLS_33;
let __VLS_34;
const __VLS_35 = {
    onClick: (__VLS_ctx.submitOrder)
};
__VLS_31.slots.default;
var __VLS_31;
/** @type {__VLS_StyleScopedClasses['max-w-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[var(--c-surface)]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-8']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[var(--c-border)]']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            loading: loading,
            submitting: submitting,
            error: error,
            items: items,
            form: form,
            canSubmit: canSubmit,
            fetchCart: fetchCart,
            submitOrder: submitOrder,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=Checkout.vue.js.map