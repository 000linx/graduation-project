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
    username: '',
    phone: '',
    password: '',
    confirm_password: ''
});
const rules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }, { min: 2, message: '用户名至少 2 个字符', trigger: 'blur' }],
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
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少 6 位', trigger: 'blur' }],
    confirm_password: [
        { required: true, message: '请再次输入密码', trigger: 'blur' },
        {
            validator: (_rule, value, callback) => {
                if (String(value || '') !== String(form.password || ''))
                    callback(new Error('两次输入的密码不一致'));
                else
                    callback();
            },
            trigger: 'blur'
        }
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
        const payload = {
            username: form.username.trim(),
            phone: form.phone.trim(),
            password: form.password
        };
        const reg = await axios.post('/api/user/register', payload);
        if (reg?.status !== 201 && reg?.data?.code !== 201) {
            ElMessage.error(reg?.data?.message || '注册失败');
            return;
        }
        const login = await axios.post('/api/user/login', { phone: payload.phone, password: payload.password });
        const tokens = login?.data?.data?.tokens;
        const accessToken = tokens?.access_token;
        const refreshToken = tokens?.refresh_token;
        if (!accessToken) {
            ElMessage.error('注册成功，但自动登录失败');
            await router.replace('/login');
            return;
        }
        localStorage.setItem('access_token', String(accessToken));
        if (refreshToken)
            localStorage.setItem('refresh_token', String(refreshToken));
        ElMessage.success('注册成功');
        await router.replace(redirectTo.value);
    }
    catch (e) {
        const msg = e?.response?.data?.message || e?.message || '注册失败';
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
    label: "用户名",
    prop: "username",
}));
const __VLS_8 = __VLS_7({
    label: "用户名",
    prop: "username",
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
__VLS_9.slots.default;
const __VLS_10 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent(__VLS_10, new __VLS_10({
    modelValue: (__VLS_ctx.form.username),
    placeholder: "请输入用户名",
    autocomplete: "username",
}));
const __VLS_12 = __VLS_11({
    modelValue: (__VLS_ctx.form.username),
    placeholder: "请输入用户名",
    autocomplete: "username",
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
var __VLS_9;
const __VLS_14 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_15 = __VLS_asFunctionalComponent(__VLS_14, new __VLS_14({
    label: "手机号",
    prop: "phone",
}));
const __VLS_16 = __VLS_15({
    label: "手机号",
    prop: "phone",
}, ...__VLS_functionalComponentArgsRest(__VLS_15));
__VLS_17.slots.default;
const __VLS_18 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_19 = __VLS_asFunctionalComponent(__VLS_18, new __VLS_18({
    modelValue: (__VLS_ctx.form.phone),
    placeholder: "请输入 11 位手机号",
    inputmode: "numeric",
    autocomplete: "tel",
}));
const __VLS_20 = __VLS_19({
    modelValue: (__VLS_ctx.form.phone),
    placeholder: "请输入 11 位手机号",
    inputmode: "numeric",
    autocomplete: "tel",
}, ...__VLS_functionalComponentArgsRest(__VLS_19));
var __VLS_17;
const __VLS_22 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_23 = __VLS_asFunctionalComponent(__VLS_22, new __VLS_22({
    label: "密码",
    prop: "password",
}));
const __VLS_24 = __VLS_23({
    label: "密码",
    prop: "password",
}, ...__VLS_functionalComponentArgsRest(__VLS_23));
__VLS_25.slots.default;
const __VLS_26 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
    modelValue: (__VLS_ctx.form.password),
    type: "password",
    showPassword: true,
    placeholder: "请输入密码",
    autocomplete: "new-password",
}));
const __VLS_28 = __VLS_27({
    modelValue: (__VLS_ctx.form.password),
    type: "password",
    showPassword: true,
    placeholder: "请输入密码",
    autocomplete: "new-password",
}, ...__VLS_functionalComponentArgsRest(__VLS_27));
var __VLS_25;
const __VLS_30 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_31 = __VLS_asFunctionalComponent(__VLS_30, new __VLS_30({
    label: "确认密码",
    prop: "confirm_password",
}));
const __VLS_32 = __VLS_31({
    label: "确认密码",
    prop: "confirm_password",
}, ...__VLS_functionalComponentArgsRest(__VLS_31));
__VLS_33.slots.default;
const __VLS_34 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_35 = __VLS_asFunctionalComponent(__VLS_34, new __VLS_34({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.confirm_password),
    type: "password",
    showPassword: true,
    placeholder: "请再次输入密码",
    autocomplete: "new-password",
}));
const __VLS_36 = __VLS_35({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.confirm_password),
    type: "password",
    showPassword: true,
    placeholder: "请再次输入密码",
    autocomplete: "new-password",
}, ...__VLS_functionalComponentArgsRest(__VLS_35));
let __VLS_38;
let __VLS_39;
let __VLS_40;
const __VLS_41 = {
    onKeyup: (__VLS_ctx.submit)
};
var __VLS_37;
var __VLS_33;
const __VLS_42 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_43 = __VLS_asFunctionalComponent(__VLS_42, new __VLS_42({
    ...{ class: "mt-2" },
}));
const __VLS_44 = __VLS_43({
    ...{ class: "mt-2" },
}, ...__VLS_functionalComponentArgsRest(__VLS_43));
__VLS_45.slots.default;
const __VLS_46 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_47 = __VLS_asFunctionalComponent(__VLS_46, new __VLS_46({
    ...{ 'onClick': {} },
    type: "primary",
    ...{ class: "w-full" },
    loading: (__VLS_ctx.loading),
}));
const __VLS_48 = __VLS_47({
    ...{ 'onClick': {} },
    type: "primary",
    ...{ class: "w-full" },
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_47));
let __VLS_50;
let __VLS_51;
let __VLS_52;
const __VLS_53 = {
    onClick: (__VLS_ctx.submit)
};
__VLS_49.slots.default;
var __VLS_49;
var __VLS_45;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
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
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=UserRegister.vue.js.map