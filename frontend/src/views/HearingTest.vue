<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import http, { unwrap } from '@/api/http'
import { notify } from '@/utils/notify'
import HearingAudiogramChart from '@/components/hearing/HearingAudiogramChart.vue'

type Ear = 'left' | 'right'
type Thresholds = { left: Record<string, number>; right: Record<string, number> }
type HearingTestDoc = {
  _id: string
  created_at: string
  thresholds: Thresholds
  report?: any
}

const step = ref(0)

const ackHeadphones = ref(false)
const ackQuiet = ref(false)
const canEnterTest = computed(() => ackHeadphones.value && ackQuiet.value)

const noiseActive = ref(false)
const noiseText = ref<string | null>(null)
let noiseStream: MediaStream | null = null
let noiseAudio: AudioContext | null = null
let noiseAnalyser: AnalyserNode | null = null
let noiseTimer: number | null = null

async function startNoiseCheck() {
  if (noiseActive.value) return
  noiseText.value = null
  try {
    noiseStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    noiseAudio = new AudioContext()
    const src = noiseAudio.createMediaStreamSource(noiseStream)
    noiseAnalyser = noiseAudio.createAnalyser()
    noiseAnalyser.fftSize = 2048
    src.connect(noiseAnalyser)
    noiseActive.value = true
    const buf = new Float32Array(noiseAnalyser.fftSize)
    noiseTimer = window.setInterval(() => {
      if (!noiseAnalyser) return
      noiseAnalyser.getFloatTimeDomainData(buf)
      let sum = 0
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
      const rms = Math.sqrt(sum / buf.length)
      const dbfs = 20 * Math.log10(Math.max(rms, 1e-8))
      if (dbfs < -55) noiseText.value = '环境较安静（基于麦克风相对测量）'
      else if (dbfs < -45) noiseText.value = '环境一般安静（基于麦克风相对测量）'
      else noiseText.value = '环境可能偏吵（基于麦克风相对测量）'
    }, 260)
  } catch (e: any) {
    noiseText.value = e?.message ? `无法检测环境噪声：${e.message}` : '无法检测环境噪声'
    stopNoiseCheck()
  }
}

function stopNoiseCheck() {
  noiseActive.value = false
  if (noiseTimer) window.clearInterval(noiseTimer)
  noiseTimer = null
  try {
    noiseAnalyser?.disconnect()
  } catch {}
  noiseAnalyser = null
  try {
    noiseStream?.getTracks()?.forEach((t) => t.stop())
  } catch {}
  noiseStream = null
  try {
    noiseAudio?.close()
  } catch {}
  noiseAudio = null
}

const freqs = [250, 500, 1000, 2000, 4000, 8000]
const earOrder: Ear[] = ['left', 'right']

const thresholds = ref<Thresholds>({ left: {}, right: {} })

const earIndex = ref(0)
const freqIndex = ref(0)
const currentEar = computed(() => earOrder[earIndex.value] ?? 'left')
const currentFreq = computed(() => freqs[freqIndex.value] ?? 1000)

const maxDb = 80
const stepDb = 5

const stage = ref<'search' | 'confirm'>('search')
const levelDb = ref(0)
const confirmTrials = ref(0)
const confirmYes = ref(0)

const playing = ref(false)
const played = ref(false)

let audio: AudioContext | null = null
let activeNodes: { osc: OscillatorNode; gain: GainNode; panner: StereoPannerNode } | null = null

async function ensureAudio() {
  if (!audio) audio = new AudioContext()
  if (audio.state !== 'running') await audio.resume()
}

function stopTone() {
  try {
    activeNodes?.osc?.stop()
  } catch {}
  try {
    activeNodes?.osc?.disconnect()
  } catch {}
  try {
    activeNodes?.gain?.disconnect()
  } catch {}
  try {
    activeNodes?.panner?.disconnect()
  } catch {}
  activeNodes = null
  playing.value = false
}

function gainFromDb(db: number) {
  const capped = Math.max(0, Math.min(maxDb, db))
  const amp = 0.2 * Math.pow(10, (capped - maxDb) / 20)
  return Math.max(0, Math.min(0.2, amp))
}

