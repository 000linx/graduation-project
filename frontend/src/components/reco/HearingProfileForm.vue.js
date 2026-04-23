/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, onMounted, ref } from 'vue';
import { notify } from '../../utils/notify';
import { useRecoStore } from '../../stores/reco';
const emit = defineEmits();
const reco = useRecoStore();
const saving = ref(false);
const loadingAccount = ref(false);
const hasToken = computed(() => Boolean(localStorage.getItem('access_token')));
const sceneOptions = ['日常交流', '看电视', '电话', '会议', '课堂', '户外'];
const budget = computed({
    get: () => [reco.profile.budget_min ?? 0, reco.profile.budget_max ?? 8000],
    set: (v) => {
        const a = Array.isArray(v) ? v : [0, 8000];
        const min = Number(a[0] ?? 0);
        const max = Number(a[1] ?? 8000);
        reco.profile.budget_min = Math.min(min, max);
        reco.profile.budget_max = Math.max(min, max);
    }
});
const brandOptions = computed(() => {
    const set = new Set(reco.profile.brands.map((x) => String(x).trim()).filter(Boolean));
    return Array.from(set);
});
async function saveToAccount() {
    if (!hasToken.value) {
        notify('登录后才可保存到账号', { tone: 'warning', flash: true });
        return;
    }
    saving.value = true;
    try {
        await reco.saveProfileToAccount();
        notify('已保存到账号', { tone: 'success' });
    }
    catch (e) {
        notify(e?.response?.data?.message || e?.message || '保存失败', { tone: 'error', flash: true });
    }
    finally {
        saving.value = false;
    }
}
async function loadFromAccount() {
    if (!hasToken.value) {
        notify('登录后才可从账号同步', { tone: 'warning', flash: true });
        return;
    }
    loadingAccount.value = true;
    try {
        await reco.loadProfileFromAccount();
        notify('已从账号同步偏好', { tone: 'success' });
    }
    catch {
    }
    finally {
        loadingAccount.value = false;
    }
}
function resetPrefs(keepLevel = true) {
    const level = reco.profile.hearing_level;
    reco.profile.hearing_level = keepLevel ? level : '';
    reco.profile.scenes = [];
    reco.profile.budget_min = null;
    reco.profile.budget_max = null;
    reco.profile.brands = [];
    reco.persistProfile();
}
async function recommendNow() {
    if (!reco.profile.hearing_level) {
        notify('请先选择听力损失等级', { tone: 'warning', flash: true });
        return;
    }
    emit('recommended');
}
onMounted(() => {
    reco.init();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-xl font-extrabold text-[var(--c-text)]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-sm font-bold text-[var(--c-muted)]" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-base font-bold text-[var(--c-text)]" },
});
const __VLS_0 = {}.ElRadioGroup;
/** @type {[typeof __VLS_components.ElRadioGroup, typeof __VLS_components.elRadioGroup, typeof __VLS_components.ElRadioGroup, typeof __VLS_components.elRadioGroup, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.reco.profile.hearing_level),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.reco.profile.hearing_level),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onChange: (...[$event]) => {
        __VLS_ctx.reco.persistProfile();
    }
};
__VLS_3.slots.default;
const __VLS_8 = {}.ElRadioButton;
/** @type {[typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    label: "轻度",
}));
const __VLS_10 = __VLS_9({
    label: "轻度",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
var __VLS_11;
const __VLS_12 = {}.ElRadioButton;
/** @type {[typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    label: "中度",
}));
const __VLS_14 = __VLS_13({
    label: "中度",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
var __VLS_15;
const __VLS_16 = {}.ElRadioButton;
/** @type {[typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    label: "重度",
}));
const __VLS_18 = __VLS_17({
    label: "重度",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
var __VLS_19;
const __VLS_20 = {}.ElRadioButton;
/** @type {[typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    label: "极重度",
}));
const __VLS_22 = __VLS_21({
    label: "极重度",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
var __VLS_23;
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-base font-bold text-[var(--c-text)]" },
});
const __VLS_24 = {}.ElCheckboxGroup;
/** @type {[typeof __VLS_components.ElCheckboxGroup, typeof __VLS_components.elCheckboxGroup, typeof __VLS_components.ElCheckboxGroup, typeof __VLS_components.elCheckboxGroup, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.reco.profile.scenes),
}));
const __VLS_26 = __VLS_25({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.reco.profile.scenes),
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_28;
let __VLS_29;
let __VLS_30;
const __VLS_31 = {
    onChange: (...[$event]) => {
        __VLS_ctx.reco.persistProfile();
    }
};
__VLS_27.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-2 gap-2" },
});
for (const [s] of __VLS_getVForSourceType((__VLS_ctx.sceneOptions))) {
    const __VLS_32 = {}.ElCheckboxButton;
    /** @type {[typeof __VLS_components.ElCheckboxButton, typeof __VLS_components.elCheckboxButton, typeof __VLS_components.ElCheckboxButton, typeof __VLS_components.elCheckboxButton, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        key: (s),
        label: (s),
    }));
    const __VLS_34 = __VLS_33({
        key: (s),
        label: (s),
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_35.slots.default;
    (s);
    var __VLS_35;
}
var __VLS_27;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-base font-bold text-[var(--c-text)]" },
});
const __VLS_36 = {}.ElSlider;
/** @type {[typeof __VLS_components.ElSlider, typeof __VLS_components.elSlider, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.budget),
    range: true,
    min: (0),
    max: (20000),
    step: (100),
}));
const __VLS_38 = __VLS_37({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.budget),
    range: true,
    min: (0),
    max: (20000),
    step: (100),
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
let __VLS_40;
let __VLS_41;
let __VLS_42;
const __VLS_43 = {
    onChange: (...[$event]) => {
        __VLS_ctx.reco.persistProfile();
    }
};
var __VLS_39;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-2" },
});
const __VLS_44 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.reco.profile.budget_min),
    min: (0),
    max: (20000),
    step: (100),
}));
const __VLS_46 = __VLS_45({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.reco.profile.budget_min),
    min: (0),
    max: (20000),
    step: (100),
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
let __VLS_48;
let __VLS_49;
let __VLS_50;
const __VLS_51 = {
    onChange: (...[$event]) => {
        __VLS_ctx.reco.persistProfile();
    }
};
var __VLS_47;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-sm font-bold text-[var(--c-muted)]" },
});
const __VLS_52 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.reco.profile.budget_max),
    min: (0),
    max: (20000),
    step: (100),
}));
const __VLS_54 = __VLS_53({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.reco.profile.budget_max),
    min: (0),
    max: (20000),
    step: (100),
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
let __VLS_56;
let __VLS_57;
let __VLS_58;
const __VLS_59 = {
    onChange: (...[$event]) => {
        __VLS_ctx.reco.persistProfile();
    }
};
var __VLS_55;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-base font-bold text-[var(--c-text)]" },
});
const __VLS_60 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.reco.profile.brands),
    multiple: true,
    filterable: true,
    allowCreate: true,
    defaultFirstOption: true,
    placeholder: "输入品牌后回车添加",
    ...{ style: {} },
}));
const __VLS_62 = __VLS_61({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.reco.profile.brands),
    multiple: true,
    filterable: true,
    allowCreate: true,
    defaultFirstOption: true,
    placeholder: "输入品牌后回车添加",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
let __VLS_64;
let __VLS_65;
let __VLS_66;
const __VLS_67 = {
    onChange: (...[$event]) => {
        __VLS_ctx.reco.persistProfile();
    }
};
__VLS_63.slots.default;
for (const [b] of __VLS_getVForSourceType((__VLS_ctx.brandOptions))) {
    const __VLS_68 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
        key: (b),
        label: (b),
        value: (b),
    }));
    const __VLS_70 = __VLS_69({
        key: (b),
        label: (b),
        value: (b),
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
}
var __VLS_63;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-wrap items-center gap-3 pt-2" },
});
const __VLS_72 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    ...{ 'onClick': {} },
    type: "primary",
    ...{ class: "a11y-hit" },
    disabled: (!__VLS_ctx.reco.profile.hearing_level),
}));
const __VLS_74 = __VLS_73({
    ...{ 'onClick': {} },
    type: "primary",
    ...{ class: "a11y-hit" },
    disabled: (!__VLS_ctx.reco.profile.hearing_level),
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
let __VLS_76;
let __VLS_77;
let __VLS_78;
const __VLS_79 = {
    onClick: (__VLS_ctx.recommendNow)
};
__VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
__VLS_75.slots.default;
var __VLS_75;
const __VLS_80 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    ...{ 'onClick': {} },
    ...{ class: "a11y-hit" },
    loading: (__VLS_ctx.saving),
    disabled: (!__VLS_ctx.reco.profile.hearing_level || !__VLS_ctx.hasToken),
}));
const __VLS_82 = __VLS_81({
    ...{ 'onClick': {} },
    ...{ class: "a11y-hit" },
    loading: (__VLS_ctx.saving),
    disabled: (!__VLS_ctx.reco.profile.hearing_level || !__VLS_ctx.hasToken),
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
let __VLS_84;
let __VLS_85;
let __VLS_86;
const __VLS_87 = {
    onClick: (__VLS_ctx.saveToAccount)
};
__VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
__VLS_83.slots.default;
var __VLS_83;
const __VLS_88 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
    ...{ 'onClick': {} },
    ...{ class: "a11y-hit" },
    loading: (__VLS_ctx.loadingAccount),
    disabled: (!__VLS_ctx.hasToken),
}));
const __VLS_90 = __VLS_89({
    ...{ 'onClick': {} },
    ...{ class: "a11y-hit" },
    loading: (__VLS_ctx.loadingAccount),
    disabled: (!__VLS_ctx.hasToken),
}, ...__VLS_functionalComponentArgsRest(__VLS_89));
let __VLS_92;
let __VLS_93;
let __VLS_94;
const __VLS_95 = {
    onClick: (__VLS_ctx.loadFromAccount)
};
__VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
__VLS_91.slots.default;
var __VLS_91;
const __VLS_96 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
    ...{ 'onClick': {} },
    ...{ class: "a11y-hit" },
}));
const __VLS_98 = __VLS_97({
    ...{ 'onClick': {} },
    ...{ class: "a11y-hit" },
}, ...__VLS_functionalComponentArgsRest(__VLS_97));
let __VLS_100;
let __VLS_101;
let __VLS_102;
const __VLS_103 = {
    onClick: (...[$event]) => {
        __VLS_ctx.resetPrefs(true);
    }
};
__VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
__VLS_99.slots.default;
var __VLS_99;
const __VLS_104 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
    ...{ 'onClick': {} },
    ...{ class: "a11y-hit" },
}));
const __VLS_106 = __VLS_105({
    ...{ 'onClick': {} },
    ...{ class: "a11y-hit" },
}, ...__VLS_functionalComponentArgsRest(__VLS_105));
let __VLS_108;
let __VLS_109;
let __VLS_110;
const __VLS_111 = {
    onClick: (...[$event]) => {
        __VLS_ctx.resetPrefs(false);
    }
};
__VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
__VLS_107.slots.default;
var __VLS_107;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-muted)]']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-muted)]']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[var(--c-text)]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            reco: reco,
            saving: saving,
            loadingAccount: loadingAccount,
            hasToken: hasToken,
            sceneOptions: sceneOptions,
            budget: budget,
            brandOptions: brandOptions,
            saveToAccount: saveToAccount,
            loadFromAccount: loadFromAccount,
            resetPrefs: resetPrefs,
            recommendNow: recommendNow,
        };
    },
    __typeEmits: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=HearingProfileForm.vue.js.map