/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAdminAuthStore } from '../../stores/adminAuth';
const router = useRouter();
const auth = useAdminAuthStore();
const formRef = ref();
const loading = ref(false);
const form = reactive({
    phone: '',
    password: '',
    captcha: ''
});
const captchaCode = ref('ABCD');
const refreshCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 4; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    captchaCode.value = res;
};
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
    ],
    captcha: [
        { required: true, message: '请输入验证码', trigger: 'blur' },
        {
            validator: (_rule, value, callback) => {
                if (value.toUpperCase() !== captchaCode.value) {
                    callback(new Error('验证码错误'));
                }
                else {
                    callback();
                }
            },
            trigger: 'blur'
        }
    ]
};
async function submit() {
    const inst = formRef.value;
    if (!inst)
        return;
    const ok = await inst.validate().catch(() => false);
    if (!ok)
        return;
    loading.value = true;
    try {
        await auth.login(form.phone.trim(), form.password);
        // We should also set regular access token so the backend recognizes us for regular APIs if needed
        const at = localStorage.getItem('admin_access_token');
        const rt = localStorage.getItem('admin_refresh_token');
        if (at)
            localStorage.setItem('access_token', at);
        if (rt)
            localStorage.setItem('refresh_token', rt);
        try {
            window.dispatchEvent(new Event('auth:admin_login'));
        }
        catch {
        }
        ElMessage.success('管理员登录成功');
        await router.replace('/admin');
    }
    catch (e) {
        const msg = e?.response?.data?.message || e?.message || '管理员登录失败';
        ElMessage.error(String(msg));
    }
    finally {
        loading.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ref: "formRef",
    model: (__VLS_ctx.form),
    rules: (__VLS_ctx.rules),
    ...{ class: "mt-8 admin-login-form" },
    labelPosition: "top",
    statusIcon: true,
}));
const __VLS_2 = __VLS_1({
    ref: "formRef",
    model: (__VLS_ctx.form),
    rules: (__VLS_ctx.rules),
    ...{ class: "mt-8 admin-login-form" },
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
    label: "管理员账号 (手机号)",
    prop: "phone",
}));
const __VLS_8 = __VLS_7({
    label: "管理员账号 (手机号)",
    prop: "phone",
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
__VLS_9.slots.default;
const __VLS_10 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent(__VLS_10, new __VLS_10({
    modelValue: (__VLS_ctx.form.phone),
    placeholder: "请输入管理员手机号",
    inputmode: "numeric",
    autocomplete: "tel",
}));
const __VLS_12 = __VLS_11({
    modelValue: (__VLS_ctx.form.phone),
    placeholder: "请输入管理员手机号",
    inputmode: "numeric",
    autocomplete: "tel",
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
var __VLS_9;
const __VLS_14 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_15 = __VLS_asFunctionalComponent(__VLS_14, new __VLS_14({
    label: "管理员密码",
    prop: "password",
}));
const __VLS_16 = __VLS_15({
    label: "管理员密码",
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
    placeholder: "请输入管理员密码",
    autocomplete: "current-password",
}));
const __VLS_20 = __VLS_19({
    modelValue: (__VLS_ctx.form.password),
    type: "password",
    showPassword: true,
    placeholder: "请输入管理员密码",
    autocomplete: "current-password",
}, ...__VLS_functionalComponentArgsRest(__VLS_19));
var __VLS_17;
const __VLS_22 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_23 = __VLS_asFunctionalComponent(__VLS_22, new __VLS_22({
    label: "验证码",
    prop: "captcha",
}));
const __VLS_24 = __VLS_23({
    label: "验证码",
    prop: "captcha",
}, ...__VLS_functionalComponentArgsRest(__VLS_23));
__VLS_25.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center w-full gap-3" },
});
const __VLS_26 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.captcha),
    placeholder: "请输入验证码",
    ...{ class: "flex-1" },
}));
const __VLS_28 = __VLS_27({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.captcha),
    placeholder: "请输入验证码",
    ...{ class: "flex-1" },
}, ...__VLS_functionalComponentArgsRest(__VLS_27));
let __VLS_30;
let __VLS_31;
let __VLS_32;
const __VLS_33 = {
    onKeyup: (__VLS_ctx.submit)
};
var __VLS_29;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.refreshCaptcha) },
    ...{ class: "h-10 px-4 bg-gray-100 border border-gray-200 rounded flex items-center justify-center cursor-pointer select-none tracking-widest font-bold text-gray-700 text-lg relative overflow-hidden group" },
    title: "点击刷新验证码",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "relative z-10" },
});
(__VLS_ctx.captchaCode);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiAvPgo8cGF0aCBkPSJNMCAwTDIgMloiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiAvPgo8L3N2Zz4=')]" },
});
var __VLS_25;
const __VLS_34 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_35 = __VLS_asFunctionalComponent(__VLS_34, new __VLS_34({
    ...{ class: "mt-6" },
}));
const __VLS_36 = __VLS_35({
    ...{ class: "mt-6" },
}, ...__VLS_functionalComponentArgsRest(__VLS_35));
__VLS_37.slots.default;
const __VLS_38 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_39 = __VLS_asFunctionalComponent(__VLS_38, new __VLS_38({
    ...{ 'onClick': {} },
    type: "primary",
    ...{ class: "w-full !bg-gray-800 !border-gray-800 hover:!bg-gray-700" },
    loading: (__VLS_ctx.loading),
}));
const __VLS_40 = __VLS_39({
    ...{ 'onClick': {} },
    type: "primary",
    ...{ class: "w-full !bg-gray-800 !border-gray-800 hover:!bg-gray-700" },
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_39));
let __VLS_42;
let __VLS_43;
let __VLS_44;
const __VLS_45 = {
    onClick: (__VLS_ctx.submit)
};
__VLS_41.slots.default;
var __VLS_41;
var __VLS_37;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-login-form']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['select-none']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-widest']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['group']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-20']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-[url(\'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiAvPgo8cGF0aCBkPSJNMCAwTDIgMloiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiAvPgo8L3N2Zz4=\')]']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['!bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['!border-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:!bg-gray-700']} */ ;
// @ts-ignore
var __VLS_5 = __VLS_4;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            formRef: formRef,
            loading: loading,
            form: form,
            captchaCode: captchaCode,
            refreshCaptcha: refreshCaptcha,
            rules: rules,
            submit: submit,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=AdminLogin.vue.js.map