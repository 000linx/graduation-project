/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs';
import http, { unwrap } from '../../api/http';
const loading = ref(false);
const forbidden = ref(false);
const error = ref(null);
const orders = ref([]);
const statusFilter = ref('');
const keyword = ref('');
const filteredOrders = computed(() => {
    const k = keyword.value.trim().toLowerCase();
    const s = statusFilter.value;
    return orders.value.filter((o) => {
        if (s && String(o.status) !== s)
            return false;
        if (!k)
            return true;
        const text = `${o._id ?? ''} ${o.user_id ?? ''}`.toLowerCase();
        return text.includes(k);
    });
});
const drawerOpen = ref(false);
const activeOrder = ref(null);
const statusDialogOpen = ref(false);
const statusLoading = ref(false);
const statusForm = reactive({ orderId: '', status: '' });
const statusOptions = [
    { value: 'pending', label: '待支付' },
    { value: 'paid', label: '已支付' },
    { value: 'shipped', label: '已发货' },
    { value: 'delivered', label: '已送达' },
    { value: 'completed', label: '已完成' },
    { value: 'cancel_requested', label: '取消申请中' },
    { value: 'cancelled', label: '已取消' },
    { value: 'after_sale_pending', label: '售后处理中' },
    { value: 'after_sale_approved', label: '售后已通过' },
    { value: 'after_sale_rejected', label: '售后已拒绝' }
];
function statusTagType(status) {
    if (status === 'paid' || status === 'completed')
        return 'success';
    if (status === 'shipped' || status === 'delivered')
        return 'warning';
    if (status === 'after_sale_pending')
        return 'warning';
    if (status === 'after_sale_approved')
        return 'success';
    if (status === 'after_sale_rejected')
        return 'danger';
    if (status === 'cancel_requested')
        return 'warning';
    if (status === 'cancelled')
        return 'info';
    return 'default';
}
function statusLabel(status) {
    return statusOptions.find((s) => s.value === status)?.label ?? status;
}
async function fetchOrders() {
    loading.value = true;
    forbidden.value = false;
    error.value = null;
    try {
        const resp = await http.get('/api/admin/orders');
        const data = unwrap(resp);
        const list = Array.isArray(data?.orders) ? data.orders : [];
        orders.value = list.map((o) => ({
            _id: String(o._id),
            user_id: o.user_id ? String(o.user_id) : undefined,
            items: Array.isArray(o.items)
                ? o.items.map((it) => ({
                    product_id: it.product_id ? String(it.product_id) : undefined,
                    quantity: Number(it.quantity ?? 0),
                    unit_price: it.unit_price != null ? Number(it.unit_price) : it.price != null ? Number(it.price) : undefined,
                    name: it.name ? String(it.name) : undefined
                }))
                : [],
            total_amount: o.total_amount != null ? Number(o.total_amount) : undefined,
            status: (o.status ?? 'pending'),
            created_at: o.created_at ? String(o.created_at) : undefined,
            after_sale: o.after_sale ?? null,
            shipping_address: o.shipping_address ? String(o.shipping_address) : undefined,
            payment: o.payment ?? null,
            cancel_request: o.cancel_request ?? null
        }));
    }
    catch (e) {
        const status = e?.response?.status;
        if (status === 403)
            forbidden.value = true;
        error.value = e?.response?.data?.message || e?.message || '加载失败';
    }
    finally {
        loading.value = false;
    }
}
function openDetail(row) {
    activeOrder.value = row;
    drawerOpen.value = true;
}
async function openStatus(row) {
    statusForm.orderId = row._id;
    statusForm.status = row.status;
    statusDialogOpen.value = true;
}
async function submitStatus() {
    if (!statusForm.orderId || !statusForm.status)
        return;
    statusLoading.value = true;
    try {
        await http.put(`/api/admin/orders/${statusForm.orderId}/status`, { status: statusForm.status });
        const target = orders.value.find((o) => o._id === statusForm.orderId);
        if (target)
            target.status = statusForm.status;
        statusDialogOpen.value = false;
    }
    finally {
        statusLoading.value = false;
    }
}
const activeItems = computed(() => activeOrder.value?.items ?? []);
const afterSaleDialogOpen = ref(false);
const afterSaleLoading = ref(false);
const afterSaleForm = reactive({
    orderId: '',
    status: '',
    remark: ''
});
function openAfterSale(row) {
    afterSaleForm.orderId = row._id;
    afterSaleForm.status = '';
    afterSaleForm.remark = '';
    afterSaleDialogOpen.value = true;
}
async function submitAfterSale() {
    if (!afterSaleForm.orderId || !afterSaleForm.status)
        return;
    afterSaleLoading.value = true;
    try {
        await http.put(`/api/admin/orders/${afterSaleForm.orderId}/after_sale`, {
            status: afterSaleForm.status,
            remark: afterSaleForm.remark
        });
        afterSaleDialogOpen.value = false;
        await fetchOrders();
    }
    finally {
        afterSaleLoading.value = false;
    }
}
onMounted(fetchOrders);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-5" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-col gap-3 md:flex-row md:items-start md:justify-between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-2xl font-semibold text-gray-900" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-sm text-gray-500 mt-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-col gap-2 sm:flex-row sm:items-center" },
});
const __VLS_0 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.keyword),
    placeholder: "搜索订单号/用户ID",
    ...{ style: {} },
    clearable: true,
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.keyword),
    placeholder: "搜索订单号/用户ID",
    ...{ style: {} },
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const __VLS_4 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    modelValue: (__VLS_ctx.statusFilter),
    placeholder: "状态",
    ...{ style: {} },
    clearable: true,
}));
const __VLS_6 = __VLS_5({
    modelValue: (__VLS_ctx.statusFilter),
    placeholder: "状态",
    ...{ style: {} },
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
for (const [s] of __VLS_getVForSourceType((__VLS_ctx.statusOptions))) {
    const __VLS_8 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        key: (s.value),
        label: (s.label),
        value: (s.value),
    }));
    const __VLS_10 = __VLS_9({
        key: (s.value),
        label: (s.label),
        value: (s.value),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
}
var __VLS_7;
const __VLS_12 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.loading),
}));
const __VLS_14 = __VLS_13({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onClick: (__VLS_ctx.fetchOrders)
};
__VLS_15.slots.default;
var __VLS_15;
if (__VLS_ctx.forbidden) {
    const __VLS_20 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        type: "error",
        showIcon: true,
        title: "无权限",
        description: "当前账号不是管理员，无法访问订单管理。",
    }));
    const __VLS_22 = __VLS_21({
        type: "error",
        showIcon: true,
        title: "无权限",
        description: "当前账号不是管理员，无法访问订单管理。",
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
}
else if (__VLS_ctx.error) {
    const __VLS_24 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.error),
    }));
    const __VLS_26 = __VLS_25({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.error),
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
}
const __VLS_28 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    data: (__VLS_ctx.filteredOrders),
    stripe: true,
    size: "small",
    ...{ class: "bg-white rounded-2xl border" },
}));
const __VLS_30 = __VLS_29({
    data: (__VLS_ctx.filteredOrders),
    stripe: true,
    size: "small",
    ...{ class: "bg-white rounded-2xl border" },
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.loading) }, null, null);
__VLS_31.slots.default;
const __VLS_32 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    prop: "_id",
    label: "订单号",
    minWidth: "240",
    showOverflowTooltip: true,
}));
const __VLS_34 = __VLS_33({
    prop: "_id",
    label: "订单号",
    minWidth: "240",
    showOverflowTooltip: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
const __VLS_36 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    prop: "total_amount",
    label: "金额",
    width: "140",
}));
const __VLS_38 = __VLS_37({
    prop: "total_amount",
    label: "金额",
    width: "140",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_39.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    (Number(row.total_amount || 0).toFixed(2));
}
var __VLS_39;
const __VLS_40 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    prop: "status",
    label: "状态",
    width: "140",
}));
const __VLS_42 = __VLS_41({
    prop: "status",
    label: "状态",
    width: "140",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_43.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_44 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        type: (__VLS_ctx.statusTagType(row.status)),
    }));
    const __VLS_46 = __VLS_45({
        type: (__VLS_ctx.statusTagType(row.status)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    __VLS_47.slots.default;
    (__VLS_ctx.statusLabel(row.status));
    var __VLS_47;
}
var __VLS_43;
const __VLS_48 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    prop: "created_at",
    label: "创建时间",
    minWidth: "200",
}));
const __VLS_50 = __VLS_49({
    prop: "created_at",
    label: "创建时间",
    minWidth: "200",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_51.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    if (row.created_at) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.dayjs(row.created_at).format('YYYY-MM-DD HH:mm'));
    }
}
var __VLS_51;
const __VLS_52 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    label: "操作",
    width: "180",
    fixed: "right",
}));
const __VLS_54 = __VLS_53({
    label: "操作",
    width: "180",
    fixed: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_55.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_56 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        ...{ 'onClick': {} },
        type: "primary",
        link: true,
    }));
    const __VLS_58 = __VLS_57({
        ...{ 'onClick': {} },
        type: "primary",
        link: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    let __VLS_60;
    let __VLS_61;
    let __VLS_62;
    const __VLS_63 = {
        onClick: (...[$event]) => {
            __VLS_ctx.openDetail(row);
        }
    };
    __VLS_59.slots.default;
    var __VLS_59;
    const __VLS_64 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        ...{ 'onClick': {} },
        type: "primary",
        link: true,
    }));
    const __VLS_66 = __VLS_65({
        ...{ 'onClick': {} },
        type: "primary",
        link: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    let __VLS_68;
    let __VLS_69;
    let __VLS_70;
    const __VLS_71 = {
        onClick: (...[$event]) => {
            __VLS_ctx.openStatus(row);
        }
    };
    __VLS_67.slots.default;
    var __VLS_67;
    if (row.status === 'after_sale_pending') {
        const __VLS_72 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
            ...{ 'onClick': {} },
            type: "danger",
            link: true,
        }));
        const __VLS_74 = __VLS_73({
            ...{ 'onClick': {} },
            type: "danger",
            link: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_73));
        let __VLS_76;
        let __VLS_77;
        let __VLS_78;
        const __VLS_79 = {
            onClick: (...[$event]) => {
                if (!(row.status === 'after_sale_pending'))
                    return;
                __VLS_ctx.openAfterSale(row);
            }
        };
        __VLS_75.slots.default;
        var __VLS_75;
    }
}
var __VLS_55;
var __VLS_31;
const __VLS_80 = {}.ElDrawer;
/** @type {[typeof __VLS_components.ElDrawer, typeof __VLS_components.elDrawer, typeof __VLS_components.ElDrawer, typeof __VLS_components.elDrawer, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    modelValue: (__VLS_ctx.drawerOpen),
    title: "订单明细",
    size: "520px",
}));
const __VLS_82 = __VLS_81({
    modelValue: (__VLS_ctx.drawerOpen),
    title: "订单明细",
    size: "520px",
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
__VLS_83.slots.default;
if (__VLS_ctx.activeOrder) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bg-gray-50 rounded-xl p-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm text-gray-500" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm font-medium text-gray-900 mt-1" },
    });
    (__VLS_ctx.activeOrder._id);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm text-gray-500 mt-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm text-gray-700 mt-1" },
    });
    (__VLS_ctx.activeOrder.user_id || '-');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm text-gray-500 mt-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-1" },
    });
    const __VLS_84 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        type: (__VLS_ctx.statusTagType(__VLS_ctx.activeOrder.status)),
    }));
    const __VLS_86 = __VLS_85({
        type: (__VLS_ctx.statusTagType(__VLS_ctx.activeOrder.status)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    __VLS_87.slots.default;
    (__VLS_ctx.statusLabel(__VLS_ctx.activeOrder.status));
    var __VLS_87;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm text-gray-500 mt-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm text-gray-700 mt-1" },
    });
    (Number(__VLS_ctx.activeOrder.total_amount || 0).toFixed(2));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm text-gray-500 mt-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm text-gray-700 mt-1" },
    });
    (__VLS_ctx.activeOrder.shipping_address || '-');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm text-gray-500 mt-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm text-gray-700 mt-1" },
    });
    (__VLS_ctx.activeOrder.payment?.status || '-');
    (__VLS_ctx.activeOrder.payment?.method ? `(${__VLS_ctx.activeOrder.payment.method})` : '');
    if (__VLS_ctx.activeOrder.cancel_request) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-sm text-gray-600 mt-3" },
        });
        (__VLS_ctx.activeOrder.cancel_request.reason);
    }
    if (__VLS_ctx.activeOrder.after_sale) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-sm text-gray-600 mt-3" },
        });
        (__VLS_ctx.activeOrder.after_sale.type);
        (__VLS_ctx.activeOrder.after_sale.status);
        (__VLS_ctx.activeOrder.after_sale.reason);
    }
    const __VLS_88 = {}.ElTable;
    /** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        data: (__VLS_ctx.activeItems),
        ...{ class: "bg-white rounded-2xl border" },
        size: "small",
    }));
    const __VLS_90 = __VLS_89({
        data: (__VLS_ctx.activeItems),
        ...{ class: "bg-white rounded-2xl border" },
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
    __VLS_91.slots.default;
    const __VLS_92 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
        prop: "product_id",
        label: "商品ID",
        minWidth: "220",
    }));
    const __VLS_94 = __VLS_93({
        prop: "product_id",
        label: "商品ID",
        minWidth: "220",
    }, ...__VLS_functionalComponentArgsRest(__VLS_93));
    const __VLS_96 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
        prop: "quantity",
        label: "数量",
        width: "100",
    }));
    const __VLS_98 = __VLS_97({
        prop: "quantity",
        label: "数量",
        width: "100",
    }, ...__VLS_functionalComponentArgsRest(__VLS_97));
    const __VLS_100 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
        prop: "unit_price",
        label: "单价",
        width: "120",
    }));
    const __VLS_102 = __VLS_101({
        prop: "unit_price",
        label: "单价",
        width: "120",
    }, ...__VLS_functionalComponentArgsRest(__VLS_101));
    __VLS_103.slots.default;
    {
        const { default: __VLS_thisSlot } = __VLS_103.slots;
        const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
        (row.unit_price != null ? `¥${Number(row.unit_price).toFixed(2)}` : '-');
    }
    var __VLS_103;
    var __VLS_91;
}
var __VLS_83;
const __VLS_104 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
    modelValue: (__VLS_ctx.statusDialogOpen),
    title: "修改订单状态",
    width: "420px",
    closeOnClickModal: (false),
}));
const __VLS_106 = __VLS_105({
    modelValue: (__VLS_ctx.statusDialogOpen),
    title: "修改订单状态",
    width: "420px",
    closeOnClickModal: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_105));
__VLS_107.slots.default;
const __VLS_108 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
    modelValue: (__VLS_ctx.statusForm.status),
    ...{ class: "w-full" },
    placeholder: "选择状态",
}));
const __VLS_110 = __VLS_109({
    modelValue: (__VLS_ctx.statusForm.status),
    ...{ class: "w-full" },
    placeholder: "选择状态",
}, ...__VLS_functionalComponentArgsRest(__VLS_109));
__VLS_111.slots.default;
for (const [s] of __VLS_getVForSourceType((__VLS_ctx.statusOptions))) {
    const __VLS_112 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
        key: (s.value),
        label: (s.label),
        value: (s.value),
    }));
    const __VLS_114 = __VLS_113({
        key: (s.value),
        label: (s.label),
        value: (s.value),
    }, ...__VLS_functionalComponentArgsRest(__VLS_113));
}
var __VLS_111;
{
    const { footer: __VLS_thisSlot } = __VLS_107.slots;
    const __VLS_116 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
        ...{ 'onClick': {} },
    }));
    const __VLS_118 = __VLS_117({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_117));
    let __VLS_120;
    let __VLS_121;
    let __VLS_122;
    const __VLS_123 = {
        onClick: (...[$event]) => {
            __VLS_ctx.statusDialogOpen = false;
        }
    };
    __VLS_119.slots.default;
    var __VLS_119;
    const __VLS_124 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.statusLoading),
    }));
    const __VLS_126 = __VLS_125({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.statusLoading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_125));
    let __VLS_128;
    let __VLS_129;
    let __VLS_130;
    const __VLS_131 = {
        onClick: (__VLS_ctx.submitStatus)
    };
    __VLS_127.slots.default;
    var __VLS_127;
}
var __VLS_107;
const __VLS_132 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
    modelValue: (__VLS_ctx.afterSaleDialogOpen),
    title: "处理售后",
    width: "520px",
    closeOnClickModal: (false),
}));
const __VLS_134 = __VLS_133({
    modelValue: (__VLS_ctx.afterSaleDialogOpen),
    title: "处理售后",
    width: "520px",
    closeOnClickModal: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_133));
__VLS_135.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-4" },
});
const __VLS_136 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
    modelValue: (__VLS_ctx.afterSaleForm.status),
    ...{ class: "w-full" },
    placeholder: "选择处理结果",
}));
const __VLS_138 = __VLS_137({
    modelValue: (__VLS_ctx.afterSaleForm.status),
    ...{ class: "w-full" },
    placeholder: "选择处理结果",
}, ...__VLS_functionalComponentArgsRest(__VLS_137));
__VLS_139.slots.default;
const __VLS_140 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
    label: "通过",
    value: "approved",
}));
const __VLS_142 = __VLS_141({
    label: "通过",
    value: "approved",
}, ...__VLS_functionalComponentArgsRest(__VLS_141));
const __VLS_144 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
    label: "拒绝",
    value: "rejected",
}));
const __VLS_146 = __VLS_145({
    label: "拒绝",
    value: "rejected",
}, ...__VLS_functionalComponentArgsRest(__VLS_145));
var __VLS_139;
const __VLS_148 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
    modelValue: (__VLS_ctx.afterSaleForm.remark),
    type: "textarea",
    rows: (4),
    placeholder: "处理备注（可选）",
}));
const __VLS_150 = __VLS_149({
    modelValue: (__VLS_ctx.afterSaleForm.remark),
    type: "textarea",
    rows: (4),
    placeholder: "处理备注（可选）",
}, ...__VLS_functionalComponentArgsRest(__VLS_149));
{
    const { footer: __VLS_thisSlot } = __VLS_135.slots;
    const __VLS_152 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
        ...{ 'onClick': {} },
    }));
    const __VLS_154 = __VLS_153({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_153));
    let __VLS_156;
    let __VLS_157;
    let __VLS_158;
    const __VLS_159 = {
        onClick: (...[$event]) => {
            __VLS_ctx.afterSaleDialogOpen = false;
        }
    };
    __VLS_155.slots.default;
    var __VLS_155;
    const __VLS_160 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_161 = __VLS_asFunctionalComponent(__VLS_160, new __VLS_160({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.afterSaleLoading),
        disabled: (!__VLS_ctx.afterSaleForm.status),
    }));
    const __VLS_162 = __VLS_161({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.afterSaleLoading),
        disabled: (!__VLS_ctx.afterSaleForm.status),
    }, ...__VLS_functionalComponentArgsRest(__VLS_161));
    let __VLS_164;
    let __VLS_165;
    let __VLS_166;
    const __VLS_167 = {
        onClick: (__VLS_ctx.submitAfterSale)
    };
    __VLS_163.slots.default;
    var __VLS_163;
}
var __VLS_135;
/** @type {__VLS_StyleScopedClasses['space-y-5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['md:flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['md:items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['md:justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
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
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            dayjs: dayjs,
            loading: loading,
            forbidden: forbidden,
            error: error,
            statusFilter: statusFilter,
            keyword: keyword,
            filteredOrders: filteredOrders,
            drawerOpen: drawerOpen,
            activeOrder: activeOrder,
            statusDialogOpen: statusDialogOpen,
            statusLoading: statusLoading,
            statusForm: statusForm,
            statusOptions: statusOptions,
            statusTagType: statusTagType,
            statusLabel: statusLabel,
            fetchOrders: fetchOrders,
            openDetail: openDetail,
            openStatus: openStatus,
            submitStatus: submitStatus,
            activeItems: activeItems,
            afterSaleDialogOpen: afterSaleDialogOpen,
            afterSaleLoading: afterSaleLoading,
            afterSaleForm: afterSaleForm,
            openAfterSale: openAfterSale,
            submitAfterSale: submitAfterSale,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=AdminOrders.vue.js.map