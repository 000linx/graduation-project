/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import axios from 'axios';
const router = useRouter();
const route = useRoute();
const formRef = ref();
const loading = ref(false);
const form = reactive({
    phone: '',
    password: ''
});
const rules = {
    phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        {
            validator: (_rule, value, callback) => {
                const v = String(value || '').trim();
                if (!/^1\d{10}$/.test(v))
                    callback(new Error('请输入 11 位手机号'));
                else
                    callback();
            },
            trigger: 'blur'
        }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码至少 6 位', trigger: 'blur' }
    ]
};
const redirectTo = computed(() => {
    const q = route.query.redirect;
    return typeof q === 'string' && q.length > 0 ? q : '/profile';
});
async function submit() {
    const inst = formRef.value;
    if (!inst)
        return;
    const ok = await inst.validate().catch(() => false);
    if (!ok)
        return;
    loading.value = true;
    try {
        const resp = await axios.post('/api/user/login', {
            phone: form.phone.trim(),
            password: form.password
        });
        const tokens = resp?.data?.data?.tokens;
        const accessToken = tokens?.access_token;
        const refreshToken = tokens?.refresh_token;
        if (!accessToken) {
            ElMessage.error('登录失败：未获取到令牌');
            return;
        }
        localStorage.setItem('access_token', String(accessToken));
        if (refreshToken)
            localStorage.setItem('refresh_token', String(refreshToken));
        ElMessage.success('登录成功');
        await router.replace(redirectTo.value);
    }
    catch (e) {
        const msg = e?.response?.data?.message || e?.message || '登录失败';
        ElMessage.error(String(msg));
    }
    finally {
        loading.value = false;
    }
}
function goRegister() {
    const q = route.query.redirect;
    router.push({ path: '/register', query: typeof q === 'string' && q.length > 0 ? { redirect: q } : {} });
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ref: "formRef",
    model: (__VLS_ctx.form),
    rules: (__VLS_ctx.rules),
    ...{ class: "mt-8" },
    labelPosition: "top",
    statusIcon: true,
}));
const __VLS_2 = __VLS_1({
    ref: "formRef",
    model: (__VLS_ctx.form),
    rules: (__VLS_ctx.rules),
    ...{ class: "mt-8" },
    labelPosition: "top",
    statusIcon: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {typeof __VLS_ctx.formRef} */ ;
var __VLS_4 = {};
__VLS_3.slots.default;
const __VLS_6 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({
    label: "手机号",
    prop: "phone",
}));
const __VLS_8 = __VLS_7({
    label: "手机号",
    prop: "phone",
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
__VLS_9.slots.default;
const __VLS_10 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent(__VLS_10, new __VLS_10({
    modelValue: (__VLS_ctx.form.phone),
    placeholder: "请输入 11 位手机号",
    inputmode: "numeric",
    autocomplete: "tel",
}));
const __VLS_12 = __VLS_11({
    modelValue: (__VLS_ctx.form.phone),
    placeholder: "请输入 11 位手机号",
    inputmode: "numeric",
    autocomplete: "tel",
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
var __VLS_9;
const __VLS_14 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_15 = __VLS_asFunctionalComponent(__VLS_14, new __VLS_14({
    label: "密码",
    prop: "password",
}));
const __VLS_16 = __VLS_15({
    label: "密码",
    prop: "password",
}, ...__VLS_functionalComponentArgsRest(__VLS_15));
__VLS_17.slots.default;
const __VLS_18 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_19 = __VLS_asFunctionalComponent(__VLS_18, new __VLS_18({
    modelValue: (__VLS_ctx.form.password),
    type: "password",
    showPassword: true,
    placeholder: "请输入密码",
    autocomplete: "current-password",
}));
const __VLS_20 = __VLS_19({
    modelValue: (__VLS_ctx.form.password),
    type: "password",
    showPassword: true,
    placeholder: "请输入密码",
    autocomplete: "current-password",
}, ...__VLS_functionalComponentArgsRest(__VLS_19));
var __VLS_17;
const __VLS_22 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_23 = __VLS_asFunctionalComponent(__VLS_22, new __VLS_22({}));
const __VLS_24 = __VLS_23({}, ...__VLS_functionalComponentArgsRest(__VLS_23));
__VLS_25.slots.default;
const __VLS_26 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
    ...{ 'onClick': {} },
    type: "primary",
    ...{ class: "w-full" },
    loading: (__VLS_ctx.loading),
}));
const __VLS_28 = __VLS_27({
    ...{ 'onClick': {} },
    type: "primary",
    ...{ class: "w-full" },
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_27));
let __VLS_30;
let __VLS_31;
let __VLS_32;
const __VLS_33 = {
    onClick: (__VLS_ctx.submit)
};
__VLS_29.slots.default;
var __VLS_29;
var __VLS_25;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center justify-center mt-1" },
});
const __VLS_34 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_35 = __VLS_asFunctionalComponent(__VLS_34, new __VLS_34({
    ...{ 'onClick': {} },
    text: true,
    ...{ class: "text-xs" },
}));
const __VLS_36 = __VLS_35({
    ...{ 'onClick': {} },
    text: true,
    ...{ class: "text-xs" },
}, ...__VLS_functionalComponentArgsRest(__VLS_35));
let __VLS_38;
let __VLS_39;
let __VLS_40;
const __VLS_41 = {
    onClick: (__VLS_ctx.goRegister)
};
__VLS_37.slots.default;
var __VLS_37;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-xs text-gray-500 leading-relaxed text-center mt-2" },
});
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['leading-relaxed']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
// @ts-ignore
var __VLS_5 = __VLS_4;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            formRef: formRef,
            loading: loading,
            form: form,
            rules: rules,
            submit: submit,
            goRegister: goRegister,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=UserLogin.vue.js.map