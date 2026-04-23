import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import axios from 'axios';
export const useAdminAuthStore = defineStore('adminAuth', () => {
    const accessToken = ref(localStorage.getItem('admin_access_token'));
    const refreshToken = ref(localStorage.getItem('admin_refresh_token'));
    const userPhone = ref(null);
    const userName = ref(null);
    const isAuthed = computed(() => Boolean(accessToken.value));
    function syncFromStorage() {
        accessToken.value = localStorage.getItem('admin_access_token');
        refreshToken.value = localStorage.getItem('admin_refresh_token');
    }
    async function login(phone, password) {
        const resp = await axios.post('/api/user/login', { phone, password });
        const data = (resp?.data?.data ?? {});
        const at = data?.tokens?.access_token;
        const rt = data?.tokens?.refresh_token;
        if (!at) {
            throw new Error(resp?.data?.message || '登录失败');
        }
        localStorage.setItem('admin_access_token', String(at));
        if (rt)
            localStorage.setItem('admin_refresh_token', String(rt));
        accessToken.value = String(at);
        refreshToken.value = rt ? String(rt) : null;
        userPhone.value = data?.user?.phone ? String(data.user.phone) : phone;
        userName.value = data?.user?.username ? String(data.user.username) : null;
    }
    function logout() {
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        accessToken.value = null;
        refreshToken.value = null;
        userPhone.value = null;
        userName.value = null;
    }
    return { accessToken, refreshToken, userPhone, userName, isAuthed, syncFromStorage, login, logout };
});
//# sourceMappingURL=adminAuth.js.map