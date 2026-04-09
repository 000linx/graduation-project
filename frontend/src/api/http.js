import axios from 'axios';
import { ElMessage } from 'element-plus';
const http = axios.create();
http.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
http.interceptors.response.use((resp) => resp, (error) => {
    const status = error?.response?.status;
    const msg = error?.response?.data?.message || error?.message || '请求失败';
    if (status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        ElMessage.error('登录已过期，请重新登录');
    }
    else if (status === 403) {
        ElMessage.error('无权限访问');
    }
    else {
        ElMessage.error(String(msg));
    }
    return Promise.reject(error);
});
export function unwrap(resp) {
    return (resp?.data?.data ?? null);
}
export default http;
//# sourceMappingURL=http.js.map