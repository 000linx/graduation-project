/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import http, { unwrap } from '../api/http';
const router = useRouter();
const activeTab = ref('orders');
const hasToken = ref(false);
const logoutLoading = ref(false);
const profile = reactive({ username: '', phone: '' });
const orderStatus = ref('');
const ordersLoading = ref(false);
const ordersError = ref(null);
const orders = ref([]);
const detailOpen = ref(false);
const detailLoading = ref(false);
const detailError = ref(null);
const orderDetail = ref(null);
const payOpen = ref(false);
const payLoading = ref(false);
const payOrderId = ref(null);
const payMethod = ref('');
const reviewOpen = ref(false);
const reviewLoading = ref(false);
const reviewOrderId = ref(null);
const reviewForm = reactive({ rating: 5, content: '' });
const afterSaleOpen = ref(false);
const afterSaleLoading = ref(false);
const afterSaleOrderId = ref(null);
const afterSaleForm = reactive({ type: '', reason: '' });
const pwdFormRef = ref();
const pwdSubmitting = ref(false);
const pwdForm = reactive({
    old_password: '',
    new_password: '',
    confirm_password: ''
});
const pwdRules = {
    old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
    new_password: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '新密码至少 6 位', trigger: 'blur' }
    ],
    confirm_password: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        {
            validator: (_rule, value, callback) => {
                if (value !== pwdForm.new_password)
                    callback(new Error('两次输入的密码不一致'));
                else
                    callback();
            },
            trigger: 'blur'
        }
    ]
};
const addressLoading = ref(false);
const addressError = ref(null);
const addresses = ref([]);
const addressOpen = ref(false);
const addressSaving = ref(false);
const addressEditingId = ref(null);
const addressFormRef = ref();
const addressForm = reactive({
    receiver: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    label: '',
    is_default: false
});
const addressRules = {
    receiver: [{ required: true, message: '请输入收货人', trigger: 'blur' }],
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
    province: [{ required: true, message: '请输入省份', trigger: 'blur' }],
    city: [{ required: true, message: '请输入城市', trigger: 'blur' }],
    district: [{ required: true, message: '请输入区/县', trigger: 'blur' }],
    detail: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
};
const paymentText = computed(() => {
    const p = orderDetail.value?.payment;
    if (!p)
        return '-';
    const s = p.status || '-';
    const m = p.method ? `(${p.method})` : '';
    return `${s}${m}`;
});
function statusLabel(status) {
    const map = {
        pending: '待支付',
        paid: '已支付',
        shipped: '已发货',
        delivered: '已送达',
        completed: '已完成',
        cancel_requested: '取消申请中',
        cancelled: '已取消',
        after_sale_pending: '售后处理中',
        after_sale_approved: '售后已通过',
        after_sale_rejected: '售后已拒绝'
    };
    return map[String(status)] ?? String(status);
}
function statusTagType(status) {
    const s = String(status);
    if (s === 'paid' || s === 'completed')
        return 'success';
    if (s === 'shipped' || s === 'delivered' || s === 'after_sale_pending')
        return 'warning';
    if (s === 'after_sale_rejected')
        return 'danger';
    if (s === 'cancelled')
        return 'info';
    return 'default';
}
function canCancel(status) {
    return !['cancelled', 'completed', 'cancel_requested'].includes(String(status));
}
function canAfterSale(order) {
    const status = String(order?.status || '');
    if (order?.after_sale)
        return false;
    return ['paid', 'shipped', 'delivered', 'completed'].includes(status);
}
async function fetchProfile() {
    if (!hasToken.value)
        return;
    try {
        const resp = await http.get('/api/user/profile');
        const data = unwrap(resp);
        profile.username = String(data?.username ?? '');
        profile.phone = String(data?.phone ?? '');
    }
    catch {
        profile.username = '';
        profile.phone = '';
    }
}
async function fetchOrders() {
    if (!hasToken.value)
        return;
    ordersLoading.value = true;
    ordersError.value = null;
    try {
        const resp = await http.get('/api/order/history', {
            params: orderStatus.value ? { status: orderStatus.value } : {}
        });
        const data = unwrap(resp);
        orders.value = Array.isArray(data?.orders) ? data.orders : [];
    }
    catch (e) {
        ordersError.value = e?.response?.data?.message || e?.message || '加载失败';
    }
    finally {
        ordersLoading.value = false;
    }
}
async function fetchAddresses() {
    if (!hasToken.value)
        return;
    addressLoading.value = true;
    addressError.value = null;
    try {
        const resp = await http.get('/api/user/addresses');
        const data = unwrap(resp);
        addresses.value = Array.isArray(data?.addresses) ? data.addresses : [];
    }
    catch (e) {
        addressError.value = e?.response?.data?.message || e?.message || '加载失败';
    }
    finally {
        addressLoading.value = false;
    }
}
function resetAddressForm() {
    addressForm.receiver = '';
    addressForm.phone = '';
    addressForm.province = '';
    addressForm.city = '';
    addressForm.district = '';
    addressForm.detail = '';
    addressForm.label = '';
    addressForm.is_default = false;
    addressFormRef.value?.clearValidate();
}
function openAddAddress() {
    addressEditingId.value = null;
    resetAddressForm();
    addressOpen.value = true;
}
function openEditAddress(row) {
    addressEditingId.value = row._id;
    addressForm.receiver = row.receiver;
    addressForm.phone = row.phone;
    addressForm.province = row.province;
    addressForm.city = row.city;
    addressForm.district = row.district;
    addressForm.detail = row.detail;
    addressForm.label = row.label || '';
    addressForm.is_default = Boolean(row.is_default);
    addressOpen.value = true;
}
async function saveAddress() {
    if (!hasToken.value)
        return;
    const formInst = addressFormRef.value;
    if (!formInst)
        return;
    const ok = await formInst.validate().catch(() => false);
    if (!ok)
        return;
    addressSaving.value = true;
    try {
        const payload = {
            receiver: addressForm.receiver.trim(),
            phone: addressForm.phone.trim(),
            province: addressForm.province.trim(),
            city: addressForm.city.trim(),
            district: addressForm.district.trim(),
            detail: addressForm.detail.trim(),
            label: addressForm.label.trim() || undefined,
            is_default: Boolean(addressForm.is_default)
        };
        if (addressEditingId.value) {
            await http.put(`/api/user/addresses/${encodeURIComponent(addressEditingId.value)}`, payload);
            ElMessage.success('地址已更新');
        }
        else {
            await http.post('/api/user/addresses', payload);
            ElMessage.success('地址已新增');
        }
        addressOpen.value = false;
        await fetchAddresses();
    }
    catch (e) {
        ElMessage.error(e?.response?.data?.message || e?.message || '保存失败');
    }
    finally {
        addressSaving.value = false;
    }
}
async function removeAddress(row) {
    if (!hasToken.value)
        return;
    const ok = await ElMessageBox.confirm('确认删除该地址吗？', '删除地址', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
    }).catch(() => false);
    if (!ok)
        return;
    try {
        await http.delete(`/api/user/addresses/${encodeURIComponent(row._id)}`);
        ElMessage.success('已删除');
        await fetchAddresses();
    }
    catch (e) {
        ElMessage.error(e?.response?.data?.message || e?.message || '删除失败');
    }
}
async function setDefault(row) {
    if (!hasToken.value)
        return;
    try {
        await http.put(`/api/user/addresses/${encodeURIComponent(row._id)}/default`);
        ElMessage.success('默认地址已更新');
        await fetchAddresses();
    }
    catch (e) {
        ElMessage.error(e?.response?.data?.message || e?.message || '设置失败');
    }
}
async function openDetail(orderId) {
    detailOpen.value = true;
    detailLoading.value = true;
    detailError.value = null;
    orderDetail.value = null;
    try {
        const resp = await http.get(`/api/order/${encodeURIComponent(orderId)}`);
        orderDetail.value = unwrap(resp);
    }
    catch (e) {
        detailError.value = e?.response?.data?.message || e?.message || '加载失败';
    }
    finally {
        detailLoading.value = false;
    }
}
function openPay(orderId) {
    payOrderId.value = orderId;
    payMethod.value = '';
    payOpen.value = true;
}
async function submitPay() {
    if (!payOrderId.value || !payMethod.value)
        return;
    payLoading.value = true;
    try {
        await http.post(`/api/order/${encodeURIComponent(payOrderId.value)}/pay`, { payment_method: payMethod.value });
        ElMessage.success('支付成功');
        payOpen.value = false;
        await fetchOrders();
    }
    catch (e) {
        ElMessage.error(e?.response?.data?.message || e?.message || '支付失败');
    }
    finally {
        payLoading.value = false;
    }
}
async function cancelOrder(orderId) {
    const { value, action } = await ElMessageBox.prompt('请输入取消原因（可选）', '取消订单', {
        confirmButtonText: '提交',
        cancelButtonText: '取消',
        inputPlaceholder: '原因'
    }).catch(() => ({ value: '', action: 'cancel' }));
    if (action !== 'confirm')
        return;
    try {
        await http.put(`/api/order/${encodeURIComponent(orderId)}/cancel`, { reason: value });
        ElMessage.success('已提交取消申请');
        await fetchOrders();
    }
    catch (e) {
        ElMessage.error(e?.response?.data?.message || e?.message || '取消失败');
    }
}
function openReview(orderId) {
    reviewOrderId.value = orderId;
    reviewForm.rating = 5;
    reviewForm.content = '';
    reviewOpen.value = true;
}
async function submitReview() {
    if (!reviewOrderId.value)
        return;
    reviewLoading.value = true;
    try {
        await http.post(`/api/order/${encodeURIComponent(reviewOrderId.value)}/review`, {
            rating: reviewForm.rating,
            content: reviewForm.content
        });
        ElMessage.success('评价已提交');
        reviewOpen.value = false;
        await fetchOrders();
    }
    catch (e) {
        ElMessage.error(e?.response?.data?.message || e?.message || '提交失败');
    }
    finally {
        reviewLoading.value = false;
    }
}
function openAfterSale(orderId) {
    afterSaleOrderId.value = orderId;
    afterSaleForm.type = '';
    afterSaleForm.reason = '';
    afterSaleOpen.value = true;
}
async function submitAfterSale() {
    if (!afterSaleOrderId.value || !afterSaleForm.type)
        return;
    afterSaleLoading.value = true;
    try {
        await http.post(`/api/order/${encodeURIComponent(afterSaleOrderId.value)}/after_sale`, {
            type: afterSaleForm.type,
            reason: afterSaleForm.reason
        });
        ElMessage.success('售后申请已提交');
        afterSaleOpen.value = false;
        await fetchOrders();
    }
    catch (e) {
        ElMessage.error(e?.response?.data?.message || e?.message || '提交失败');
    }
    finally {
        afterSaleLoading.value = false;
    }
}
function goHome() {
    router.replace('/');
}
async function logout() {
    logoutLoading.value = true;
    try {
        await http.post('/api/user/logout', { refresh_token: localStorage.getItem('refresh_token') });
    }
    catch {
    }
    finally {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        try {
            window.dispatchEvent(new Event('auth:logout'));
        }
        catch {
        }
        hasToken.value = false;
        profile.username = '';
        profile.phone = '';
        orders.value = [];
        ElMessage.success('已退出');
        logoutLoading.value = false;
        router.replace('/');
    }
}
function resetPwdForm() {
    pwdForm.old_password = '';
    pwdForm.new_password = '';
    pwdForm.confirm_password = '';
    pwdFormRef.value?.clearValidate();
}
async function submitChangePassword() {
    if (!hasToken.value)
        return;
    const form = pwdFormRef.value;
    if (!form)
        return;
    const ok = await form.validate().catch(() => false);
    if (!ok)
        return;
    pwdSubmitting.value = true;
    try {
        await http.post('/api/user/change_password', {
            old_password: pwdForm.old_password,
            new_password: pwdForm.new_password,
            confirm_password: pwdForm.confirm_password
        });
        ElMessage.success('密码修改成功，请重新登录');
        resetPwdForm();
        await logout();
    }
    catch (e) {
        ElMessage.error(e?.response?.data?.message || e?.message || '修改失败');
    }
    finally {
        pwdSubmitting.value = false;
    }
}
onMounted(async () => {
    hasToken.value = Boolean(localStorage.getItem('access_token'));
    if (hasToken.value) {
        await fetchProfile();
        await fetchOrders();
        await fetchAddresses();
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "max-w-6xl mx-auto px-4 py-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-white border border-gray-100 rounded-2xl p-6 shadow-sm" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-col gap-4 md:flex-row md:items-center md:justify-between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-2xl font-bold text-gray-900" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-sm text-gray-500 mt-1" },
});
if (__VLS_ctx.profile.username) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.profile.username);
}
if (__VLS_ctx.profile.phone) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.profile.phone);
}
if (!__VLS_ctx.hasToken) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-3" },
});
if (__VLS_ctx.hasToken) {
    const __VLS_0 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ 'onClick': {} },
        loading: (__VLS_ctx.logoutLoading),
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onClick': {} },
        loading: (__VLS_ctx.logoutLoading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_4;
    let __VLS_5;
    let __VLS_6;
    const __VLS_7 = {
        onClick: (__VLS_ctx.logout)
    };
    __VLS_3.slots.default;
    var __VLS_3;
}
else {
    const __VLS_8 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_10 = __VLS_9({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    let __VLS_12;
    let __VLS_13;
    let __VLS_14;
    const __VLS_15 = {
        onClick: (__VLS_ctx.goHome)
    };
    __VLS_11.slots.default;
    var __VLS_11;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mt-6 bg-white border border-gray-100 rounded-2xl shadow-sm" },
});
const __VLS_16 = {}.ElTabs;
/** @type {[typeof __VLS_components.ElTabs, typeof __VLS_components.elTabs, typeof __VLS_components.ElTabs, typeof __VLS_components.elTabs, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    modelValue: (__VLS_ctx.activeTab),
    ...{ class: "px-4" },
}));
const __VLS_18 = __VLS_17({
    modelValue: (__VLS_ctx.activeTab),
    ...{ class: "px-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
const __VLS_20 = {}.ElTabPane;
/** @type {[typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    label: "我的订单",
    name: "orders",
}));
const __VLS_22 = __VLS_21({
    label: "我的订单",
    name: "orders",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "py-4 space-y-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-col gap-3 md:flex-row md:items-center md:justify-between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-sm text-gray-500" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-3" },
});
const __VLS_24 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.orderStatus),
    placeholder: "订单状态",
    ...{ style: {} },
}));
const __VLS_26 = __VLS_25({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.orderStatus),
    placeholder: "订单状态",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_28;
let __VLS_29;
let __VLS_30;
const __VLS_31 = {
    onChange: (__VLS_ctx.fetchOrders)
};
__VLS_27.slots.default;
const __VLS_32 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    label: "全部",
    value: "",
}));
const __VLS_34 = __VLS_33({
    label: "全部",
    value: "",
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
const __VLS_36 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    label: "待支付",
    value: "pending",
}));
const __VLS_38 = __VLS_37({
    label: "待支付",
    value: "pending",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
const __VLS_40 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    label: "已支付",
    value: "paid",
}));
const __VLS_42 = __VLS_41({
    label: "已支付",
    value: "paid",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
const __VLS_44 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    label: "已发货",
    value: "shipped",
}));
const __VLS_46 = __VLS_45({
    label: "已发货",
    value: "shipped",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
const __VLS_48 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    label: "已送达",
    value: "delivered",
}));
const __VLS_50 = __VLS_49({
    label: "已送达",
    value: "delivered",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
const __VLS_52 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    label: "已完成",
    value: "completed",
}));
const __VLS_54 = __VLS_53({
    label: "已完成",
    value: "completed",
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
const __VLS_56 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    label: "取消申请中",
    value: "cancel_requested",
}));
const __VLS_58 = __VLS_57({
    label: "取消申请中",
    value: "cancel_requested",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
const __VLS_60 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    label: "已取消",
    value: "cancelled",
}));
const __VLS_62 = __VLS_61({
    label: "已取消",
    value: "cancelled",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
const __VLS_64 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    label: "售后处理中",
    value: "after_sale_pending",
}));
const __VLS_66 = __VLS_65({
    label: "售后处理中",
    value: "after_sale_pending",
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
const __VLS_68 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    label: "售后已通过",
    value: "after_sale_approved",
}));
const __VLS_70 = __VLS_69({
    label: "售后已通过",
    value: "after_sale_approved",
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
const __VLS_72 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    label: "售后已拒绝",
    value: "after_sale_rejected",
}));
const __VLS_74 = __VLS_73({
    label: "售后已拒绝",
    value: "after_sale_rejected",
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
var __VLS_27;
const __VLS_76 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.ordersLoading),
}));
const __VLS_78 = __VLS_77({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.ordersLoading),
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
let __VLS_80;
let __VLS_81;
let __VLS_82;
const __VLS_83 = {
    onClick: (__VLS_ctx.fetchOrders)
};
__VLS_79.slots.default;
var __VLS_79;
if (!__VLS_ctx.hasToken) {
    const __VLS_84 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        type: "warning",
        showIcon: true,
        title: "未登录",
        description: "请先登录后查看订单。",
    }));
    const __VLS_86 = __VLS_85({
        type: "warning",
        showIcon: true,
        title: "未登录",
        description: "请先登录后查看订单。",
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
}
else if (__VLS_ctx.ordersError) {
    const __VLS_88 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.ordersError),
    }));
    const __VLS_90 = __VLS_89({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.ordersError),
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
}
const __VLS_92 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
    data: (__VLS_ctx.orders),
    stripe: true,
    size: "small",
    ...{ class: "bg-white rounded-2xl border" },
    emptyText: (__VLS_ctx.hasToken ? '暂无订单' : '未登录'),
}));
const __VLS_94 = __VLS_93({
    data: (__VLS_ctx.orders),
    stripe: true,
    size: "small",
    ...{ class: "bg-white rounded-2xl border" },
    emptyText: (__VLS_ctx.hasToken ? '暂无订单' : '未登录'),
}, ...__VLS_functionalComponentArgsRest(__VLS_93));
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.ordersLoading) }, null, null);
__VLS_95.slots.default;
const __VLS_96 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
    prop: "_id",
    label: "订单号",
    minWidth: "220",
    showOverflowTooltip: true,
}));
const __VLS_98 = __VLS_97({
    prop: "_id",
    label: "订单号",
    minWidth: "220",
    showOverflowTooltip: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_97));
const __VLS_100 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
    prop: "total_amount",
    label: "金额",
    width: "140",
}));
const __VLS_102 = __VLS_101({
    prop: "total_amount",
    label: "金额",
    width: "140",
}, ...__VLS_functionalComponentArgsRest(__VLS_101));
__VLS_103.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_103.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    (Number(row.total_amount ?? 0).toFixed(2));
}
var __VLS_103;
const __VLS_104 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
    label: "状态",
    width: "140",
}));
const __VLS_106 = __VLS_105({
    label: "状态",
    width: "140",
}, ...__VLS_functionalComponentArgsRest(__VLS_105));
__VLS_107.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_107.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_108 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
        type: (__VLS_ctx.statusTagType(row.status)),
    }));
    const __VLS_110 = __VLS_109({
        type: (__VLS_ctx.statusTagType(row.status)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_109));
    __VLS_111.slots.default;
    (__VLS_ctx.statusLabel(row.status));
    var __VLS_111;
}
var __VLS_107;
const __VLS_112 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
    prop: "created_at",
    label: "创建时间",
    minWidth: "180",
    showOverflowTooltip: true,
}));
const __VLS_114 = __VLS_113({
    prop: "created_at",
    label: "创建时间",
    minWidth: "180",
    showOverflowTooltip: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_113));
const __VLS_116 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
    label: "操作",
    width: "260",
    fixed: "right",
}));
const __VLS_118 = __VLS_117({
    label: "操作",
    width: "260",
    fixed: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_117));
__VLS_119.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_119.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_120 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
        ...{ 'onClick': {} },
        link: true,
        type: "primary",
    }));
    const __VLS_122 = __VLS_121({
        ...{ 'onClick': {} },
        link: true,
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_121));
    let __VLS_124;
    let __VLS_125;
    let __VLS_126;
    const __VLS_127 = {
        onClick: (...[$event]) => {
            __VLS_ctx.openDetail(row._id);
        }
    };
    __VLS_123.slots.default;
    var __VLS_123;
    if (row.status === 'pending') {
        const __VLS_128 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
            ...{ 'onClick': {} },
            link: true,
            type: "success",
        }));
        const __VLS_130 = __VLS_129({
            ...{ 'onClick': {} },
            link: true,
            type: "success",
        }, ...__VLS_functionalComponentArgsRest(__VLS_129));
        let __VLS_132;
        let __VLS_133;
        let __VLS_134;
        const __VLS_135 = {
            onClick: (...[$event]) => {
                if (!(row.status === 'pending'))
                    return;
                __VLS_ctx.openPay(row._id);
            }
        };
        __VLS_131.slots.default;
        var __VLS_131;
    }
    if (__VLS_ctx.canCancel(row.status)) {
        const __VLS_136 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
            ...{ 'onClick': {} },
            link: true,
            type: "warning",
        }));
        const __VLS_138 = __VLS_137({
            ...{ 'onClick': {} },
            link: true,
            type: "warning",
        }, ...__VLS_functionalComponentArgsRest(__VLS_137));
        let __VLS_140;
        let __VLS_141;
        let __VLS_142;
        const __VLS_143 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.canCancel(row.status)))
                    return;
                __VLS_ctx.cancelOrder(row._id);
            }
        };
        __VLS_139.slots.default;
        var __VLS_139;
    }
    if (row.status === 'delivered') {
        const __VLS_144 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
            ...{ 'onClick': {} },
            link: true,
            type: "primary",
        }));
        const __VLS_146 = __VLS_145({
            ...{ 'onClick': {} },
            link: true,
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_145));
        let __VLS_148;
        let __VLS_149;
        let __VLS_150;
        const __VLS_151 = {
            onClick: (...[$event]) => {
                if (!(row.status === 'delivered'))
                    return;
                __VLS_ctx.openReview(row._id);
            }
        };
        __VLS_147.slots.default;
        var __VLS_147;
    }
    if (__VLS_ctx.canAfterSale(row)) {
        const __VLS_152 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
            ...{ 'onClick': {} },
            link: true,
            type: "danger",
        }));
        const __VLS_154 = __VLS_153({
            ...{ 'onClick': {} },
            link: true,
            type: "danger",
        }, ...__VLS_functionalComponentArgsRest(__VLS_153));
        let __VLS_156;
        let __VLS_157;
        let __VLS_158;
        const __VLS_159 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.canAfterSale(row)))
                    return;
                __VLS_ctx.openAfterSale(row._id);
            }
        };
        __VLS_155.slots.default;
        var __VLS_155;
    }
}
var __VLS_119;
var __VLS_95;
var __VLS_23;
const __VLS_160 = {}.ElTabPane;
/** @type {[typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, ]} */ ;
// @ts-ignore
const __VLS_161 = __VLS_asFunctionalComponent(__VLS_160, new __VLS_160({
    label: "个人资料",
    name: "profile",
}));
const __VLS_162 = __VLS_161({
    label: "个人资料",
    name: "profile",
}, ...__VLS_functionalComponentArgsRest(__VLS_161));
__VLS_163.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "py-6" },
});
const __VLS_164 = {}.ElDescriptions;
/** @type {[typeof __VLS_components.ElDescriptions, typeof __VLS_components.elDescriptions, typeof __VLS_components.ElDescriptions, typeof __VLS_components.elDescriptions, ]} */ ;
// @ts-ignore
const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
    column: (1),
    border: true,
}));
const __VLS_166 = __VLS_165({
    column: (1),
    border: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_165));
