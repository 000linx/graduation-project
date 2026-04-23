import { onBeforeUnmount, ref } from 'vue';
export function useSpeechRecognition(options = {}) {
    const supported = ref(false);
    const listening = ref(false);
    const transcript = ref('');
    const partial = ref('');
    const error = ref(null);
    const Ctor = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
    supported.value = Boolean(Ctor);
    let rec = null;
    function ensure() {
        if (!Ctor)
            return null;
        if (rec)
            return rec;
        rec = new Ctor();
        rec.lang = options.lang ?? 'zh-CN';
        rec.continuous = true;
        rec.interimResults = true;
        rec.onstart = () => {
            listening.value = true;
            error.value = null;
            partial.value = '';
        };
        rec.onend = () => {
            listening.value = false;
            partial.value = '';
        };
        rec.onerror = (e) => {
            error.value = e?.error || '语音识别失败';
        };
        rec.onresult = (e) => {
            const results = [];
            for (let i = e.resultIndex; i < e.results.length; i += 1) {
                const r = e.results[i];
                const t = String(r?.[0]?.transcript ?? '').trim();
                if (!t)
                    continue;
                results.push({ transcript: t, isFinal: Boolean(r?.isFinal) });
            }
            const finals = results.filter((r) => r.isFinal).map((r) => r.transcript).join(' ');
            const interims = results.filter((r) => !r.isFinal).map((r) => r.transcript).join(' ');
            if (finals)
                transcript.value = [transcript.value, finals].filter(Boolean).join(' ').trim();
            partial.value = interims;
        };
        return rec;
    }
    function start() {
        const r = ensure();
        if (!r)
            return false;
        try {
            transcript.value = '';
            partial.value = '';
            r.start();
            return true;
        }
        catch (e) {
            error.value = e?.message || '语音识别启动失败';
            return false;
        }
    }
    function stop() {
        if (!rec)
            return;
        try {
            rec.stop();
        }
        catch {
        }
    }
    onBeforeUnmount(() => {
        stop();
        rec = null;
    });
    return { supported, listening, transcript, partial, error, start, stop };
}
//# sourceMappingURL=useSpeechRecognition.js.map