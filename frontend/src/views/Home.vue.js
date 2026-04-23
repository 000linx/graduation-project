/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import ProductCard from '../components/ProductCard.vue';
import Pagination from '../components/Pagination.vue';
import { ChevronRight } from 'lucide-vue-next';
import axios from 'axios';
const route = useRoute();
const categories = ['全部', '耳背式', '耳内式', '隐形式', '充电款'];
const activeCategory = ref('全部');
const currentPage = ref(1);
const totalPages = ref(1);
const keyword = computed(() => {
    const q = route.query.q;
    return typeof q === 'string' ? q.trim() : '';
});
const products = ref([
    {
        id: '1',
        name: '专业级智能降噪助听器 - 高性能款',
        price: 2999,
        image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern+professional+hearing+aid+product+photography+white+background&image_size=square',
        category: '耳背式',
        rating: 4.8
    },
    {
        id: '2',
        name: '隐形深耳道助听器 - 极致轻便',
        price: 4500,
        image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=invisible+in-the-canal+hearing+aid+miniature+technology&image_size=square',
        category: '隐形式',
        rating: 4.9
    },
    {
        id: '3',
        name: '充电式智能助听器 - 24小时续航',
        price: 3200,
        image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=rechargeable+hearing+aid+with+charging+case+sleek+design&image_size=square',
        category: '充电款',
        rating: 4.7
    },
    {
        id: '4',
        name: '老人专用高清助听器 - 操作简便',
        price: 1800,
        image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=behind-the-ear+hearing+aid+for+elderly+clear+sound&image_size=square',
        category: '耳背式',
        rating: 4.6
    }
]);
const loading = ref(false);
const errorMessage = ref(null);
const skeletonCount = 12;
let es = null;
let sseTimer = null;
function scheduleFetch() {
    if (sseTimer)
        window.clearTimeout(sseTimer);
    sseTimer = window.setTimeout(() => {
        fetchProducts();
    }, 200);
}
const fetchProducts = async () => {
    loading.value = true;
    errorMessage.value = null;
    const params = {
        page: currentPage.value,
        page_size: 12
    };
    if (activeCategory.value && activeCategory.value !== '全部') {
        params.category = activeCategory.value;
    }
    if (keyword.value) {
        params.q = keyword.value;
    }
    try {
        const { data } = await axios.get('/api/product/list', { params });
        const apiProducts = Array.isArray(data?.data?.products) ? data.data.products : [];
        const apiPagination = data?.data?.pagination;
        products.value = apiProducts.map((p) => ({
            id: String(p._id ?? p.id ?? ''),
            name: String(p.name ?? '未命名产品'),
            price: Number(p.price ?? 0),
            image: String(p.image_url ??
                p.image ??
                'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=hearing+aid+product+photo+white+background&image_size=square'),
            category: String(p.category ?? '未分类'),
            rating: Number(p.rating ?? 4.6)
        }));
        totalPages.value = Number(apiPagination?.total_pages ?? 1) || 1;
        if (currentPage.value > totalPages.value)
            currentPage.value = totalPages.value;
    }
    catch (e) {
        errorMessage.value = e?.message ?? '获取产品失败';
    }
    finally {
        loading.value = false;
    }
};
function setupSse() {
    try {
        es = new EventSource('/api/product/stream');
        es.addEventListener('products', () => {
            scheduleFetch();
        });
        es.addEventListener('ping', () => { });
        es.onerror = () => {
            try {
                es?.close();
            }
            catch { }
            es = null;
        };
    }
    catch {
        es = null;
    }
}
onMounted(() => {
    fetchProducts();
    setupSse();
});
onBeforeUnmount(() => {
    if (sseTimer)
        window.clearTimeout(sseTimer);
    try {
        es?.close();
    }
    catch { }
    es = null;
});
watch([activeCategory, keyword], () => {
    currentPage.value = 1;
});
watch([activeCategory, currentPage, keyword], () => {
    if (currentPage.value < 1)
        currentPage.value = 1;
    fetchProducts();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['no-scrollbar']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-12" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "relative h-[400px] rounded-3xl overflow-hidden bg-[var(--c-primary)] flex items-center" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "absolute inset-0 opacity-20" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    src: "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=abstract+blue+technology+background+clean+modern&image_size=landscape_16_9",
    alt: "banner",
    ...{ class: "w-full h-full object-cover" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "relative container mx-auto px-12 text-[var(--c-on-primary)] space-y-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-5xl font-extrabold leading-tight" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.br)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-xl opacity-90 max-w-lg" },
});
const __VLS_0 = {}.RouterLink;
/** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    to: "/recommendations",
    ...{ class: "a11y-hit bg-[var(--c-on-primary)] text-[var(--c-primary)] px-8 py-3 rounded-full font-extrabold flex items-center space-x-2 w-fit" },
    'aria-label': "去个性化推荐",
}));
const __VLS_2 = __VLS_1({
    to: "/recommendations",
    ...{ class: "a11y-hit bg-[var(--c-on-primary)] text-[var(--c-primary)] px-8 py-3 rounded-full font-extrabold flex items-center space-x-2 w-fit" },
    'aria-label': "去个性化推荐",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
const __VLS_4 = {}.ChevronRight;
/** @type {[typeof __VLS_components.ChevronRight, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ class: "h-5 w-5" },
}));
const __VLS_6 = __VLS_5({
    ...{ class: "h-5 w-5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center justify-between mb-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "text-2xl font-extrabold text-[var(--c-text)]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex space-x-4 overflow-x-auto pb-4 no-scrollbar" },
});
for (const [cat] of __VLS_getVForSourceType((__VLS_ctx.categories))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.activeCategory = cat;
            } },
        key: (cat),
        ...{ class: ([
                'a11y-hit px-6 py-2.5 rounded-full text-base font-extrabold whitespace-nowrap border-2',
                __VLS_ctx.activeCategory === cat
                    ? 'bg-[var(--c-primary)] text-[var(--c-on-primary)] border-[var(--c-primary)]'
                    : 'bg-[var(--c-surface)] text-[var(--c-text)] border-[var(--c-border)]'
            ]) },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
    (cat);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center justify-between mb-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "text-2xl font-extrabold text-[var(--c-text)]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "a11y-hit text-[var(--c-primary)] font-extrabold underline flex items-center" },
});
__VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
const __VLS_8 = {}.ChevronRight;
/** @type {[typeof __VLS_components.ChevronRight, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ class: "h-4 w-4 ml-1" },
}));
const __VLS_10 = __VLS_9({
    ...{ class: "h-4 w-4 ml-1" },
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
if (__VLS_ctx.errorMessage) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-[var(--c-danger)] text-base font-bold mb-4" },
    });
    (__VLS_ctx.errorMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" },
});
if (__VLS_ctx.loading) {
    for (const [i] of __VLS_getVForSourceType((__VLS_ctx.skeletonCount))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (i),
            ...{ class: "bg-[var(--c-surface)] rounded-2xl p-4 border-2 border-[var(--c-border)] shadow-sm" },
        });
        const __VLS_12 = {}.ElSkeleton;
        /** @type {[typeof __VLS_components.ElSkeleton, typeof __VLS_components.elSkeleton, typeof __VLS_components.ElSkeleton, typeof __VLS_components.elSkeleton, ]} */ ;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
            animated: true,
        }));
        const __VLS_14 = __VLS_13({
            animated: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        __VLS_15.slots.default;
        {
            const { template: __VLS_thisSlot } = __VLS_15.slots;
            const __VLS_16 = {}.ElSkeletonItem;
            /** @type {[typeof __VLS_components.ElSkeletonItem, typeof __VLS_components.elSkeletonItem, ]} */ ;
            // @ts-ignore
            const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
                variant: "image",
                ...{ style: {} },
            }));
            const __VLS_18 = __VLS_17({
                variant: "image",
                ...{ style: {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_17));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "mt-4 space-y-2" },
            });
            const __VLS_20 = {}.ElSkeletonItem;
            /** @type {[typeof __VLS_components.ElSkeletonItem, typeof __VLS_components.elSkeletonItem, ]} */ ;
            // @ts-ignore
            const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
                variant: "h3",
                ...{ style: {} },
            }));
            const __VLS_22 = __VLS_21({
                variant: "h3",
                ...{ style: {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_21));
            const __VLS_24 = {}.ElSkeletonItem;
            /** @type {[typeof __VLS_components.ElSkeletonItem, typeof __VLS_components.elSkeletonItem, ]} */ ;
            // @ts-ignore
            const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
                variant: "text",
                ...{ style: {} },
            }));
            const __VLS_26 = __VLS_25({
                variant: "text",
                ...{ style: {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_25));
            const __VLS_28 = {}.ElSkeletonItem;
            /** @type {[typeof __VLS_components.ElSkeletonItem, typeof __VLS_components.elSkeletonItem, ]} */ ;
            // @ts-ignore
            const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
                variant: "text",
                ...{ style: {} },
            }));
            const __VLS_30 = __VLS_29({
                variant: "text",
                ...{ style: {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_29));
        }
        var __VLS_15;
    }
}
else {
    for (const [product] of __VLS_getVForSourceType((__VLS_ctx.products))) {
        /** @type {[typeof ProductCard, ]} */ ;
        // @ts-ignore
        const __VLS_32 = __VLS_asFunctionalComponent(ProductCard, new ProductCard({
            key: (product.id),
            product: (product),
        }));
        const __VLS_33 = __VLS_32({
            key: (product.id),
            product: (product),
        }, ...__VLS_functionalComponentArgsRest(__VLS_32));
    }
}
/** @type {[typeof Pagination, ]} */ ;
// @ts-ignore
const __VLS_35 = __VLS_asFunctionalComponent(Pagination, new Pagination({
    currentPage: (__VLS_ctx.currentPage),
    totalPages: (__VLS_ctx.totalPages),
}));
const __VLS_36 = __VLS_35({
    currentPage: (__VLS_ctx.currentPage),
    totalPages: (__VLS_ctx.totalPages),
}, ...__VLS_functionalComponentArgsRest(__VLS_35));
/** @type {__VLS_StyleScopedClasses['space-y-12']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['h-[400px]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[var(--c-primary)]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-20']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['container']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-on-primary)]']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-5xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['leading-tight']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-90']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[var(--c-on-primary)]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-primary)]']} */ ;
/** @type {__VLS_StyleScopedClasses['px-8']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-fit']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-4']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['no-scrollbar']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-primary)]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['underline']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-danger)]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[var(--c-surface)]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-[var(--c-border)]']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ProductCard: ProductCard,
            Pagination: Pagination,
            ChevronRight: ChevronRight,
            categories: categories,
            activeCategory: activeCategory,
            currentPage: currentPage,
            totalPages: totalPages,
            products: products,
            loading: loading,
            errorMessage: errorMessage,
            skeletonCount: skeletonCount,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=Home.vue.js.map