__VLS_167.slots.default;
const __VLS_168 = {}.ElDescriptionsItem;
/** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
// @ts-ignore
const __VLS_169 = __VLS_asFunctionalComponent(__VLS_168, new __VLS_168({
    label: "用户名",
}));
const __VLS_170 = __VLS_169({
    label: "用户名",
}, ...__VLS_functionalComponentArgsRest(__VLS_169));
__VLS_171.slots.default;
(__VLS_ctx.profile.username || '-');
var __VLS_171;
const __VLS_172 = {}.ElDescriptionsItem;
/** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
// @ts-ignore
const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({
    label: "手机号",
}));
const __VLS_174 = __VLS_173({
    label: "手机号",
}, ...__VLS_functionalComponentArgsRest(__VLS_173));
__VLS_175.slots.default;
(__VLS_ctx.profile.phone || '-');
var __VLS_175;
var __VLS_167;
var __VLS_163;
const __VLS_176 = {}.ElTabPane;
/** @type {[typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, ]} */ ;
// @ts-ignore
const __VLS_177 = __VLS_asFunctionalComponent(__VLS_176, new __VLS_176({
    label: "账户安全",
    name: "security",
}));
const __VLS_178 = __VLS_177({
    label: "账户安全",
    name: "security",
}, ...__VLS_functionalComponentArgsRest(__VLS_177));
__VLS_179.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "py-6 max-w-xl" },
});
if (!__VLS_ctx.hasToken) {
    const __VLS_180 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
        type: "warning",
        showIcon: true,
        title: "未登录",
        description: "请先登录后修改密码。",
        ...{ class: "mb-4" },
    }));
    const __VLS_182 = __VLS_181({
        type: "warning",
        showIcon: true,
        title: "未登录",
        description: "请先登录后修改密码。",
        ...{ class: "mb-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_181));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-base font-semibold text-gray-900" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm text-gray-500 mt-1" },
    });
    const __VLS_184 = {}.ElForm;
    /** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
    // @ts-ignore
    const __VLS_185 = __VLS_asFunctionalComponent(__VLS_184, new __VLS_184({
        ref: "pwdFormRef",
        model: (__VLS_ctx.pwdForm),
        rules: (__VLS_ctx.pwdRules),
        labelWidth: "96px",
        statusIcon: true,
    }));
    const __VLS_186 = __VLS_185({
        ref: "pwdFormRef",
        model: (__VLS_ctx.pwdForm),
        rules: (__VLS_ctx.pwdRules),
        labelWidth: "96px",
        statusIcon: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_185));
    /** @type {typeof __VLS_ctx.pwdFormRef} */ ;
    var __VLS_188 = {};
    __VLS_187.slots.default;
    const __VLS_190 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_191 = __VLS_asFunctionalComponent(__VLS_190, new __VLS_190({
        label: "原密码",
        prop: "old_password",
    }));
    const __VLS_192 = __VLS_191({
        label: "原密码",
        prop: "old_password",
    }, ...__VLS_functionalComponentArgsRest(__VLS_191));
    __VLS_193.slots.default;
    const __VLS_194 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_195 = __VLS_asFunctionalComponent(__VLS_194, new __VLS_194({
        modelValue: (__VLS_ctx.pwdForm.old_password),
        type: "password",
        showPassword: true,
        autocomplete: "current-password",
    }));
    const __VLS_196 = __VLS_195({
        modelValue: (__VLS_ctx.pwdForm.old_password),
        type: "password",
        showPassword: true,
        autocomplete: "current-password",
    }, ...__VLS_functionalComponentArgsRest(__VLS_195));
    var __VLS_193;
    const __VLS_198 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_199 = __VLS_asFunctionalComponent(__VLS_198, new __VLS_198({
        label: "新密码",
        prop: "new_password",
    }));
    const __VLS_200 = __VLS_199({
        label: "新密码",
        prop: "new_password",
    }, ...__VLS_functionalComponentArgsRest(__VLS_199));
    __VLS_201.slots.default;
    const __VLS_202 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_203 = __VLS_asFunctionalComponent(__VLS_202, new __VLS_202({
        modelValue: (__VLS_ctx.pwdForm.new_password),
        type: "password",
        showPassword: true,
        autocomplete: "new-password",
    }));
    const __VLS_204 = __VLS_203({
        modelValue: (__VLS_ctx.pwdForm.new_password),
        type: "password",
        showPassword: true,
        autocomplete: "new-password",
    }, ...__VLS_functionalComponentArgsRest(__VLS_203));
    var __VLS_201;
    const __VLS_206 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_207 = __VLS_asFunctionalComponent(__VLS_206, new __VLS_206({
        label: "确认密码",
        prop: "confirm_password",
    }));
    const __VLS_208 = __VLS_207({
        label: "确认密码",
        prop: "confirm_password",
    }, ...__VLS_functionalComponentArgsRest(__VLS_207));
    __VLS_209.slots.default;
    const __VLS_210 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_211 = __VLS_asFunctionalComponent(__VLS_210, new __VLS_210({
        modelValue: (__VLS_ctx.pwdForm.confirm_password),
        type: "password",
        showPassword: true,
        autocomplete: "new-password",
    }));
    const __VLS_212 = __VLS_211({
        modelValue: (__VLS_ctx.pwdForm.confirm_password),
        type: "password",
        showPassword: true,
        autocomplete: "new-password",
    }, ...__VLS_functionalComponentArgsRest(__VLS_211));
    var __VLS_209;
    const __VLS_214 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_215 = __VLS_asFunctionalComponent(__VLS_214, new __VLS_214({}));
    const __VLS_216 = __VLS_215({}, ...__VLS_functionalComponentArgsRest(__VLS_215));
    __VLS_217.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-3" },
    });
    const __VLS_218 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_219 = __VLS_asFunctionalComponent(__VLS_218, new __VLS_218({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.pwdSubmitting),
    }));
    const __VLS_220 = __VLS_219({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.pwdSubmitting),
    }, ...__VLS_functionalComponentArgsRest(__VLS_219));
    let __VLS_222;
    let __VLS_223;
    let __VLS_224;
    const __VLS_225 = {
        onClick: (__VLS_ctx.submitChangePassword)
    };
    __VLS_221.slots.default;
    var __VLS_221;
    const __VLS_226 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_227 = __VLS_asFunctionalComponent(__VLS_226, new __VLS_226({
        ...{ 'onClick': {} },
        disabled: (__VLS_ctx.pwdSubmitting),
    }));
    const __VLS_228 = __VLS_227({
        ...{ 'onClick': {} },
        disabled: (__VLS_ctx.pwdSubmitting),
    }, ...__VLS_functionalComponentArgsRest(__VLS_227));
    let __VLS_230;
    let __VLS_231;
    let __VLS_232;
    const __VLS_233 = {
        onClick: (__VLS_ctx.resetPwdForm)
    };
    __VLS_229.slots.default;
    var __VLS_229;
    var __VLS_217;
    var __VLS_187;
}
var __VLS_179;
const __VLS_234 = {}.ElTabPane;
/** @type {[typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, ]} */ ;
// @ts-ignore
const __VLS_235 = __VLS_asFunctionalComponent(__VLS_234, new __VLS_234({
    label: "收货地址",
    name: "address",
}));
const __VLS_236 = __VLS_235({
    label: "收货地址",
    name: "address",
}, ...__VLS_functionalComponentArgsRest(__VLS_235));
__VLS_237.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "py-4 space-y-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-col gap-3 md:flex-row md:items-center md:justify-between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-sm text-gray-500" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-3" },
});
const __VLS_238 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_239 = __VLS_asFunctionalComponent(__VLS_238, new __VLS_238({
    ...{ 'onClick': {} },
    disabled: (!__VLS_ctx.hasToken),
    type: "primary",
}));
const __VLS_240 = __VLS_239({
    ...{ 'onClick': {} },
    disabled: (!__VLS_ctx.hasToken),
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_239));
let __VLS_242;
let __VLS_243;
let __VLS_244;
const __VLS_245 = {
    onClick: (__VLS_ctx.openAddAddress)
};
__VLS_241.slots.default;
var __VLS_241;
const __VLS_246 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_247 = __VLS_asFunctionalComponent(__VLS_246, new __VLS_246({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.addressLoading),
    disabled: (!__VLS_ctx.hasToken),
}));
const __VLS_248 = __VLS_247({
    ...{ 'onClick': {} },
    loading: (__VLS_ctx.addressLoading),
    disabled: (!__VLS_ctx.hasToken),
}, ...__VLS_functionalComponentArgsRest(__VLS_247));
let __VLS_250;
let __VLS_251;
let __VLS_252;
const __VLS_253 = {
    onClick: (__VLS_ctx.fetchAddresses)
};
__VLS_249.slots.default;
var __VLS_249;
if (!__VLS_ctx.hasToken) {
    const __VLS_254 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_255 = __VLS_asFunctionalComponent(__VLS_254, new __VLS_254({
        type: "warning",
        showIcon: true,
        title: "未登录",
        description: "请先登录后管理收货地址。",
    }));
    const __VLS_256 = __VLS_255({
        type: "warning",
        showIcon: true,
        title: "未登录",
        description: "请先登录后管理收货地址。",
    }, ...__VLS_functionalComponentArgsRest(__VLS_255));
}
else if (__VLS_ctx.addressError) {
    const __VLS_258 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_259 = __VLS_asFunctionalComponent(__VLS_258, new __VLS_258({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.addressError),
    }));
    const __VLS_260 = __VLS_259({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.addressError),
    }, ...__VLS_functionalComponentArgsRest(__VLS_259));
}
const __VLS_262 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_263 = __VLS_asFunctionalComponent(__VLS_262, new __VLS_262({
    data: (__VLS_ctx.addresses),
    stripe: true,
    size: "small",
    ...{ class: "bg-white rounded-2xl border" },
    emptyText: (__VLS_ctx.hasToken ? '暂无地址' : '未登录'),
}));
const __VLS_264 = __VLS_263({
    data: (__VLS_ctx.addresses),
    stripe: true,
    size: "small",
    ...{ class: "bg-white rounded-2xl border" },
    emptyText: (__VLS_ctx.hasToken ? '暂无地址' : '未登录'),
}, ...__VLS_functionalComponentArgsRest(__VLS_263));
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.addressLoading) }, null, null);
__VLS_265.slots.default;
const __VLS_266 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_267 = __VLS_asFunctionalComponent(__VLS_266, new __VLS_266({
    label: "收货人",
    minWidth: "120",
}));
const __VLS_268 = __VLS_267({
    label: "收货人",
    minWidth: "120",
}, ...__VLS_functionalComponentArgsRest(__VLS_267));
__VLS_269.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_269.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "font-medium text-gray-900" },
    });
    (row.receiver);
    if (row.is_default) {
        const __VLS_270 = {}.ElTag;
        /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
        // @ts-ignore
        const __VLS_271 = __VLS_asFunctionalComponent(__VLS_270, new __VLS_270({
            type: "success",
        }));
        const __VLS_272 = __VLS_271({
            type: "success",
        }, ...__VLS_functionalComponentArgsRest(__VLS_271));
        __VLS_273.slots.default;
        var __VLS_273;
    }
}
var __VLS_269;
const __VLS_274 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_275 = __VLS_asFunctionalComponent(__VLS_274, new __VLS_274({
    prop: "phone",
    label: "手机号",
    width: "140",
}));
const __VLS_276 = __VLS_275({
    prop: "phone",
    label: "手机号",
    width: "140",
}, ...__VLS_functionalComponentArgsRest(__VLS_275));
const __VLS_278 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_279 = __VLS_asFunctionalComponent(__VLS_278, new __VLS_278({
    label: "地址",
    minWidth: "260",
    showOverflowTooltip: true,
}));
const __VLS_280 = __VLS_279({
    label: "地址",
    minWidth: "260",
    showOverflowTooltip: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_279));
