<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { notify } from '../../utils/notify'
import { useRecoStore } from '../../stores/reco'

const emit = defineEmits<{ (e: 'recommended'): void }>()

const reco = useRecoStore()
const saving = ref(false)
const loadingAccount = ref(false)
const hasToken = computed(() => Boolean(localStorage.getItem('access_token')))

const sceneOptions = ['日常交流', '看电视', '电话', '会议', '课堂', '户外']

const budget = computed({
  get: () => [reco.profile.budget_min ?? 0, reco.profile.budget_max ?? 8000],
  set: (v: any) => {
    const a = Array.isArray(v) ? v : [0, 8000]
    const min = Number(a[0] ?? 0)
    const max = Number(a[1] ?? 8000)
    reco.profile.budget_min = Math.min(min, max)
    reco.profile.budget_max = Math.max(min, max)
  }
})

const brandOptions = computed(() => {
  const set = new Set<string>(reco.profile.brands.map((x) => String(x).trim()).filter(Boolean))
  return Array.from(set)
})

async function saveToAccount() {
  if (!hasToken.value) {
    notify('登录后才可保存到账号', { tone: 'warning', flash: true })
    return
  }
  saving.value = true
  try {
    await reco.saveProfileToAccount()
    notify('已保存到账号', { tone: 'success' })
  } catch (e: any) {
    notify(e?.response?.data?.message || e?.message || '保存失败', { tone: 'error', flash: true })
  } finally {
    saving.value = false
  }
}

async function loadFromAccount() {
  if (!hasToken.value) {
    notify('登录后才可从账号同步', { tone: 'warning', flash: true })
    return
  }
  loadingAccount.value = true
  try {
    await reco.loadProfileFromAccount()
    notify('已从账号同步偏好', { tone: 'success' })
  } catch {
  } finally {
    loadingAccount.value = false
  }
}

function resetPrefs(keepLevel = true) {
  const level = reco.profile.hearing_level
  reco.profile.hearing_level = keepLevel ? level : ''
  reco.profile.scenes = []
  reco.profile.budget_min = null
  reco.profile.budget_max = null
  reco.profile.brands = []
  reco.persistProfile()
}

async function recommendNow() {
  if (!reco.profile.hearing_level) {
    notify('请先选择听力损失等级', { tone: 'warning', flash: true })
    return
  }
  emit('recommended')
}

onMounted(() => {
  reco.init()
})
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <div class="text-xl font-extrabold text-[var(--c-text)]">听力损失等级与偏好</div>
      <div class="text-sm font-bold text-[var(--c-muted)]">3 步完成：选等级 → 看推荐 → 加入购物车</div>
    </div>

    <div class="space-y-2">
      <div class="text-base font-bold text-[var(--c-text)]">听力损失等级</div>
      <el-radio-group v-model="reco.profile.hearing_level" @change="reco.persistProfile()">
        <el-radio-button label="轻度">轻度</el-radio-button>
        <el-radio-button label="中度">中度</el-radio-button>
        <el-radio-button label="重度">重度</el-radio-button>
        <el-radio-button label="极重度">极重度</el-radio-button>
      </el-radio-group>
    </div>

    <div class="space-y-2">
      <div class="text-base font-bold text-[var(--c-text)]">使用场景</div>
      <el-checkbox-group v-model="reco.profile.scenes" @change="reco.persistProfile()">
        <div class="grid grid-cols-2 gap-2">
          <el-checkbox-button v-for="s in sceneOptions" :key="s" :label="s">{{ s }}</el-checkbox-button>
        </div>
      </el-checkbox-group>
    </div>

    <div class="space-y-2">
      <div class="text-base font-bold text-[var(--c-text)]">预算区间（元）</div>
      <el-slider v-model="budget" range :min="0" :max="20000" :step="100" @change="reco.persistProfile()" />
      <div class="flex items-center gap-2">
        <el-input-number
          v-model="reco.profile.budget_min"
          :min="0"
          :max="20000"
          :step="100"
          @change="reco.persistProfile()"
        />
        <div class="text-sm font-bold text-[var(--c-muted)]">到</div>
        <el-input-number
          v-model="reco.profile.budget_max"
          :min="0"
          :max="20000"
          :step="100"
          @change="reco.persistProfile()"
        />
      </div>
    </div>

    <div class="space-y-2">
      <div class="text-base font-bold text-[var(--c-text)]">品牌偏好（可选）</div>
      <el-select
        v-model="reco.profile.brands"
        multiple
        filterable
        allow-create
        default-first-option
        placeholder="输入品牌后回车添加"
        style="width: 100%"
        @change="reco.persistProfile()"
      >
        <el-option v-for="b in brandOptions" :key="b" :label="b" :value="b" />
      </el-select>
    </div>

    <div class="flex flex-wrap items-center gap-3 pt-2">
      <el-button
        type="primary"
        v-feedback
        class="a11y-hit"
        :disabled="!reco.profile.hearing_level"
        @click="recommendNow"
      >
        立即推荐
      </el-button>
      <el-button
        v-feedback
        class="a11y-hit"
        :loading="saving"
        :disabled="!reco.profile.hearing_level || !hasToken"
        @click="saveToAccount"
      >
        保存到账号
      </el-button>
      <el-button
        v-feedback
        class="a11y-hit"
        :loading="loadingAccount"
        :disabled="!hasToken"
        @click="loadFromAccount"
      >
        从账号同步
      </el-button>
      <el-button v-feedback class="a11y-hit" @click="resetPrefs(true)">清空筛选</el-button>
      <el-button v-feedback class="a11y-hit" @click="resetPrefs(false)">重置全部</el-button>
    </div>
  </div>
</template>

<style scoped>
.grid :deep(.el-checkbox-button__inner) {
  min-height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}
</style>
