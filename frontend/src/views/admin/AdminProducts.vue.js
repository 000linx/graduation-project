/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElForm, ElMessageBox } from 'element-plus';
import http, { unwrap } from '../../api/http';
const categories = ['全部', '耳背式', '耳内式', '隐形式', '充电款'];
const loading = ref(false);
const forbidden = ref(false);
const error = ref(null);
const items = ref([]);
const activeCategory = ref('全部');
const keyword = ref('');
const editorOpen = ref(false);
const dialogLoading = ref(false);
const editingId = ref(null);
const formRef = ref(null);
const form = reactive({
    name: '',
    category: '',
    price: 0,
    stock: 0,
    description: '',
    image_url: ''
});
const isEdit = computed(() => Boolean(editingId.value));
function resetForm() {
    form.name = '';
    form.category = '';
    form.price = 0;
    form.stock = 0;
    form.description = '';
    form.image_url = '';
    editingId.value = null;
}
function openCreate() {
    resetForm();
    editorOpen.value = true;
}
function openEdit(row) {
    form.name = row.name;
    form.category = row.category;
    form.price = Number(row.price || 0);
    form.stock = Number(row.stock || 0);
    form.description = row.description || '';
    form.image_url = row.image_url || '';
    editingId.value = row._id;
    editorOpen.value = true;
}
const filteredItems = computed(() => {
    const k = keyword.value.trim().toLowerCase();
    if (!k)
        return items.value;
    return items.value.filter((p) => {
        const s = `${p.name ?? ''} ${p.category ?? ''} ${p._id ?? ''}`.toLowerCase();
        return s.includes(k);
    });
});
async function fetchProducts() {
    loading.value = true;
    forbidden.value = false;
    error.value = null;
    try {
        const params = {};
        if (activeCategory.value && activeCategory.value !== '全部')
            params.category = activeCategory.value;
        const resp = await http.get('/api/product/list', { params });
        const data = unwrap(resp);
        const list = Array.isArray(data?.products) ? data.products : [];
        items.value = list.map((p) => ({
            _id: String(p._id),
            name: String(p.name ?? ''),
            description: p.description ? String(p.description) : '',
            price: Number(p.price ?? 0),
            stock: Number(p.stock ?? 0),
            category: String(p.category ?? ''),
            image_url: p.image_url ? String(p.image_url) : ''
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
async function submit() {
    if (!formRef.value)
        return;
    await formRef.value.validate();
    dialogLoading.value = true;
    try {
        const payload = {
            name: form.name,
            category: form.category,
            price: Number(form.price),
            stock: Number(form.stock),
            description: form.description || '',
            image_url: form.image_url || undefined
        };
        if (editingId.value) {
            await http.put(`/api/admin/products/${editingId.value}`, payload);
        }
        else {
            await http.post('/api/admin/products', payload);
        }
        editorOpen.value = false;
        await fetchProducts();
    }
    finally {
        dialogLoading.value = false;
    }
}
async function remove(row) {
    const ok = await ElMessageBox.confirm(`确认删除商品 ${row.name}？`, '确认删除', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消'
    }).then(() => true, () => false);
    if (!ok)
        return;
    await http.delete(`/api/admin/products/${row._id}`);
    await fetchProducts();
}
watch(activeCategory, fetchProducts);
onMounted(fetchProducts);
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
    placeholder: "搜索名称/分类/ID",
    ...{ style: {} },
    clearable: true,
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.keyword),
    placeholder: "搜索名称/分类/ID",
    ...{ style: {} },
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const __VLS_4 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    modelValue: (__VLS_ctx.activeCategory),
    ...{ style: {} },
    placeholder: "分类",
}));
const __VLS_6 = __VLS_5({
    modelValue: (__VLS_ctx.activeCategory),
    ...{ style: {} },
    placeholder: "分类",
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
for (const [c] of __VLS_getVForSourceType((__VLS_ctx.categories))) {
    const __VLS_8 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        key: (c),
        label: (c),
        value: (c),
    }));
    const __VLS_10 = __VLS_9({
        key: (c),
        label: (c),
        value: (c),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
}
var __VLS_7;
const __VLS_12 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onClick': {} },
    type: "primary",
}));
const __VLS_14 = __VLS_13({
    ...{ 'onClick': {} },
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onClick: (__VLS_ctx.openCreate)
};
__VLS_15.slots.default;
var __VLS_15;
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
    onClick: (__VLS_ctx.fetchProducts)
};
__VLS_23.slots.default;
var __VLS_23;
if (__VLS_ctx.forbidden) {
    const __VLS_28 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        type: "error",
        showIcon: true,
        title: "无权限",
        description: "当前账号不是管理员，无法访问商品管理。",
    }));
    const __VLS_30 = __VLS_29({
        type: "error",
        showIcon: true,
        title: "无权限",
        description: "当前账号不是管理员，无法访问商品管理。",
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
}
else if (__VLS_ctx.error) {
    const __VLS_32 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.error),
    }));
    const __VLS_34 = __VLS_33({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.error),
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
}
const __VLS_36 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    data: (__VLS_ctx.filteredItems),
    stripe: true,
    size: "small",
    ...{ class: "bg-white rounded-2xl border" },
}));
const __VLS_38 = __VLS_37({
    data: (__VLS_ctx.filteredItems),
    stripe: true,
    size: "small",
    ...{ class: "bg-white rounded-2xl border" },
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.loading) }, null, null);
__VLS_39.slots.default;
const __VLS_40 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    prop: "name",
    label: "名称",
    minWidth: "220",
    showOverflowTooltip: true,
}));
const __VLS_42 = __VLS_41({
    prop: "name",
    label: "名称",
    minWidth: "220",
    showOverflowTooltip: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
const __VLS_44 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    prop: "category",
    label: "分类",
    width: "120",
}));
const __VLS_46 = __VLS_45({
    prop: "category",
    label: "分类",
    width: "120",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
const __VLS_48 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    prop: "price",
    label: "价格",
    width: "120",
}));
const __VLS_50 = __VLS_49({
    prop: "price",
    label: "价格",
    width: "120",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_51.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    (Number(row.price || 0).toFixed(2));
}
var __VLS_51;
const __VLS_52 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    prop: "stock",
    label: "库存",
    width: "120",
}));
const __VLS_54 = __VLS_53({
    prop: "stock",
    label: "库存",
    width: "120",
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
const __VLS_56 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    label: "操作",
    width: "180",
    fixed: "right",
}));
const __VLS_58 = __VLS_57({
    label: "操作",
    width: "180",
    fixed: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_59.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_60 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        ...{ 'onClick': {} },
        type: "primary",
        link: true,
    }));
    const __VLS_62 = __VLS_61({
        ...{ 'onClick': {} },
        type: "primary",
        link: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    let __VLS_64;
    let __VLS_65;
    let __VLS_66;
    const __VLS_67 = {
        onClick: (...[$event]) => {
            __VLS_ctx.openEdit(row);
        }
    };
    __VLS_63.slots.default;
    var __VLS_63;
    const __VLS_68 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
        ...{ 'onClick': {} },
        type: "danger",
        link: true,
    }));
    const __VLS_70 = __VLS_69({
        ...{ 'onClick': {} },
        type: "danger",
        link: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    let __VLS_72;
    let __VLS_73;
    let __VLS_74;
    const __VLS_75 = {
        onClick: (...[$event]) => {
            __VLS_ctx.remove(row);
        }
    };
    __VLS_71.slots.default;
    var __VLS_71;
}
var __VLS_59;
var __VLS_39;
const __VLS_76 = {}.ElDrawer;
/** @type {[typeof __VLS_components.ElDrawer, typeof __VLS_components.elDrawer, typeof __VLS_components.ElDrawer, typeof __VLS_components.elDrawer, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    ...{ 'onClosed': {} },
    modelValue: (__VLS_ctx.editorOpen),
    title: (__VLS_ctx.isEdit ? '编辑商品' : '新增商品'),
    size: "520px",
}));
const __VLS_78 = __VLS_77({
    ...{ 'onClosed': {} },
    modelValue: (__VLS_ctx.editorOpen),
    title: (__VLS_ctx.isEdit ? '编辑商品' : '新增商品'),
    size: "520px",
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
let __VLS_80;
let __VLS_81;
let __VLS_82;
const __VLS_83 = {
    onClosed: (__VLS_ctx.resetForm)
};
__VLS_79.slots.default;
const __VLS_84 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    ref: "formRef",
    model: (__VLS_ctx.form),
    labelWidth: "84px",
    ...{ class: "mt-2" },
}));
const __VLS_86 = __VLS_85({
    ref: "formRef",
    model: (__VLS_ctx.form),
    labelWidth: "84px",
    ...{ class: "mt-2" },
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
/** @type {typeof __VLS_ctx.formRef} */ ;
var __VLS_88 = {};
__VLS_87.slots.default;
const __VLS_90 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_91 = __VLS_asFunctionalComponent(__VLS_90, new __VLS_90({
    label: "名称",
    prop: "name",
    rules: ([{ required: true, message: '请输入名称' }]),
}));
const __VLS_92 = __VLS_91({
    label: "名称",
    prop: "name",
    rules: ([{ required: true, message: '请输入名称' }]),
}, ...__VLS_functionalComponentArgsRest(__VLS_91));
__VLS_93.slots.default;
const __VLS_94 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_95 = __VLS_asFunctionalComponent(__VLS_94, new __VLS_94({
    modelValue: (__VLS_ctx.form.name),
}));
const __VLS_96 = __VLS_95({
    modelValue: (__VLS_ctx.form.name),
}, ...__VLS_functionalComponentArgsRest(__VLS_95));
var __VLS_93;
const __VLS_98 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_99 = __VLS_asFunctionalComponent(__VLS_98, new __VLS_98({
    label: "分类",
    prop: "category",
    rules: ([{ required: true, message: '请选择分类' }]),
}));
const __VLS_100 = __VLS_99({
    label: "分类",
    prop: "category",
    rules: ([{ required: true, message: '请选择分类' }]),
}, ...__VLS_functionalComponentArgsRest(__VLS_99));
__VLS_101.slots.default;
const __VLS_102 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_103 = __VLS_asFunctionalComponent(__VLS_102, new __VLS_102({
    modelValue: (__VLS_ctx.form.category),
    placeholder: "选择分类",
    ...{ class: "w-full" },
}));
const __VLS_104 = __VLS_103({
    modelValue: (__VLS_ctx.form.category),
    placeholder: "选择分类",
    ...{ class: "w-full" },
}, ...__VLS_functionalComponentArgsRest(__VLS_103));
__VLS_105.slots.default;
for (const [c] of __VLS_getVForSourceType((__VLS_ctx.categories.filter((x) => x !== '全部')))) {
    const __VLS_106 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_107 = __VLS_asFunctionalComponent(__VLS_106, new __VLS_106({
        key: (c),
        label: (c),
        value: (c),
    }));
    const __VLS_108 = __VLS_107({
        key: (c),
        label: (c),
        value: (c),
    }, ...__VLS_functionalComponentArgsRest(__VLS_107));
}
var __VLS_105;
var __VLS_101;
const __VLS_110 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_111 = __VLS_asFunctionalComponent(__VLS_110, new __VLS_110({
    label: "价格",
    prop: "price",
    rules: ([{ required: true, message: '请输入价格' }]),
}));
const __VLS_112 = __VLS_111({
    label: "价格",
    prop: "price",
    rules: ([{ required: true, message: '请输入价格' }]),
}, ...__VLS_functionalComponentArgsRest(__VLS_111));
__VLS_113.slots.default;
const __VLS_114 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_115 = __VLS_asFunctionalComponent(__VLS_114, new __VLS_114({
    modelValue: (__VLS_ctx.form.price),
    min: (0),
    ...{ class: "w-full" },
}));
const __VLS_116 = __VLS_115({
    modelValue: (__VLS_ctx.form.price),
    min: (0),
    ...{ class: "w-full" },
}, ...__VLS_functionalComponentArgsRest(__VLS_115));
var __VLS_113;
const __VLS_118 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_119 = __VLS_asFunctionalComponent(__VLS_118, new __VLS_118({
    label: "库存",
    prop: "stock",
    rules: ([{ required: true, message: '请输入库存' }]),
}));
const __VLS_120 = __VLS_119({
    label: "库存",
    prop: "stock",
    rules: ([{ required: true, message: '请输入库存' }]),
}, ...__VLS_functionalComponentArgsRest(__VLS_119));
__VLS_121.slots.default;
const __VLS_122 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_123 = __VLS_asFunctionalComponent(__VLS_122, new __VLS_122({
    modelValue: (__VLS_ctx.form.stock),
    min: (0),
    ...{ class: "w-full" },
}));
const __VLS_124 = __VLS_123({
    modelValue: (__VLS_ctx.form.stock),
    min: (0),
    ...{ class: "w-full" },
}, ...__VLS_functionalComponentArgsRest(__VLS_123));
var __VLS_121;
const __VLS_126 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_127 = __VLS_asFunctionalComponent(__VLS_126, new __VLS_126({
    label: "图片URL",
}));
const __VLS_128 = __VLS_127({
    label: "图片URL",
}, ...__VLS_functionalComponentArgsRest(__VLS_127));
__VLS_129.slots.default;
const __VLS_130 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_131 = __VLS_asFunctionalComponent(__VLS_130, new __VLS_130({
    modelValue: (__VLS_ctx.form.image_url),
    placeholder: "https://...",
}));
const __VLS_132 = __VLS_131({
    modelValue: (__VLS_ctx.form.image_url),
    placeholder: "https://...",
}, ...__VLS_functionalComponentArgsRest(__VLS_131));
var __VLS_129;
const __VLS_134 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_135 = __VLS_asFunctionalComponent(__VLS_134, new __VLS_134({
    label: "描述",
}));
const __VLS_136 = __VLS_135({
    label: "描述",
}, ...__VLS_functionalComponentArgsRest(__VLS_135));
__VLS_137.slots.default;
const __VLS_138 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_139 = __VLS_asFunctionalComponent(__VLS_138, new __VLS_138({
    modelValue: (__VLS_ctx.form.description),
    type: "textarea",
    rows: (4),
}));
const __VLS_140 = __VLS_139({
    modelValue: (__VLS_ctx.form.description),
    type: "textarea",
    rows: (4),
}, ...__VLS_functionalComponentArgsRest(__VLS_139));
var __VLS_137;
var __VLS_87;
{
    const { footer: __VLS_thisSlot } = __VLS_79.slots;
    const __VLS_142 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_143 = __VLS_asFunctionalComponent(__VLS_142, new __VLS_142({
        ...{ 'onClick': {} },
    }));
    const __VLS_144 = __VLS_143({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_143));
    let __VLS_146;
    let __VLS_147;
    let __VLS_148;
    const __VLS_149 = {
        onClick: (...[$event]) => {
            __VLS_ctx.editorOpen = false;
        }
    };
    __VLS_145.slots.default;
    var __VLS_145;
    const __VLS_150 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_151 = __VLS_asFunctionalComponent(__VLS_150, new __VLS_150({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.dialogLoading),
    }));
    const __VLS_152 = __VLS_151({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.dialogLoading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_151));
    let __VLS_154;
    let __VLS_155;
    let __VLS_156;
    const __VLS_157 = {
        onClick: (__VLS_ctx.submit)
    };
    __VLS_153.slots.default;
    var __VLS_153;
}
var __VLS_79;
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
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
// @ts-ignore
var __VLS_89 = __VLS_88;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ElForm: ElForm,
            categories: categories,
            loading: loading,
            forbidden: forbidden,
            error: error,
            activeCategory: activeCategory,
            keyword: keyword,
            editorOpen: editorOpen,
            dialogLoading: dialogLoading,
            formRef: formRef,
            form: form,
            isEdit: isEdit,
            resetForm: resetForm,
            openCreate: openCreate,
            openEdit: openEdit,
            filteredItems: filteredItems,
            fetchProducts: fetchProducts,
            submit: submit,
            remove: remove,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=AdminProducts.vue.js.map