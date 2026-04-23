import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
export function useLoginMode() {
    const route = useRoute();
    const router = useRouter();
    const isUserMode = computed(() => route.path === '/login');
    const isAdminMode = computed(() => route.path === '/admin/login');
    const toggleMode = async () => {
        if (isUserMode.value) {
            await router.push('/admin/login');
        }
        else {
            await router.push('/login');
        }
    };
    return {
        isUserMode,
        isAdminMode,
        toggleMode
    };
}
//# sourceMappingURL=useLoginMode.js.map