__VLS_281.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_281.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    (row.province);
    (row.city);
    (row.district);
    (row.detail);
}
var __VLS_281;
const __VLS_282 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_283 = __VLS_asFunctionalComponent(__VLS_282, new __VLS_282({
    prop: "label",
    label: "标签",
    width: "120",
}));
const __VLS_284 = __VLS_283({
    prop: "label",
    label: "标签",
    width: "120",
}, ...__VLS_functionalComponentArgsRest(__VLS_283));
const __VLS_286 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_287 = __VLS_asFunctionalComponent(__VLS_286, new __VLS_286({
    label: "操作",
    width: "240",
    fixed: "right",
}));
const __VLS_288 = __VLS_287({
    label: "操作",
    width: "240",
    fixed: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_287));
__VLS_289.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_289.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_290 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_291 = __VLS_asFunctionalComponent(__VLS_290, new __VLS_290({
        ...{ 'onClick': {} },
        link: true,
        type: "primary",
    }));
    const __VLS_292 = __VLS_291({
        ...{ 'onClick': {} },
        link: true,
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_291));
    let __VLS_294;
    let __VLS_295;
    let __VLS_296;
    const __VLS_297 = {
        onClick: (...[$event]) => {
            __VLS_ctx.openEditAddress(row);
        }
    };
    __VLS_293.slots.default;
    var __VLS_293;
    const __VLS_298 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_299 = __VLS_asFunctionalComponent(__VLS_298, new __VLS_298({
        ...{ 'onClick': {} },
        link: true,
        type: "danger",
    }));
    const __VLS_300 = __VLS_299({
        ...{ 'onClick': {} },
        link: true,
        type: "danger",
    }, ...__VLS_functionalComponentArgsRest(__VLS_299));
    let __VLS_302;
    let __VLS_303;
    let __VLS_304;
    const __VLS_305 = {
        onClick: (...[$event]) => {
            __VLS_ctx.removeAddress(row);
        }
    };
    __VLS_301.slots.default;
    var __VLS_301;
    if (!row.is_default) {
        const __VLS_306 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_307 = __VLS_asFunctionalComponent(__VLS_306, new __VLS_306({
            ...{ 'onClick': {} },
            link: true,
            type: "success",
        }));
        const __VLS_308 = __VLS_307({
            ...{ 'onClick': {} },
            link: true,
            type: "success",
        }, ...__VLS_functionalComponentArgsRest(__VLS_307));
        let __VLS_310;
        let __VLS_311;
        let __VLS_312;
        const __VLS_313 = {
            onClick: (...[$event]) => {
                if (!(!row.is_default))
                    return;
                __VLS_ctx.setDefault(row);
            }
        };
        __VLS_309.slots.default;
        var __VLS_309;
    }
}
var __VLS_289;
var __VLS_265;
var __VLS_237;
var __VLS_19;
const __VLS_314 = {}.ElDrawer;
/** @type {[typeof __VLS_components.ElDrawer, typeof __VLS_components.elDrawer, typeof __VLS_components.ElDrawer, typeof __VLS_components.elDrawer, ]} */ ;
// @ts-ignore
const __VLS_315 = __VLS_asFunctionalComponent(__VLS_314, new __VLS_314({
    modelValue: (__VLS_ctx.detailOpen),
    title: "订单详情",
    size: "520px",
}));
const __VLS_316 = __VLS_315({
    modelValue: (__VLS_ctx.detailOpen),
    title: "订单详情",
    size: "520px",
}, ...__VLS_functionalComponentArgsRest(__VLS_315));
__VLS_317.slots.default;
if (__VLS_ctx.detailLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-gray-500" },
    });
}
else if (__VLS_ctx.detailError) {
    const __VLS_318 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_319 = __VLS_asFunctionalComponent(__VLS_318, new __VLS_318({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.detailError),
    }));
    const __VLS_320 = __VLS_319({
        type: "error",
        showIcon: true,
        title: (__VLS_ctx.detailError),
    }, ...__VLS_functionalComponentArgsRest(__VLS_319));
}
else if (__VLS_ctx.orderDetail) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm text-gray-500" },
    });
    (__VLS_ctx.orderDetail._id);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-between" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-lg font-semibold text-gray-900" },
    });
    (Number(__VLS_ctx.orderDetail.total_amount ?? 0).toFixed(2));
    const __VLS_322 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_323 = __VLS_asFunctionalComponent(__VLS_322, new __VLS_322({
        type: (__VLS_ctx.statusTagType(__VLS_ctx.orderDetail.status)),
    }));
    const __VLS_324 = __VLS_323({
        type: (__VLS_ctx.statusTagType(__VLS_ctx.orderDetail.status)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_323));
    __VLS_325.slots.default;
    (__VLS_ctx.statusLabel(__VLS_ctx.orderDetail.status));
    var __VLS_325;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm text-gray-600" },
    });
    (__VLS_ctx.orderDetail.shipping_address || '-');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm text-gray-600" },
    });
    (__VLS_ctx.paymentText);
    if (__VLS_ctx.orderDetail.cancel_request) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-sm text-gray-600" },
        });
        (__VLS_ctx.orderDetail.cancel_request.reason);
    }
    if (__VLS_ctx.orderDetail.after_sale) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-sm text-gray-600" },
        });
        (__VLS_ctx.orderDetail.after_sale.type);
        (__VLS_ctx.orderDetail.after_sale.status);
        (__VLS_ctx.orderDetail.after_sale.reason);
    }
    if (__VLS_ctx.orderDetail.review) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-sm text-gray-600" },
        });
        (__VLS_ctx.orderDetail.review.rating);
        (__VLS_ctx.orderDetail.review.content);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-base font-semibold text-gray-900 mt-4" },
    });
    const __VLS_326 = {}.ElTable;
    /** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
    // @ts-ignore
    const __VLS_327 = __VLS_asFunctionalComponent(__VLS_326, new __VLS_326({
        data: (__VLS_ctx.orderDetail.items || []),
        stripe: true,
        size: "small",
        ...{ class: "border rounded-xl" },
    }));
    const __VLS_328 = __VLS_327({
        data: (__VLS_ctx.orderDetail.items || []),
        stripe: true,
        size: "small",
        ...{ class: "border rounded-xl" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_327));
    __VLS_329.slots.default;
    const __VLS_330 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_331 = __VLS_asFunctionalComponent(__VLS_330, new __VLS_330({
        prop: "name",
        label: "商品",
        minWidth: "160",
        showOverflowTooltip: true,
    }));
    const __VLS_332 = __VLS_331({
        prop: "name",
        label: "商品",
        minWidth: "160",
        showOverflowTooltip: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_331));
    const __VLS_334 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_335 = __VLS_asFunctionalComponent(__VLS_334, new __VLS_334({
        prop: "product_id",
        label: "商品ID",
        minWidth: "220",
        showOverflowTooltip: true,
    }));
    const __VLS_336 = __VLS_335({
        prop: "product_id",
        label: "商品ID",
        minWidth: "220",
        showOverflowTooltip: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_335));
    const __VLS_338 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_339 = __VLS_asFunctionalComponent(__VLS_338, new __VLS_338({
        prop: "quantity",
        label: "数量",
        width: "90",
    }));
    const __VLS_340 = __VLS_339({
        prop: "quantity",
        label: "数量",
        width: "90",
    }, ...__VLS_functionalComponentArgsRest(__VLS_339));
    const __VLS_342 = {}.ElTableColumn;
    /** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
    // @ts-ignore
    const __VLS_343 = __VLS_asFunctionalComponent(__VLS_342, new __VLS_342({
        prop: "unit_price",
        label: "单价",
        width: "120",
    }));
    const __VLS_344 = __VLS_343({
        prop: "unit_price",
        label: "单价",
        width: "120",
    }, ...__VLS_functionalComponentArgsRest(__VLS_343));
    __VLS_345.slots.default;
    {
        const { default: __VLS_thisSlot } = __VLS_345.slots;
        const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
        (Number(row.unit_price ?? 0).toFixed(2));
    }
    var __VLS_345;
    var __VLS_329;
}
var __VLS_317;
const __VLS_346 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_347 = __VLS_asFunctionalComponent(__VLS_346, new __VLS_346({
    modelValue: (__VLS_ctx.payOpen),
    title: "订单支付",
    width: "420px",
}));
const __VLS_348 = __VLS_347({
    modelValue: (__VLS_ctx.payOpen),
    title: "订单支付",
    width: "420px",
}, ...__VLS_functionalComponentArgsRest(__VLS_347));
__VLS_349.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-4" },
});
const __VLS_350 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_351 = __VLS_asFunctionalComponent(__VLS_350, new __VLS_350({
    modelValue: (__VLS_ctx.payMethod),
    placeholder: "选择支付方式",
    ...{ style: {} },
}));
const __VLS_352 = __VLS_351({
    modelValue: (__VLS_ctx.payMethod),
    placeholder: "选择支付方式",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_351));
__VLS_353.slots.default;
const __VLS_354 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_355 = __VLS_asFunctionalComponent(__VLS_354, new __VLS_354({
    label: "微信支付",
    value: "wechat",
}));
const __VLS_356 = __VLS_355({
    label: "微信支付",
    value: "wechat",
}, ...__VLS_functionalComponentArgsRest(__VLS_355));
const __VLS_358 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_359 = __VLS_asFunctionalComponent(__VLS_358, new __VLS_358({
    label: "支付宝",
    value: "alipay",
}));
const __VLS_360 = __VLS_359({
    label: "支付宝",
    value: "alipay",
}, ...__VLS_functionalComponentArgsRest(__VLS_359));
var __VLS_353;
{
    const { footer: __VLS_thisSlot } = __VLS_349.slots;
    const __VLS_362 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_363 = __VLS_asFunctionalComponent(__VLS_362, new __VLS_362({
        ...{ 'onClick': {} },
    }));
    const __VLS_364 = __VLS_363({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_363));
    let __VLS_366;
    let __VLS_367;
    let __VLS_368;
    const __VLS_369 = {
        onClick: (...[$event]) => {
            __VLS_ctx.payOpen = false;
        }
    };
    __VLS_365.slots.default;
    var __VLS_365;
    const __VLS_370 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_371 = __VLS_asFunctionalComponent(__VLS_370, new __VLS_370({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.payLoading),
        disabled: (!__VLS_ctx.payMethod),
    }));
    const __VLS_372 = __VLS_371({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.payLoading),
        disabled: (!__VLS_ctx.payMethod),
    }, ...__VLS_functionalComponentArgsRest(__VLS_371));
    let __VLS_374;
    let __VLS_375;
    let __VLS_376;
    const __VLS_377 = {
        onClick: (__VLS_ctx.submitPay)
    };
    __VLS_373.slots.default;
    var __VLS_373;
}
var __VLS_349;
const __VLS_378 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_379 = __VLS_asFunctionalComponent(__VLS_378, new __VLS_378({
    modelValue: (__VLS_ctx.reviewOpen),
    title: "订单评价",
    width: "520px",
}));
const __VLS_380 = __VLS_379({
    modelValue: (__VLS_ctx.reviewOpen),
    title: "订单评价",
    width: "520px",
}, ...__VLS_functionalComponentArgsRest(__VLS_379));
__VLS_381.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-sm text-gray-600 w-16" },
});
const __VLS_382 = {}.ElRate;
/** @type {[typeof __VLS_components.ElRate, typeof __VLS_components.elRate, ]} */ ;
// @ts-ignore
const __VLS_383 = __VLS_asFunctionalComponent(__VLS_382, new __VLS_382({
    modelValue: (__VLS_ctx.reviewForm.rating),
}));
const __VLS_384 = __VLS_383({
    modelValue: (__VLS_ctx.reviewForm.rating),
}, ...__VLS_functionalComponentArgsRest(__VLS_383));
const __VLS_386 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_387 = __VLS_asFunctionalComponent(__VLS_386, new __VLS_386({
    modelValue: (__VLS_ctx.reviewForm.content),
    type: "textarea",
    rows: (4),
    placeholder: "请输入评价内容",
}));
const __VLS_388 = __VLS_387({
    modelValue: (__VLS_ctx.reviewForm.content),
    type: "textarea",
    rows: (4),
    placeholder: "请输入评价内容",
}, ...__VLS_functionalComponentArgsRest(__VLS_387));
{
    const { footer: __VLS_thisSlot } = __VLS_381.slots;
    const __VLS_390 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_391 = __VLS_asFunctionalComponent(__VLS_390, new __VLS_390({
        ...{ 'onClick': {} },
    }));
    const __VLS_392 = __VLS_391({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_391));
    let __VLS_394;
    let __VLS_395;
    let __VLS_396;
    const __VLS_397 = {
        onClick: (...[$event]) => {
            __VLS_ctx.reviewOpen = false;
        }
    };
    __VLS_393.slots.default;
    var __VLS_393;
    const __VLS_398 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_399 = __VLS_asFunctionalComponent(__VLS_398, new __VLS_398({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.reviewLoading),
    }));
    const __VLS_400 = __VLS_399({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.reviewLoading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_399));
    let __VLS_402;
    let __VLS_403;
    let __VLS_404;
    const __VLS_405 = {
        onClick: (__VLS_ctx.submitReview)
    };
    __VLS_401.slots.default;
    var __VLS_401;
}
var __VLS_381;
const __VLS_406 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_407 = __VLS_asFunctionalComponent(__VLS_406, new __VLS_406({
    modelValue: (__VLS_ctx.afterSaleOpen),
    title: "售后申请",
    width: "520px",
}));
const __VLS_408 = __VLS_407({
    modelValue: (__VLS_ctx.afterSaleOpen),
    title: "售后申请",
    width: "520px",
}, ...__VLS_functionalComponentArgsRest(__VLS_407));
__VLS_409.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-4" },
});
const __VLS_410 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_411 = __VLS_asFunctionalComponent(__VLS_410, new __VLS_410({
    modelValue: (__VLS_ctx.afterSaleForm.type),
    placeholder: "选择售后类型",
    ...{ style: {} },
}));
const __VLS_412 = __VLS_411({
    modelValue: (__VLS_ctx.afterSaleForm.type),
    placeholder: "选择售后类型",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_411));
