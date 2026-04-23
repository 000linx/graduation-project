/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import http, { unwrap } from '../../api/http';
import { ElMessage } from 'element-plus';
const categories = ['全部', '耳背式', '耳内式', '隐形式', '充电款'];
const granularityOptions = [
    { label: '日', value: 'day' },
    { label: '周', value: 'week' },
    { label: '月', value: 'month' },
    { label: '季度', value: 'quarter' },
    { label: '年', value: 'year' }
];
const granularity = ref('day');
const category = ref('全部');
const dateRange = ref(null);
const loading = ref(false);
const error = ref(null);
const page = ref(1);
const pageSize = ref(50);
const hasMore = ref(false);
const series = ref([]);
const chartEl = ref(null);
let chart = null;
let echartsMod = null;
const empty = computed(() => !loading.value && !error.value && series.value.length === 0);
const queryParams = computed(() => {
    const p = {
        granularity: granularity.value,
        page: page.value,
        page_size: pageSize.value
    };
    if (category.value && category.value !== '全部')
        p.category = category.value;
    if (dateRange.value) {
        p.start = dateRange.value[0].toISOString().slice(0, 10);
        p.end = dateRange.value[1].toISOString().slice(0, 10);
    }
    return p;
});
async function loadSeries(reset = false) {
    if (reset) {
        page.value = 1;
        series.value = [];
    }
    loading.value = true;
    error.value = null;
    try {
        const resp = await http.get('/api/admin/sales/series', { params: queryParams.value });
        const data = unwrap(resp);
        const list = Array.isArray(data?.items) ? data.items : [];
        hasMore.value = Boolean(data?.has_more);
        if (page.value === 1)
            series.value = list;
        else
            series.value = [...series.value, ...list];
        await nextTick();
        renderChart();
    }
    catch (e) {
        error.value = e?.response?.data?.message || e?.message || '加载失败';
    }
    finally {
        loading.value = false;
    }
}
async function loadMore() {
    if (!hasMore.value || loading.value)
        return;
    page.value += 1;
    await loadSeries(false);
}
function fmtAmount(v) {
    const n = Number(v || 0);
    return n.toFixed(2);
}
async function ensureChart() {
    if (!chartEl.value)
        return;
    if (!echartsMod) {
        echartsMod = await import('echarts');
    }
    if (!chart) {
        chart = echartsMod.init(chartEl.value, undefined, { renderer: 'canvas' });
        chart.on('click', (params) => {
            const bucket = String(params?.name ?? '');
            if (!bucket)
                return;
            openDetail(bucket);
        });
    }
}
function renderChart() {
    if (!chartEl.value)
        return;
    if (!echartsMod || !chart)
        return;
    const x = series.value.map((s) => s.bucket);
    const y = series.value.map((s) => Number(s.total_sales || 0));
    chart.setOption({
        grid: { left: 44, right: 18, top: 36, bottom: 40 },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (ps) => {
                const p = ps?.[0];
                const idx = p?.dataIndex ?? 0;
                const it = series.value[idx];
                const bucket = it?.bucket ?? '';
                const total = fmtAmount(it?.total_sales ?? 0);
                const cnt = it?.count ?? 0;
                return `${bucket}<br/>销售额：¥${total}<br/>订单/项数：${cnt}<br/>点击查看明细`;
            }
        },
        xAxis: {
            type: 'category',
            data: x,
            axisLabel: { color: '#6B7280' },
            axisLine: { lineStyle: { color: '#E5E7EB' } }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#6B7280' },
            splitLine: { lineStyle: { color: '#F3F4F6' } }
        },
        series: [
            {
                type: 'bar',
                data: y,
                barMaxWidth: 42,
                itemStyle: { color: '#2563EB', borderRadius: [6, 6, 0, 0] },
                emphasis: { itemStyle: { color: '#1D4ED8' } }
            }
        ]
    }, { notMerge: true, lazyUpdate: true });
}
function resizeChart() {
    try {
        chart?.resize();
    }
    catch {
    }
}
useResizeObserver(chartEl, () => resizeChart());
onMounted(async () => {
    await ensureChart();
    await loadSeries(true);
});
onBeforeUnmount(() => {
    try {
        chart?.dispose();
    }
    catch {
    }
    chart = null;
});
watch([granularity, category, dateRange], async () => {
    await loadSeries(true);
});
const detailOpen = ref(false);
const detailLoading = ref(false);
const detailError = ref(null);
const detailBucket = ref(null);
const detailPage = ref(1);
const detailHasMore = ref(false);
const detailItems = ref([]);
const detailTitle = computed(() => {
    const g = granularityOptions.find((x) => x.value === granularity.value)?.label ?? '';
    const c = category.value && category.value !== '全部' ? ` · ${category.value}` : '';
    return `明细（${g}：${detailBucket.value ?? '-'}${c}）`;
});
async function fetchDetail(reset = false) {
    if (!detailBucket.value)
        return;
    if (reset) {
        detailPage.value = 1;
        detailItems.value = [];
    }
    detailLoading.value = true;
    detailError.value = null;
    try {
        const params = {
            granularity: granularity.value,
            bucket: detailBucket.value,
            page: detailPage.value,
            page_size: 20
        };
        if (category.value && category.value !== '全部')
            params.category = category.value;
        const resp = await http.get('/api/admin/sales/detail', { params });
        const data = unwrap(resp);
        const list = Array.isArray(data?.items) ? data.items : [];
        detailHasMore.value = Boolean(data?.has_more);
        if (detailPage.value === 1)
            detailItems.value = list;
        else
            detailItems.value = [...detailItems.value, ...list];
    }
    catch (e) {
        detailError.value = e?.response?.data?.message || e?.message || '加载失败';
    }
    finally {
        detailLoading.value = false;
    }
}
async function openDetail(bucket) {
    detailBucket.value = bucket;
    detailOpen.value = true;
    await fetchDetail(true);
}
async function loadMoreDetail() {
    if (!detailHasMore.value || detailLoading.value)
        return;
    detailPage.value += 1;
    await fetchDetail(false);
}
function exportPng() {
    try {
        const url = chart?.getDataURL?.({ type: 'png', pixelRatio: 2, backgroundColor: '#FFFFFF' });
        if (!url)
            return;
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-${granularity.value}.png`;
        a.click();
    }
    catch {
        ElMessage.error('导出失败');
    }
}
function exportCsv() {
    const rows = [['bucket', 'total_sales', 'count'], ...series.value.map((s) => [s.bucket, String(s.total_sales), String(s.count)])];
    const csv = rows.map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-${granularity.value}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-white border rounded-2xl p-5" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-col gap-3 md:flex-row md:items-start md:justify-between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-lg font-semibold text-gray-900" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-sm text-gray-500 mt-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-col gap-2 sm:flex-row sm:items-center" },
});
const __VLS_0 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.granularity),
    ...{ style: {} },
    placeholder: "维度",
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.granularity),
    ...{ style: {} },
    placeholder: "维度",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
for (const [g] of __VLS_getVForSourceType((__VLS_ctx.granularityOptions))) {
    const __VLS_4 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        key: (g.value),
        label: (g.label),
        value: (g.value),
    }));
    const __VLS_6 = __VLS_5({
        key: (g.value),
        label: (g.label),
        value: (g.value),
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
}
var __VLS_3;
const __VLS_8 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    modelValue: (__VLS_ctx.category),
    ...{ style: {} },
    placeholder: "分类",
    clearable: true,
}));
const __VLS_10 = __VLS_9({
    modelValue: (__VLS_ctx.category),
    ...{ style: {} },
    placeholder: "分类",
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
for (const [c] of __VLS_getVForSourceType((__VLS_ctx.categories))) {
    const __VLS_12 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        key: (c),
        label: (c),
        value: (c),
    }));
    const __VLS_14 = __VLS_13({
        key: (c),
        label: (c),
        value: (c),
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
}
var __VLS_11;
const __VLS_16 = {}.ElDatePicker;
/** @type {[typeof __VLS_components.ElDatePicker, typeof __VLS_components.elDatePicker, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    modelValue: (__VLS_ctx.dateRange),
    type: "daterange",
    rangeSeparator: "至",
    startPlaceholder: "开始日期",
    endPlaceholder: "结束日期",
    ...{ style: {} },
}));
const __VLS_18 = __VLS_17({
    modelValue: (__VLS_ctx.dateRange),
    type: "daterange",
    rangeSeparator: "至",
    startPlaceholder: "开始日期",
    endPlaceholder: "结束日期",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
const __VLS_20 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.loading),
}));
const __VLS_22 = __VLS_21({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
let __VLS_24;
let __VLS_25;
let __VLS_26;
const __VLS_27 = {
    onClick: (...[$event]) => {
        __VLS_ctx.loadSeries(true);
    }
};
__VLS_23.slots.default;
var __VLS_23;
const __VLS_28 = {}.ElDropdown;
/** @type {[typeof __VLS_components.ElDropdown, typeof __VLS_components.elDropdown, typeof __VLS_components.ElDropdown, typeof __VLS_components.elDropdown, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({}));
const __VLS_30 = __VLS_29({}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
const __VLS_32 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({}));
const __VLS_34 = __VLS_33({}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
var __VLS_35;
{
    const { dropdown: __VLS_thisSlot } = __VLS_31.slots;
    const __VLS_36 = {}.ElDropdownMenu;
    /** @type {[typeof __VLS_components.ElDropdownMenu, typeof __VLS_components.elDropdownMenu, typeof __VLS_components.ElDropdownMenu, typeof __VLS_components.elDropdownMenu, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({}));
    const __VLS_38 = __VLS_37({}, ...__VLS_functionalComponentArgsRest(__VLS_37));
    __VLS_39.slots.default;
    const __VLS_40 = {}.ElDropdownItem;
    /** @type {[typeof __VLS_components.ElDropdownItem, typeof __VLS_components.elDropdownItem, typeof __VLS_components.ElDropdownItem, typeof __VLS_components.elDropdownItem, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        ...{ 'onClick': {} },
    }));
    const __VLS_42 = __VLS_41({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    let __VLS_44;
    let __VLS_45;
    let __VLS_46;
    const __VLS_47 = {
        onClick: (__VLS_ctx.exportPng)
    };
    __VLS_43.slots.default;
    var __VLS_43;
    const __VLS_48 = {}.ElDropdownItem;
    /** @type {[typeof __VLS_components.ElDropdownItem, typeof __VLS_components.elDropdownItem, typeof __VLS_components.ElDropdownItem, typeof __VLS_components.elDropdownItem, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        ...{ 'onClick': {} },
    }));
    const __VLS_50 = __VLS_49({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    let __VLS_52;
    let __VLS_53;
    let __VLS_54;
    const __VLS_55 = {
        onClick: (__VLS_ctx.exportCsv)
    };
    __VLS_51.slots.default;
    var __VLS_51;
    var __VLS_39;
}
var __VLS_31;
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-4" },
    });
    const __VLS_56 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.error),
    }));
    const __VLS_58 = __VLS_57({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.error),
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-4" },
    });
    if (__VLS_ctx.empty) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "py-10" },
        });
        const __VLS_60 = {}.ElEmpty;
        /** @type {[typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ]} */ ;
        // @ts-ignore
        const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
            description: "暂无销售数据",
        }));
        const __VLS_62 = __VLS_61({
            description: "暂无销售数据",
        }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "relative" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ref: "chartEl",
            ...{ class: "w-full h-[360px]" },
        });
        /** @type {typeof __VLS_ctx.chartEl} */ ;
        if (__VLS_ctx.loading) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "absolute inset-0 bg-white/60 flex items-center justify-center text-sm text-gray-600" },
            });
        }
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mt-4 flex items-center justify-between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-xs text-gray-500" },
});
(__VLS_ctx.series.length);
if (__VLS_ctx.hasMore) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
if (__VLS_ctx.hasMore) {
    const __VLS_64 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        ...{ 'onClick': {} },
        loading: (__VLS_ctx.loading),
    }));
    const __VLS_66 = __VLS_65({
        ...{ 'onClick': {} },
        loading: (__VLS_ctx.loading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    let __VLS_68;
    let __VLS_69;
    let __VLS_70;
    const __VLS_71 = {
        onClick: (__VLS_ctx.loadMore)
    };
    __VLS_67.slots.default;
    var __VLS_67;
}
const __VLS_72 = {}.ElDrawer;
/** @type {[typeof __VLS_components.ElDrawer, typeof __VLS_components.elDrawer, typeof __VLS_components.ElDrawer, typeof __VLS_components.elDrawer, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    modelValue: (__VLS_ctx.detailOpen),
    title: (__VLS_ctx.detailTitle),
    size: "720px",
}));
const __VLS_74 = __VLS_73({
    modelValue: (__VLS_ctx.detailOpen),
    title: (__VLS_ctx.detailTitle),
    size: "720px",
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
__VLS_75.slots.default;
if (__VLS_ctx.detailError) {
    const __VLS_76 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.detailError),
        ...{ class: "mb-3" },
    }));
    const __VLS_78 = __VLS_77({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.detailError),
        ...{ class: "mb-3" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
}
const __VLS_80 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    data: (__VLS_ctx.detailItems),
    stripe: true,
    size: "small",
    ...{ class: "border rounded-xl" },
}));
const __VLS_82 = __VLS_81({
    data: (__VLS_ctx.detailItems),
    stripe: true,
    size: "small",
    ...{ class: "border rounded-xl" },
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.detailLoading) }, null, null);
__VLS_83.slots.default;
const __VLS_84 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    prop: "_id",
    label: "订单ID",
    minWidth: "220",
    showOverflowTooltip: true,
}));
const __VLS_86 = __VLS_85({
    prop: "_id",
    label: "订单ID",
    minWidth: "220",
    showOverflowTooltip: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
const __VLS_88 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
    prop: "created_at",
    label: "时间",
    minWidth: "170",
    showOverflowTooltip: true,
}));
const __VLS_90 = __VLS_89({
    prop: "created_at",
    label: "时间",
    minWidth: "170",
    showOverflowTooltip: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
const __VLS_92 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
    prop: "status",
    label: "状态",
    width: "120",
}));
const __VLS_94 = __VLS_93({
    prop: "status",
    label: "状态",
    width: "120",
}, ...__VLS_functionalComponentArgsRest(__VLS_93));
const __VLS_96 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
    prop: "user_id",
    label: "用户ID",
    minWidth: "220",
    showOverflowTooltip: true,
}));
const __VLS_98 = __VLS_97({
    prop: "user_id",
    label: "用户ID",
    minWidth: "220",
    showOverflowTooltip: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_97));
const __VLS_100 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
    prop: "order_total",
    label: "订单金额",
    width: "140",
}));
const __VLS_102 = __VLS_101({
    prop: "order_total",
    label: "订单金额",
    width: "140",
}, ...__VLS_functionalComponentArgsRest(__VLS_101));
__VLS_103.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_103.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    (Number(row.order_total || 0).toFixed(2));
}
var __VLS_103;
if (__VLS_ctx.category !== '全部') {
    const __VLS_104 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
        prop: "category_total",
        label: "该分类金额",
        width: "160",
    }));
    const __VLS_106 = __VLS_105({
        prop: "category_total",
        label: "该分类金额",
        width: "160",
    }, ...__VLS_functionalComponentArgsRest(__VLS_105));
    __VLS_107.slots.default;
    {
        const { default: __VLS_thisSlot } = __VLS_107.slots;
        const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
        (Number(row.category_total || 0).toFixed(2));
    }
    var __VLS_107;
}
var __VLS_83;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mt-4 flex justify-end" },
});
if (__VLS_ctx.detailHasMore) {
    const __VLS_108 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
        ...{ 'onClick': {} },
        loading: (__VLS_ctx.detailLoading),
    }));
    const __VLS_110 = __VLS_109({
        ...{ 'onClick': {} },
        loading: (__VLS_ctx.detailLoading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_109));
    let __VLS_112;
    let __VLS_113;
    let __VLS_114;
    const __VLS_115 = {
        onClick: (__VLS_ctx.loadMoreDetail)
    };
    __VLS_111.slots.default;
    var __VLS_111;
}
var __VLS_75;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['md:flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['md:items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['md:justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-10']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-[360px]']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white/60']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            categories: categories,
            granularityOptions: granularityOptions,
            granularity: granularity,
            category: category,
            dateRange: dateRange,
            loading: loading,
            error: error,
            hasMore: hasMore,
            series: series,
            chartEl: chartEl,
            empty: empty,
            loadSeries: loadSeries,
            loadMore: loadMore,
            detailOpen: detailOpen,
            detailLoading: detailLoading,
            detailError: detailError,
            detailHasMore: detailHasMore,
            detailItems: detailItems,
            detailTitle: detailTitle,
            loadMoreDetail: loadMoreDetail,
            exportPng: exportPng,
            exportCsv: exportCsv,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=SalesBarChart.vue.js.map