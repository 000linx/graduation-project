/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, onMounted, ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import http, { unwrap } from '../../api/http';
const loading = ref(false);
const forbidden = ref(false);
const error = ref(null);
const users = ref([]);
const keyword = ref('');
const detailOpen = ref(false);
const activeUser = ref(null);
const filteredUsers = computed(() => {
    const k = keyword.value.trim().toLowerCase();
    if (!k)
        return users.value;
    return users.value.filter((u) => {
        const s = `${u.username ?? ''} ${u.phone ?? ''} ${u._id ?? ''}`.toLowerCase();
        return s.includes(k);
    });
});
async function fetchUsers() {
    loading.value = true;
    forbidden.value = false;
    error.value = null;
    try {
        const resp = await http.get('/api/admin/users');
        const data = unwrap(resp);
        users.value = Array.isArray(data?.users) ? data.users : [];
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
async function toggleRole(row) {
    const nextRole = row.role === 'admin' ? 'user' : 'admin';
    const ok = await ElMessageBox.confirm(`确认将用户 ${row.phone || row.username || row._id} 设置为 ${nextRole === 'admin' ? '管理员' : '普通用户'}？`, '确认操作', { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' }).then(() => true, () => false);
    if (!ok)
        return;
    await http.put(`/api/admin/users/${row._id}/role`, { role: nextRole });
    row.role = nextRole;
}
function openDetail(row) {
    activeUser.value = row;
    detailOpen.value = true;
}
onMounted(fetchUsers);
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
    ...{ class: "flex items-center gap-3" },
});
const __VLS_0 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.keyword),
    placeholder: "搜索用户名/手机号/ID",
    ...{ style: {} },
    clearable: true,
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.keyword),
    placeholder: "搜索用户名/手机号/ID",
    ...{ style: {} },
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const __VLS_4 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.loading),
}));
const __VLS_6 = __VLS_5({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
let __VLS_8;
let __VLS_9;
let __VLS_10;
const __VLS_11 = {
    onClick: (__VLS_ctx.fetchUsers)
};
__VLS_7.slots.default;
var __VLS_7;
if (__VLS_ctx.forbidden) {
    const __VLS_12 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        type: "error",
        showIcon: true,
        title: "无权限",
        description: "当前账号不是管理员，无法访问用户管理。",
    }));
    const __VLS_14 = __VLS_13({
        type: "error",
        showIcon: true,
        title: "无权限",
        description: "当前账号不是管理员，无法访问用户管理。",
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
}
else if (__VLS_ctx.error) {
    const __VLS_16 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.error),
    }));
    const __VLS_18 = __VLS_17({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.error),
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
}
const __VLS_20 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    data: (__VLS_ctx.filteredUsers),
    stripe: true,
    size: "small",
    ...{ class: "bg-white rounded-2xl border" },
}));
const __VLS_22 = __VLS_21({
    data: (__VLS_ctx.filteredUsers),
    stripe: true,
    size: "small",
    ...{ class: "bg-white rounded-2xl border" },
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.loading) }, null, null);
__VLS_23.slots.default;
const __VLS_24 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    prop: "username",
    label: "用户名",
    minWidth: "140",
    showOverflowTooltip: true,
}));
const __VLS_26 = __VLS_25({
    prop: "username",
    label: "用户名",
    minWidth: "140",
    showOverflowTooltip: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
const __VLS_28 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    prop: "phone",
    label: "手机号",
    minWidth: "180",
    showOverflowTooltip: true,
}));
const __VLS_30 = __VLS_29({
    prop: "phone",
    label: "手机号",
    minWidth: "180",
    showOverflowTooltip: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
const __VLS_32 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    label: "角色",
    width: "120",
}));
const __VLS_34 = __VLS_33({
    label: "角色",
    width: "120",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_35.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_36 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        type: (row.role === 'admin' ? 'danger' : 'info'),
    }));
    const __VLS_38 = __VLS_37({
        type: (row.role === 'admin' ? 'danger' : 'info'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    __VLS_39.slots.default;
    (row.role === 'admin' ? '管理员' : '用户');
    var __VLS_39;
}
var __VLS_35;
const __VLS_40 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    label: "操作",
    width: "160",
    fixed: "right",
}));
const __VLS_42 = __VLS_41({
    label: "操作",
    width: "160",
    fixed: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_43.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_44 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        ...{ 'onClick': {} },
        type: "primary",
        link: true,
    }));
    const __VLS_46 = __VLS_45({
        ...{ 'onClick': {} },
        type: "primary",
        link: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    let __VLS_48;
    let __VLS_49;
    let __VLS_50;
    const __VLS_51 = {
        onClick: (...[$event]) => {
            __VLS_ctx.openDetail(row);
        }
    };
    __VLS_47.slots.default;
    var __VLS_47;
    const __VLS_52 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        ...{ 'onClick': {} },
        type: "primary",
        link: true,
    }));
    const __VLS_54 = __VLS_53({
        ...{ 'onClick': {} },
        type: "primary",
        link: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    let __VLS_56;
    let __VLS_57;
    let __VLS_58;
    const __VLS_59 = {
        onClick: (...[$event]) => {
            __VLS_ctx.toggleRole(row);
        }
    };
    __VLS_55.slots.default;
    (row.role === 'admin' ? '设为用户' : '设为管理员');
    var __VLS_55;
}
var __VLS_43;
var __VLS_23;
const __VLS_60 = {}.ElDrawer;
/** @type {[typeof __VLS_components.ElDrawer, typeof __VLS_components.elDrawer, typeof __VLS_components.ElDrawer, typeof __VLS_components.elDrawer, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    modelValue: (__VLS_ctx.detailOpen),
    title: "用户详情",
    size: "420px",
}));
const __VLS_62 = __VLS_61({
    modelValue: (__VLS_ctx.detailOpen),
    title: "用户详情",
    size: "420px",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
__VLS_63.slots.default;
if (__VLS_ctx.activeUser) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-4" },
    });
    const __VLS_64 = {}.ElDescriptions;
    /** @type {[typeof __VLS_components.ElDescriptions, typeof __VLS_components.elDescriptions, typeof __VLS_components.ElDescriptions, typeof __VLS_components.elDescriptions, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        column: (1),
        border: true,
    }));
    const __VLS_66 = __VLS_65({
        column: (1),
        border: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    __VLS_67.slots.default;
    const __VLS_68 = {}.ElDescriptionsItem;
    /** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
        label: "用户ID",
    }));
    const __VLS_70 = __VLS_69({
        label: "用户ID",
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    __VLS_71.slots.default;
    (__VLS_ctx.activeUser._id);
    var __VLS_71;
    const __VLS_72 = {}.ElDescriptionsItem;
    /** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
        label: "用户名",
    }));
    const __VLS_74 = __VLS_73({
        label: "用户名",
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    __VLS_75.slots.default;
    (__VLS_ctx.activeUser.username || '-');
    var __VLS_75;
    const __VLS_76 = {}.ElDescriptionsItem;
    /** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
        label: "手机号",
    }));
    const __VLS_78 = __VLS_77({
        label: "手机号",
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    __VLS_79.slots.default;
    (__VLS_ctx.activeUser.phone || '-');
    var __VLS_79;
    const __VLS_80 = {}.ElDescriptionsItem;
    /** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
        label: "角色",
    }));
    const __VLS_82 = __VLS_81({
        label: "角色",
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
    __VLS_83.slots.default;
    (__VLS_ctx.activeUser.role === 'admin' ? '管理员' : '用户');
    var __VLS_83;
    const __VLS_84 = {}.ElDescriptionsItem;
    /** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        label: "创建时间",
    }));
    const __VLS_86 = __VLS_85({
        label: "创建时间",
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    __VLS_87.slots.default;
    (__VLS_ctx.activeUser.created_at || '-');
    var __VLS_87;
    var __VLS_67;
}
var __VLS_63;
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
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            loading: loading,
            forbidden: forbidden,
            error: error,
            keyword: keyword,
            detailOpen: detailOpen,
            activeUser: activeUser,
            filteredUsers: filteredUsers,
            fetchUsers: fetchUsers,
            toggleRole: toggleRole,
            openDetail: openDetail,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=AdminUsers.vue.js.map