async function playTone() {
  if (playing.value) return
  played.value = false
  try {
    await ensureAudio()
  } catch {
    notify('音频初始化失败，请确认浏览器允许播放声音', { tone: 'error', flash: true })
    return
  }

  stopTone()
  if (!audio) return

  const osc = audio.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = Number(currentFreq.value)

  const gain = audio.createGain()
  const panner = audio.createStereoPanner()
  panner.pan.value = currentEar.value === 'left' ? -1 : 1

  const g = gainFromDb(levelDb.value)
  const now = audio.currentTime
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(g, now + 0.02)
  gain.gain.setValueAtTime(g, now + 0.9)
  gain.gain.linearRampToValueAtTime(0, now + 1.0)

  osc.connect(gain)
  gain.connect(panner)
  panner.connect(audio.destination)
  activeNodes = { osc, gain, panner }

  playing.value = true
  try {
    osc.start(now)
    osc.stop(now + 1.02)
  } catch {}

  await new Promise<void>((resolve) => {
    const t = window.setTimeout(() => {
      window.clearTimeout(t)
      resolve()
    }, 1120)
  })
  playing.value = false
  played.value = true
  stopTone()
}

function resetFreqState() {
  stage.value = 'search'
  levelDb.value = 0
  confirmTrials.value = 0
  confirmYes.value = 0
  played.value = false
  playing.value = false
}

function setThreshold(ear: Ear, freq: number, db: number) {
  thresholds.value[ear][String(freq)] = Math.round(db)
}

function nextPoint() {
  resetFreqState()
  if (freqIndex.value < freqs.length - 1) {
    freqIndex.value += 1
    return
  }
  if (earIndex.value < earOrder.length - 1) {
    earIndex.value += 1
    freqIndex.value = 0
    return
  }
  step.value = 2
  stopNoiseCheck()
}

function answer(heard: boolean) {
  if (!played.value) {
    notify('请先点击“播放测试音”再反馈是否听到', { tone: 'warning' })
    return
  }
  played.value = false

  if (stage.value === 'search') {
    if (heard) {
      stage.value = 'confirm'
      levelDb.value = Math.max(levelDb.value - 10, 0)
      confirmTrials.value = 0
      confirmYes.value = 0
      return
    }
    const next = levelDb.value + stepDb
    if (next > maxDb) {
      setThreshold(currentEar.value, currentFreq.value, maxDb)
      nextPoint()
    } else {
      levelDb.value = next
    }
    return
  }

  confirmTrials.value += 1
  if (heard) confirmYes.value += 1

  if (confirmTrials.value < 3) return

  if (confirmYes.value >= 2) {
    setThreshold(currentEar.value, currentFreq.value, levelDb.value)
    nextPoint()
    return
  }

  const up = levelDb.value + stepDb
  if (up > maxDb) {
    setThreshold(currentEar.value, currentFreq.value, maxDb)
    nextPoint()
    return
  }

  levelDb.value = up
  confirmTrials.value = 0
  confirmYes.value = 0
}

const progressText = computed(() => {
  const earLabel = currentEar.value === 'left' ? '左耳' : '右耳'
  return `${earLabel} · ${currentFreq.value} Hz · ${levelDb.value} dB HL`
})

const finished = computed(() => step.value === 2)

function pta(ear: Ear) {
  const src = thresholds.value[ear]
  const pick = [500, 1000, 2000, 4000]
    .map((f) => src[String(f)])
    .filter((v) => typeof v === 'number' && Number.isFinite(v))
  if (!pick.length) return 0
  return pick.reduce((a, b) => a + b, 0) / pick.length
}

function degreeLabel(ptaValue: number) {
  if (ptaValue <= 25) return '正常'
  if (ptaValue <= 40) return '轻度'
  if (ptaValue <= 55) return '中度'
  if (ptaValue <= 70) return '中重度'
  if (ptaValue <= 90) return '重度'
  return '极重度'
}

const leftPta = computed(() => Number(pta('left').toFixed(1)))
const rightPta = computed(() => Number(pta('right').toFixed(1)))
const leftDegree = computed(() => degreeLabel(leftPta.value))
const rightDegree = computed(() => degreeLabel(rightPta.value))

function startTest() {
  if (!canEnterTest.value) return
  thresholds.value = { left: {}, right: {} }
  earIndex.value = 0
  freqIndex.value = 0
  resetFreqState()
  step.value = 1
}

function restart() {
  stopTone()
  thresholds.value = { left: {}, right: {} }
  earIndex.value = 0
  freqIndex.value = 0
  resetFreqState()
  step.value = 0
}

