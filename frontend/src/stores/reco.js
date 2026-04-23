import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
import http, { unwrap } from '../api/http';
const PROFILE_KEY = 'hearing_profile_v1';
const ANON_KEY = 'anon_id_v1';
const SESSION_KEY = 'reco_session_v1';
function safeParse(raw) {
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function ensureId(key) {
    const existing = localStorage.getItem(key);
    if (existing)
        return existing;
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(key, id);
    return id;
}
export const useRecoStore = defineStore('reco', () => {
    const initialized = ref(false);
    const anonId = ref('');
    const sessionId = ref('');
    const variant = ref('A');
    const profile = reactive({
        hearing_level: '',
        scenes: [],
        budget_min: null,
        budget_max: null,
        brands: []
    });
    const loading = ref(false);
    const error = ref(null);
    const items = ref([]);
    const hasProfile = computed(() => Boolean(profile.hearing_level));
    function init() {
        if (initialized.value)
            return;
        initialized.value = true;
        anonId.value = ensureId(ANON_KEY);
        sessionId.value = ensureId(SESSION_KEY);
        const cached = safeParse(localStorage.getItem(PROFILE_KEY));
        if (cached && typeof cached === 'object') {
            profile.hearing_level = cached.hearing_level || '';
            profile.scenes = Array.isArray(cached.scenes) ? cached.scenes.map((x) => String(x)).filter(Boolean) : [];
            profile.budget_min = typeof cached.budget_min === 'number' ? cached.budget_min : null;
            profile.budget_max = typeof cached.budget_max === 'number' ? cached.budget_max : null;
            profile.brands = Array.isArray(cached.brands) ? cached.brands.map((x) => String(x)).filter(Boolean) : [];
        }
    }
    function persistProfile() {
        const payload = {
            hearing_level: profile.hearing_level,
            scenes: profile.scenes,
            budget_min: profile.budget_min,
            budget_max: profile.budget_max,
            brands: profile.brands
        };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(payload));
    }
    async function fetchRecommendations(limit = 12) {
        init();
        if (!profile.hearing_level) {
            items.value = [];
            return;
        }
        loading.value = true;
        error.value = null;
        try {
            const params = {
                hearing_level: profile.hearing_level,
                scenes: profile.scenes.join(','),
                brands: profile.brands.join(','),
                budget_min: profile.budget_min ?? undefined,
                budget_max: profile.budget_max ?? undefined,
                limit
            };
            const resp = await http.get('/api/product/recommendations', {
                params,
                headers: {
                    'X-Anonymous-Id': anonId.value,
                    'X-Reco-Session': sessionId.value
                }
            });
            const data = unwrap(resp);
            variant.value = data?.variant || 'A';
            items.value = Array.isArray(data?.items) ? data.items : [];
        }
        catch (e) {
            error.value = e?.response?.data?.message || e?.message || '加载失败';
            items.value = [];
        }
        finally {
            loading.value = false;
        }
    }
    async function track(event, payload = {}) {
        init();
        try {
            await http.post('/api/product/reco/event', {
                event,
                variant: variant.value,
                session_id: sessionId.value,
                product_id: payload.product_id,
                rank: payload.rank,
                meta: payload.meta ?? {}
            }, {
                headers: {
                    'X-Anonymous-Id': anonId.value,
                    'X-Reco-Session': sessionId.value
                }
            });
        }
        catch {
        }
    }
    async function loadProfileFromAccount() {
        init();
        try {
            const resp = await http.get('/api/user/hearing_profile');
            const data = unwrap(resp);
            const hp = data?.hearing_profile;
            if (hp && typeof hp === 'object') {
                profile.hearing_level = hp.hearing_level || profile.hearing_level;
                profile.scenes = Array.isArray(hp.scenes) ? hp.scenes.map((x) => String(x)).filter(Boolean) : profile.scenes;
                profile.budget_min = typeof hp.budget_min === 'number' ? hp.budget_min : profile.budget_min;
                profile.budget_max = typeof hp.budget_max === 'number' ? hp.budget_max : profile.budget_max;
                profile.brands = Array.isArray(hp.brands) ? hp.brands.map((x) => String(x)).filter(Boolean) : profile.brands;
                persistProfile();
            }
        }
        catch {
        }
    }
    async function saveProfileToAccount() {
        init();
        persistProfile();
        await http.put('/api/user/hearing_profile', { hearing_profile: profile });
    }
    return {
        anonId,
        sessionId,
        variant,
        profile,
        hasProfile,
        loading,
        error,
        items,
        init,
        persistProfile,
        fetchRecommendations,
        track,
        loadProfileFromAccount,
        saveProfileToAccount
    };
});
//# sourceMappingURL=reco.js.map