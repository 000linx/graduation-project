/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useA11yStore } from '../../stores/a11y';
import { useSpeechStore } from '../../stores/speech';
const a11y = useA11yStore();
const speech = useSpeechStore();
const scalePercent = computed({
    get: () => Number((a11y.fontScale * 100).toFixed(1)),
    set: (v) => a11y.setFontScale(Number(v) / 100)
});
function onToggleVoice(v) {
    a11y.setVoiceEnabled(v);
    if (v) {
        const ok = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
        if (!ok)
            ElMessage.warning('当前浏览器不支持语音输入（Web Speech API）');
    }
    else {
        speech.stop();
        speech.reset();
    }
}
watch(() => a11y.voiceEnabled, (v) => {
    if (!v) {
        speech.stop();
        speech.reset();
    }
});
function toggleSpeech() {
    if (!speech.supported) {
        ElMessage.warning('当前浏览器不支持语音输入（Web Speech API）');
        return;
    }
    if (!a11y.voiceEnabled)
        a11y.setVoiceEnabled(true);
    if (speech.listening)
        speech.stop();
    else
        speech.start('zh-CN');
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['a11y-toolbtn']} */ ;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.ElPopover;
/** @type {[typeof __VLS_components.ElPopover, typeof __VLS_components.elPopover, typeof __VLS_components.ElPopover, typeof __VLS_components.elPopover, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    placement: "bottom-end",
    trigger: "click",
    width: (__VLS_ctx.a11y.largeTextEnabled ? 360 : 320),
}));
const __VLS_2 = __VLS_1({
    placement: "bottom-end",
    trigger: "click",
    width: (__VLS_ctx.a11y.largeTextEnabled ? 360 : 320),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
{
    const { reference: __VLS_thisSlot } = __VLS_3.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: "button",
        ...{ class: "a11y-toolbtn" },
        'aria-label': "无障碍与适老化设置",
    });
    __VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-base font-bold" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 gap-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "a11y-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "a11y-row__label" },
});
const __VLS_5 = {}.ElSwitch;
/** @type {[typeof __VLS_components.ElSwitch, typeof __VLS_components.elSwitch, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    ...{ 'onChange': {} },
    dataTestid: "a11y-hc",
    modelValue: (__VLS_ctx.a11y.highContrast),
}));
const __VLS_7 = __VLS_6({
    ...{ 'onChange': {} },
    dataTestid: "a11y-hc",
    modelValue: (__VLS_ctx.a11y.highContrast),
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
let __VLS_9;
let __VLS_10;
let __VLS_11;
const __VLS_12 = {
    onChange: ((v) => __VLS_ctx.a11y.setHighContrast(Boolean(v)))
};
var __VLS_8;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "a11y-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "a11y-row__label" },
});
const __VLS_13 = {}.ElSwitch;
/** @type {[typeof __VLS_components.ElSwitch, typeof __VLS_components.elSwitch, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    ...{ 'onChange': {} },
    dataTestid: "a11y-large",
    modelValue: (__VLS_ctx.a11y.largeTextEnabled),
}));
const __VLS_15 = __VLS_14({
    ...{ 'onChange': {} },
    dataTestid: "a11y-large",
    modelValue: (__VLS_ctx.a11y.largeTextEnabled),
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
let __VLS_17;
let __VLS_18;
let __VLS_19;
const __VLS_20 = {
    onChange: (() => __VLS_ctx.a11y.toggleLargeText())
};
var __VLS_16;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "a11y-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "a11y-row__label" },
});
const __VLS_21 = {}.ElSwitch;
/** @type {[typeof __VLS_components.ElSwitch, typeof __VLS_components.elSwitch, ]} */ ;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
    ...{ 'onChange': {} },
    dataTestid: "a11y-voice",
    modelValue: (__VLS_ctx.a11y.voiceEnabled),
}));
const __VLS_23 = __VLS_22({
    ...{ 'onChange': {} },
    dataTestid: "a11y-voice",
    modelValue: (__VLS_ctx.a11y.voiceEnabled),
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
let __VLS_25;
let __VLS_26;
let __VLS_27;
const __VLS_28 = {
    onChange: ((v) => __VLS_ctx.onToggleVoice(Boolean(v)))
};
var __VLS_24;
if (__VLS_ctx.a11y.voiceEnabled) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-sm font-semibold" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-2" },
    });
    const __VLS_29 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
        ...{ 'onClick': {} },
        type: "primary",
        ...{ class: "a11y-hit" },
    }));
    const __VLS_31 = __VLS_30({
        ...{ 'onClick': {} },
        type: "primary",
        ...{ class: "a11y-hit" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_30));
    let __VLS_33;
    let __VLS_34;
    let __VLS_35;
    const __VLS_36 = {
        onClick: (__VLS_ctx.toggleSpeech)
    };
    __VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
    __VLS_32.slots.default;
    (__VLS_ctx.speech.listening ? '停止语音输入' : '开始语音输入');
    var __VLS_32;
    if (__VLS_ctx.speech.hasText) {
        const __VLS_37 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
            ...{ 'onClick': {} },
            ...{ class: "a11y-hit" },
        }));
        const __VLS_39 = __VLS_38({
            ...{ 'onClick': {} },
            ...{ class: "a11y-hit" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_38));
        let __VLS_41;
        let __VLS_42;
        let __VLS_43;
        const __VLS_44 = {
            onClick: (__VLS_ctx.speech.reset)
        };
        __VLS_asFunctionalDirective(__VLS_directives.vFeedback)(null, { ...__VLS_directiveBindingRestFields, }, null, null);
        __VLS_40.slots.default;
        var __VLS_40;
    }
    if (__VLS_ctx.speech.error) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-xs font-bold" },
            ...{ style: {} },
        });
        (__VLS_ctx.speech.error);
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-xs" },
            ...{ style: {} },
        });
        (__VLS_ctx.speech.supported ? (__VLS_ctx.speech.listening ? '正在聆听…可在页面顶部看到字幕叠加' : '点击开始后说出要搜索的关键词') : '当前浏览器不支持 Web Speech API');
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "a11y-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "a11y-row__label" },
});
const __VLS_45 = {}.ElSwitch;
/** @type {[typeof __VLS_components.ElSwitch, typeof __VLS_components.elSwitch, ]} */ ;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
    ...{ 'onChange': {} },
    dataTestid: "a11y-tts",
    modelValue: (__VLS_ctx.a11y.ttsEnabled),
}));
const __VLS_47 = __VLS_46({
    ...{ 'onChange': {} },
    dataTestid: "a11y-tts",
    modelValue: (__VLS_ctx.a11y.ttsEnabled),
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
let __VLS_49;
let __VLS_50;
let __VLS_51;
const __VLS_52 = {
    onChange: ((v) => __VLS_ctx.a11y.setTtsEnabled(Boolean(v)))
};
var __VLS_48;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "a11y-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "a11y-row__label" },
});
const __VLS_53 = {}.ElSwitch;
/** @type {[typeof __VLS_components.ElSwitch, typeof __VLS_components.elSwitch, ]} */ ;
// @ts-ignore
const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
    ...{ 'onChange': {} },
    dataTestid: "a11y-captions",
    modelValue: (__VLS_ctx.a11y.captionsOverlay),
}));
const __VLS_55 = __VLS_54({
    ...{ 'onChange': {} },
    dataTestid: "a11y-captions",
    modelValue: (__VLS_ctx.a11y.captionsOverlay),
}, ...__VLS_functionalComponentArgsRest(__VLS_54));
let __VLS_57;
let __VLS_58;
let __VLS_59;
const __VLS_60 = {
    onChange: ((v) => __VLS_ctx.a11y.setCaptionsOverlay(Boolean(v)))
};
var __VLS_56;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-sm font-semibold" },
    ...{ style: {} },
});
const __VLS_61 = {}.ElSlider;
/** @type {[typeof __VLS_components.ElSlider, typeof __VLS_components.elSlider, ]} */ ;
// @ts-ignore
const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
    modelValue: (__VLS_ctx.scalePercent),
    min: (100),
    max: (200),
    step: (12.5),
}));
const __VLS_63 = __VLS_62({
    modelValue: (__VLS_ctx.scalePercent),
    min: (100),
    max: (200),
    step: (12.5),
}, ...__VLS_functionalComponentArgsRest(__VLS_62));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-sm" },
    ...{ style: {} },
});
(__VLS_ctx.scalePercent);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "space-y-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-sm font-semibold" },
    ...{ style: {} },
});
const __VLS_65 = {}.ElRadioGroup;
/** @type {[typeof __VLS_components.ElRadioGroup, typeof __VLS_components.elRadioGroup, typeof __VLS_components.ElRadioGroup, typeof __VLS_components.elRadioGroup, ]} */ ;
// @ts-ignore
const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.a11y.interactionFeedback),
    ...{ class: "a11y-radio" },
}));
const __VLS_67 = __VLS_66({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.a11y.interactionFeedback),
    ...{ class: "a11y-radio" },
}, ...__VLS_functionalComponentArgsRest(__VLS_66));
let __VLS_69;
let __VLS_70;
let __VLS_71;
const __VLS_72 = {
    onChange: ((v) => __VLS_ctx.a11y.setInteractionFeedback(v))
};
__VLS_68.slots.default;
const __VLS_73 = {}.ElRadioButton;
/** @type {[typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, ]} */ ;
// @ts-ignore
const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
    label: "focus",
}));
const __VLS_75 = __VLS_74({
    label: "focus",
}, ...__VLS_functionalComponentArgsRest(__VLS_74));
__VLS_76.slots.default;
var __VLS_76;
const __VLS_77 = {}.ElRadioButton;
/** @type {[typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, ]} */ ;
// @ts-ignore
const __VLS_78 = __VLS_asFunctionalComponent(__VLS_77, new __VLS_77({
    label: "haptic",
}));
const __VLS_79 = __VLS_78({
    label: "haptic",
}, ...__VLS_functionalComponentArgsRest(__VLS_78));
__VLS_80.slots.default;
var __VLS_80;
const __VLS_81 = {}.ElRadioButton;
/** @type {[typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, typeof __VLS_components.ElRadioButton, typeof __VLS_components.elRadioButton, ]} */ ;
// @ts-ignore
const __VLS_82 = __VLS_asFunctionalComponent(__VLS_81, new __VLS_81({
    label: "sound",
}));
const __VLS_83 = __VLS_82({
    label: "sound",
}, ...__VLS_functionalComponentArgsRest(__VLS_82));
__VLS_84.slots.default;
var __VLS_84;
var __VLS_68;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['a11y-toolbtn']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-row']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-row__label']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-row']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-row__label']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-row']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-row__label']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-hit']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-row']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-row__label']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-row']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-row__label']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['a11y-radio']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            a11y: a11y,
            speech: speech,
            scalePercent: scalePercent,
            onToggleVoice: onToggleVoice,
            toggleSpeech: toggleSpeech,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=A11yToolbar.vue.js.map