__VLS_413.slots.default;
const __VLS_414 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_415 = __VLS_asFunctionalComponent(__VLS_414, new __VLS_414({
    label: "仅退款",
    value: "refund",
}));
const __VLS_416 = __VLS_415({
    label: "仅退款",
    value: "refund",
}, ...__VLS_functionalComponentArgsRest(__VLS_415));
const __VLS_418 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_419 = __VLS_asFunctionalComponent(__VLS_418, new __VLS_418({
    label: "退货退款",
    value: "return",
}));
const __VLS_420 = __VLS_419({
    label: "退货退款",
    value: "return",
}, ...__VLS_functionalComponentArgsRest(__VLS_419));
const __VLS_422 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_423 = __VLS_asFunctionalComponent(__VLS_422, new __VLS_422({
    label: "维修",
    value: "repair",
}));
const __VLS_424 = __VLS_423({
    label: "维修",
    value: "repair",
}, ...__VLS_functionalComponentArgsRest(__VLS_423));
var __VLS_413;
const __VLS_426 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_427 = __VLS_asFunctionalComponent(__VLS_426, new __VLS_426({
    modelValue: (__VLS_ctx.afterSaleForm.reason),
    type: "textarea",
    rows: (4),
    placeholder: "请输入售后原因",
}));
const __VLS_428 = __VLS_427({
    modelValue: (__VLS_ctx.afterSaleForm.reason),
    type: "textarea",
    rows: (4),
    placeholder: "请输入售后原因",
}, ...__VLS_functionalComponentArgsRest(__VLS_427));
{
    const { footer: __VLS_thisSlot } = __VLS_409.slots;
    const __VLS_430 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_431 = __VLS_asFunctionalComponent(__VLS_430, new __VLS_430({
        ...{ 'onClick': {} },
    }));
    const __VLS_432 = __VLS_431({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_431));
    let __VLS_434;
    let __VLS_435;
    let __VLS_436;
    const __VLS_437 = {
        onClick: (...[$event]) => {
            __VLS_ctx.afterSaleOpen = false;
        }
    };
    __VLS_433.slots.default;
    var __VLS_433;
    const __VLS_438 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_439 = __VLS_asFunctionalComponent(__VLS_438, new __VLS_438({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.afterSaleLoading),
        disabled: (!__VLS_ctx.afterSaleForm.type),
    }));
    const __VLS_440 = __VLS_439({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.afterSaleLoading),
        disabled: (!__VLS_ctx.afterSaleForm.type),
    }, ...__VLS_functionalComponentArgsRest(__VLS_439));
    let __VLS_442;
    let __VLS_443;
    let __VLS_444;
    const __VLS_445 = {
        onClick: (__VLS_ctx.submitAfterSale)
    };
    __VLS_441.slots.default;
    var __VLS_441;
}
var __VLS_409;
const __VLS_446 = {}.ElDrawer;
/** @type {[typeof __VLS_components.ElDrawer, typeof __VLS_components.elDrawer, typeof __VLS_components.ElDrawer, typeof __VLS_components.elDrawer, ]} */ ;
// @ts-ignore
const __VLS_447 = __VLS_asFunctionalComponent(__VLS_446, new __VLS_446({
    modelValue: (__VLS_ctx.addressOpen),
    title: (__VLS_ctx.addressEditingId ? '编辑地址' : '新增地址'),
    size: "520px",
}));
const __VLS_448 = __VLS_447({
    modelValue: (__VLS_ctx.addressOpen),
    title: (__VLS_ctx.addressEditingId ? '编辑地址' : '新增地址'),
    size: "520px",
}, ...__VLS_functionalComponentArgsRest(__VLS_447));
__VLS_449.slots.default;
if (!__VLS_ctx.hasToken) {
    const __VLS_450 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_451 = __VLS_asFunctionalComponent(__VLS_450, new __VLS_450({
        type: "warning",
        showIcon: true,
        title: "未登录",
        description: "请先登录后管理收货地址。",
        ...{ class: "mb-4" },
    }));
    const __VLS_452 = __VLS_451({
        type: "warning",
        showIcon: true,
        title: "未登录",
        description: "请先登录后管理收货地址。",
        ...{ class: "mb-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_451));
}
else {
    const __VLS_454 = {}.ElForm;
    /** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
    // @ts-ignore
    const __VLS_455 = __VLS_asFunctionalComponent(__VLS_454, new __VLS_454({
        ref: "addressFormRef",
        model: (__VLS_ctx.addressForm),
        rules: (__VLS_ctx.addressRules),
        labelPosition: "top",
        statusIcon: true,
    }));
    const __VLS_456 = __VLS_455({
        ref: "addressFormRef",
        model: (__VLS_ctx.addressForm),
        rules: (__VLS_ctx.addressRules),
        labelPosition: "top",
        statusIcon: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_455));
    /** @type {typeof __VLS_ctx.addressFormRef} */ ;
    var __VLS_458 = {};
    __VLS_457.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-1 md:grid-cols-2 gap-4" },
    });
    const __VLS_460 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_461 = __VLS_asFunctionalComponent(__VLS_460, new __VLS_460({
        label: "收货人",
        prop: "receiver",
    }));
    const __VLS_462 = __VLS_461({
        label: "收货人",
        prop: "receiver",
    }, ...__VLS_functionalComponentArgsRest(__VLS_461));
    __VLS_463.slots.default;
    const __VLS_464 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_465 = __VLS_asFunctionalComponent(__VLS_464, new __VLS_464({
        modelValue: (__VLS_ctx.addressForm.receiver),
        placeholder: "请输入收货人姓名",
    }));
    const __VLS_466 = __VLS_465({
        modelValue: (__VLS_ctx.addressForm.receiver),
        placeholder: "请输入收货人姓名",
    }, ...__VLS_functionalComponentArgsRest(__VLS_465));
    var __VLS_463;
    const __VLS_468 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_469 = __VLS_asFunctionalComponent(__VLS_468, new __VLS_468({
        label: "手机号",
        prop: "phone",
    }));
    const __VLS_470 = __VLS_469({
        label: "手机号",
        prop: "phone",
    }, ...__VLS_functionalComponentArgsRest(__VLS_469));
    __VLS_471.slots.default;
    const __VLS_472 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_473 = __VLS_asFunctionalComponent(__VLS_472, new __VLS_472({
        modelValue: (__VLS_ctx.addressForm.phone),
        placeholder: "请输入手机号",
        inputmode: "numeric",
        autocomplete: "tel",
    }));
    const __VLS_474 = __VLS_473({
        modelValue: (__VLS_ctx.addressForm.phone),
        placeholder: "请输入手机号",
        inputmode: "numeric",
        autocomplete: "tel",
    }, ...__VLS_functionalComponentArgsRest(__VLS_473));
    var __VLS_471;
    const __VLS_476 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_477 = __VLS_asFunctionalComponent(__VLS_476, new __VLS_476({
        label: "省份",
        prop: "province",
    }));
    const __VLS_478 = __VLS_477({
        label: "省份",
        prop: "province",
    }, ...__VLS_functionalComponentArgsRest(__VLS_477));
    __VLS_479.slots.default;
    const __VLS_480 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_481 = __VLS_asFunctionalComponent(__VLS_480, new __VLS_480({
        modelValue: (__VLS_ctx.addressForm.province),
        placeholder: "如：北京市",
    }));
    const __VLS_482 = __VLS_481({
        modelValue: (__VLS_ctx.addressForm.province),
        placeholder: "如：北京市",
    }, ...__VLS_functionalComponentArgsRest(__VLS_481));
    var __VLS_479;
    const __VLS_484 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_485 = __VLS_asFunctionalComponent(__VLS_484, new __VLS_484({
        label: "城市",
        prop: "city",
    }));
    const __VLS_486 = __VLS_485({
        label: "城市",
        prop: "city",
    }, ...__VLS_functionalComponentArgsRest(__VLS_485));
    __VLS_487.slots.default;
    const __VLS_488 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_489 = __VLS_asFunctionalComponent(__VLS_488, new __VLS_488({
        modelValue: (__VLS_ctx.addressForm.city),
        placeholder: "如：北京市",
    }));
    const __VLS_490 = __VLS_489({
        modelValue: (__VLS_ctx.addressForm.city),
        placeholder: "如：北京市",
    }, ...__VLS_functionalComponentArgsRest(__VLS_489));
    var __VLS_487;
    const __VLS_492 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_493 = __VLS_asFunctionalComponent(__VLS_492, new __VLS_492({
        label: "区/县",
        prop: "district",
    }));
    const __VLS_494 = __VLS_493({
        label: "区/县",
        prop: "district",
    }, ...__VLS_functionalComponentArgsRest(__VLS_493));
    __VLS_495.slots.default;
    const __VLS_496 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_497 = __VLS_asFunctionalComponent(__VLS_496, new __VLS_496({
        modelValue: (__VLS_ctx.addressForm.district),
        placeholder: "如：海淀区",
    }));
    const __VLS_498 = __VLS_497({
        modelValue: (__VLS_ctx.addressForm.district),
        placeholder: "如：海淀区",
    }, ...__VLS_functionalComponentArgsRest(__VLS_497));
    var __VLS_495;
    const __VLS_500 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_501 = __VLS_asFunctionalComponent(__VLS_500, new __VLS_500({
        label: "标签",
        prop: "label",
    }));
    const __VLS_502 = __VLS_501({
        label: "标签",
        prop: "label",
    }, ...__VLS_functionalComponentArgsRest(__VLS_501));
    __VLS_503.slots.default;
    const __VLS_504 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_505 = __VLS_asFunctionalComponent(__VLS_504, new __VLS_504({
        modelValue: (__VLS_ctx.addressForm.label),
        placeholder: "如：家/公司（可选）",
    }));
    const __VLS_506 = __VLS_505({
        modelValue: (__VLS_ctx.addressForm.label),
        placeholder: "如：家/公司（可选）",
    }, ...__VLS_functionalComponentArgsRest(__VLS_505));
    var __VLS_503;
    const __VLS_508 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_509 = __VLS_asFunctionalComponent(__VLS_508, new __VLS_508({
        label: "详细地址",
        prop: "detail",
    }));
    const __VLS_510 = __VLS_509({
        label: "详细地址",
        prop: "detail",
    }, ...__VLS_functionalComponentArgsRest(__VLS_509));
    __VLS_511.slots.default;
    const __VLS_512 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_513 = __VLS_asFunctionalComponent(__VLS_512, new __VLS_512({
        modelValue: (__VLS_ctx.addressForm.detail),
        type: "textarea",
        rows: (3),
        placeholder: "街道、门牌号等",
    }));
    const __VLS_514 = __VLS_513({
        modelValue: (__VLS_ctx.addressForm.detail),
        type: "textarea",
        rows: (3),
        placeholder: "街道、门牌号等",
    }, ...__VLS_functionalComponentArgsRest(__VLS_513));
    var __VLS_511;
    const __VLS_516 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_517 = __VLS_asFunctionalComponent(__VLS_516, new __VLS_516({}));
    const __VLS_518 = __VLS_517({}, ...__VLS_functionalComponentArgsRest(__VLS_517));
    __VLS_519.slots.default;
    const __VLS_520 = {}.ElCheckbox;
    /** @type {[typeof __VLS_components.ElCheckbox, typeof __VLS_components.elCheckbox, typeof __VLS_components.ElCheckbox, typeof __VLS_components.elCheckbox, ]} */ ;
    // @ts-ignore
    const __VLS_521 = __VLS_asFunctionalComponent(__VLS_520, new __VLS_520({
        modelValue: (__VLS_ctx.addressForm.is_default),
    }));
    const __VLS_522 = __VLS_521({
        modelValue: (__VLS_ctx.addressForm.is_default),
    }, ...__VLS_functionalComponentArgsRest(__VLS_521));
    __VLS_523.slots.default;
    var __VLS_523;
    var __VLS_519;
    const __VLS_524 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_525 = __VLS_asFunctionalComponent(__VLS_524, new __VLS_524({}));
    const __VLS_526 = __VLS_525({}, ...__VLS_functionalComponentArgsRest(__VLS_525));
    __VLS_527.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-3" },
    });
    const __VLS_528 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_529 = __VLS_asFunctionalComponent(__VLS_528, new __VLS_528({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.addressSaving),
    }));
    const __VLS_530 = __VLS_529({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.addressSaving),
    }, ...__VLS_functionalComponentArgsRest(__VLS_529));
    let __VLS_532;
    let __VLS_533;
    let __VLS_534;
    const __VLS_535 = {
        onClick: (__VLS_ctx.saveAddress)
    };
    __VLS_531.slots.default;
    var __VLS_531;
    const __VLS_536 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_537 = __VLS_asFunctionalComponent(__VLS_536, new __VLS_536({
        ...{ 'onClick': {} },
        disabled: (__VLS_ctx.addressSaving),
    }));
    const __VLS_538 = __VLS_537({
        ...{ 'onClick': {} },
        disabled: (__VLS_ctx.addressSaving),
    }, ...__VLS_functionalComponentArgsRest(__VLS_537));
    let __VLS_540;
    let __VLS_541;
    let __VLS_542;
    const __VLS_543 = {
        onClick: (__VLS_ctx.resetAddressForm)
    };
    __VLS_539.slots.default;
    var __VLS_539;
    var __VLS_527;
    var __VLS_457;
}
var __VLS_449;
/** @type {__VLS_StyleScopedClasses['max-w-6xl']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['md:items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['md:justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['md:flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['md:items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['md:justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['py-6']} */ ;
/** @type {__VLS_StyleScopedClasses['py-6']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['md:flex-row']} */ ;
/** @type {__VLS_StyleScopedClasses['md:items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['md:justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['w-16']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
// @ts-ignore
var __VLS_189 = __VLS_188, __VLS_459 = __VLS_458;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            activeTab: activeTab,
            hasToken: hasToken,
            logoutLoading: logoutLoading,
            profile: profile,
            orderStatus: orderStatus,
            ordersLoading: ordersLoading,
            ordersError: ordersError,
            orders: orders,
            detailOpen: detailOpen,
            detailLoading: detailLoading,
            detailError: detailError,
            orderDetail: orderDetail,
            payOpen: payOpen,
            payLoading: payLoading,
            payMethod: payMethod,
            reviewOpen: reviewOpen,
            reviewLoading: reviewLoading,
            reviewForm: reviewForm,
            afterSaleOpen: afterSaleOpen,
            afterSaleLoading: afterSaleLoading,
            afterSaleForm: afterSaleForm,
            pwdFormRef: pwdFormRef,
            pwdSubmitting: pwdSubmitting,
            pwdForm: pwdForm,
            pwdRules: pwdRules,
            addressLoading: addressLoading,
            addressError: addressError,
            addresses: addresses,
            addressOpen: addressOpen,
            addressSaving: addressSaving,
            addressEditingId: addressEditingId,
            addressFormRef: addressFormRef,
            addressForm: addressForm,
            addressRules: addressRules,
            paymentText: paymentText,
            statusLabel: statusLabel,
            statusTagType: statusTagType,
            canCancel: canCancel,
            canAfterSale: canAfterSale,
            fetchOrders: fetchOrders,
            fetchAddresses: fetchAddresses,
            resetAddressForm: resetAddressForm,
            openAddAddress: openAddAddress,
            openEditAddress: openEditAddress,
            saveAddress: saveAddress,
            removeAddress: removeAddress,
            setDefault: setDefault,
            openDetail: openDetail,
            openPay: openPay,
            submitPay: submitPay,
            cancelOrder: cancelOrder,
            openReview: openReview,
            submitReview: submitReview,
            openAfterSale: openAfterSale,
            submitAfterSale: submitAfterSale,
            goHome: goHome,
            logout: logout,
            resetPwdForm: resetPwdForm,
            submitChangePassword: submitChangePassword,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=UserCenter.vue.js.map