const chartRef = ref<InstanceType<typeof HearingAudiogramChart> | null>(null)
function downloadChart() {
  const url = chartRef.value?.exportPng?.()
  if (!url) {
    notify('导出失败', { tone: 'error' })
    return
  }
  const a = document.createElement('a')
  a.href = url
  a.download = `hearing-audiogram-${new Date().toISOString().slice(0, 10)}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const saving = ref(false)
const savedDoc = ref<HearingTestDoc | null>(null)

async function saveReport() {
  if (saving.value) return
  saving.value = true
  try {
    const resp = await http.post('/api/user/hearing_tests', {
      thresholds: thresholds.value,
      meta: {
        device: 'web',
        procedure: 'pure_tone_air_conduction',
        algo: 'search_5db_up_then_confirm_2of3',
        freqs
      }
    })
    const data = unwrap<{ hearing_test: HearingTestDoc }>(resp)
    savedDoc.value = data?.hearing_test ?? null
    notify('已保存听力报告', { tone: 'success', flash: true })
  } catch (e: any) {
    notify(e?.response?.data?.message || e?.message || '保存失败', { tone: 'error', flash: true })
  } finally {
    saving.value = false
  }
}

onBeforeUnmount(() => {
  stopTone()
  stopNoiseCheck()
  try {
    audio?.close()
  } catch {}
  audio = null
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-3xl p-6 shadow-sm">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="text-2xl font-extrabold text-[var(--c-text)]">在线听力检测（纯音测听）</div>
          <div class="mt-1 text-sm font-semibold text-[var(--c-muted)]">
            依次完成左耳与右耳测试，覆盖 250/500/1k/2k/4k/8k Hz 频点，生成听力图与基础解读。
          </div>
        </div>
        <div class="flex items-center gap-2">
          <el-button v-if="step !== 0" @click="restart">重新开始</el-button>
        </div>
      </div>
    </div>

    <div class="mt-6 bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-3xl p-6 shadow-sm">
      <el-steps :active="step" finish-status="success" align-center>
        <el-step title="开始前确认" />
        <el-step title="测试流程" />
        <el-step title="听力报告" />
      </el-steps>

      <div v-if="step === 0" class="mt-6 space-y-4">
        <el-alert
          type="warning"
          show-icon
          title="开始测试前请务必确认"
          description="必须佩戴立体声耳机，并处于相对安静环境（环境噪音低于40分贝）才能开始测试。"
        />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="border-2 border-[var(--c-border)] rounded-2xl p-5 bg-[var(--c-bg)]">
            <div class="text-base font-extrabold text-[var(--c-text)]">必选确认</div>
            <div class="mt-4 space-y-3">
              <el-checkbox v-model="ackHeadphones" label="我已佩戴立体声耳机（左右声道正常）" />
              <el-checkbox v-model="ackQuiet" label="我已处于相对安静环境（环境噪音低于40分贝）" />
            </div>
          </div>

          <div class="border-2 border-[var(--c-border)] rounded-2xl p-5 bg-[var(--c-bg)]">
            <div class="text-base font-extrabold text-[var(--c-text)]">环境噪声提示（可选）</div>
            <div class="mt-2 text-sm font-semibold text-[var(--c-muted)]">
              可使用麦克风进行相对噪声检测，但无法替代专业分贝仪的 40 dB SPL 校准。
            </div>
            <div class="mt-4 flex items-center gap-2">
              <el-button :disabled="noiseActive" @click="startNoiseCheck">开始检测</el-button>
              <el-button :disabled="!noiseActive" @click="stopNoiseCheck">停止</el-button>
            </div>
            <div class="mt-3 text-sm font-extrabold text-[var(--c-text)]" aria-live="polite">
              {{ noiseText || '未开始检测' }}
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3">
          <el-button type="primary" :disabled="!canEnterTest" @click="startTest">进入测试流程</el-button>
        </div>
      </div>

      <div v-else-if="step === 1" class="mt-6 space-y-4">
        <el-alert
          type="info"
          show-icon
          title="测试规则"
          description="每次点击“播放测试音”后，请立即选择“听到了”或“没听到”。系统从 0 dB 开始逐步提升刺激强度，并根据 2/3 次响应原则记录听阈。"
        />

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="md:col-span-2 border-2 border-[var(--c-border)] rounded-2xl p-5 bg-[var(--c-bg)]">
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <div class="text-lg font-extrabold text-[var(--c-text)]">{{ progressText }}</div>
              <div class="text-sm font-semibold text-[var(--c-muted)]">
                频点 {{ freqIndex + 1 }}/{{ freqs.length }} · 耳别 {{ earIndex + 1 }}/{{ earOrder.length }}
              </div>
            </div>

            <div class="mt-4 flex flex-wrap items-center gap-3">
              <el-button type="primary" :loading="playing" @click="playTone">播放测试音</el-button>
              <el-button :disabled="playing" type="success" @click="answer(true)">听到了</el-button>
              <el-button :disabled="playing" type="warning" @click="answer(false)">没听到</el-button>
              <div class="text-sm font-semibold text-[var(--c-muted)]">
                当前阶段：{{ stage === 'search' ? '阈值搜索' : `阈值确认（${confirmTrials}/3）` }}
              </div>
            </div>
          </div>

          <div class="border-2 border-[var(--c-border)] rounded-2xl p-5 bg-[var(--c-bg)]">
            <div class="text-base font-extrabold text-[var(--c-text)]">已记录阈值</div>
            <div class="mt-3 text-sm font-semibold text-[var(--c-muted)]">左耳</div>
            <div class="mt-2 grid grid-cols-3 gap-2 text-sm font-extrabold text-[var(--c-text)]">
              <div
                v-for="f in freqs"
                :key="`l-${f}`"
                class="rounded-xl border-2 border-[var(--c-border)] p-2 bg-[var(--c-surface)]"
              >
                <div class="text-[var(--c-muted)] text-xs font-semibold">{{ f }}Hz</div>
                <div>{{ thresholds.left[String(f)] ?? '-' }}</div>
              </div>
            </div>
            <div class="mt-4 text-sm font-semibold text-[var(--c-muted)]">右耳</div>
            <div class="mt-2 grid grid-cols-3 gap-2 text-sm font-extrabold text-[var(--c-text)]">
              <div
                v-for="f in freqs"
                :key="`r-${f}`"
                class="rounded-xl border-2 border-[var(--c-border)] p-2 bg-[var(--c-surface)]"
              >
                <div class="text-[var(--c-muted)] text-xs font-semibold">{{ f }}Hz</div>
                <div>{{ thresholds.right[String(f)] ?? '-' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="finished" class="mt-6 space-y-4">
        <el-alert
          type="success"
          show-icon
          title="听力报告已生成"
          description="听力图为气导阈值曲线（右耳红色圆点、左耳蓝色叉号）。结果仅供健康参考，不能替代临床听力检查。"
        />

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="lg:col-span-2">
            <HearingAudiogramChart ref="chartRef" :thresholds="thresholds" :height="460" />
            <div class="mt-3 flex items-center justify-end gap-2">
              <el-button @click="downloadChart">导出听力图</el-button>
            </div>
          </div>
          <div class="border-2 border-[var(--c-border)] rounded-2xl p-5 bg-[var(--c-bg)]">
            <div class="text-base font-extrabold text-[var(--c-text)]">基础解读</div>
            <div class="mt-3 space-y-3 text-sm font-semibold text-[var(--c-text)]">
              <div class="rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-surface)] p-3">
                <div class="text-xs font-semibold text-[var(--c-muted)]">左耳（PTA 500/1k/2k/4k）</div>
                <div class="mt-1 text-lg font-extrabold">{{ leftPta }} dB HL · {{ leftDegree }}</div>
              </div>
              <div class="rounded-xl border-2 border-[var(--c-border)] bg-[var(--c-surface)] p-3">
                <div class="text-xs font-semibold text-[var(--c-muted)]">右耳（PTA 500/1k/2k/4k）</div>
                <div class="mt-1 text-lg font-extrabold">{{ rightPta }} dB HL · {{ rightDegree }}</div>
              </div>
              <div class="text-xs font-semibold text-[var(--c-muted)]">
                若一侧明显高于另一侧、或 PTA ≥ 40 dB
                HL，建议尽快前往正规医院/机构进行标准纯音测听与声导抗检查。
              </div>
            </div>

            <div class="mt-5 flex items-center gap-2">
              <el-button type="primary" :loading="saving" @click="saveReport">保存到我的账户</el-button>
              <el-tag v-if="savedDoc?._id" type="success">已保存</el-tag>
            </div>
            <div v-if="savedDoc?._id" class="mt-2 text-xs font-semibold text-[var(--c-muted)]">
              报告编号：{{ savedDoc._id }} · 保存时间：{{ savedDoc.created_at }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
