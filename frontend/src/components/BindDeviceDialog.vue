<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useDeviceStore } from '@/stores/device'

const emit = defineEmits<{ success: [] }>()
const store = useDeviceStore()

const open = ref(false)
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  model: '',
  serial_no: '',
  purchase_date: '',
  warranty_end: '',
  thumbnail: ''
})

const rules: FormRules = {
  model: [{ required: true, message: '请输入设备型号', trigger: 'blur' }],
  serial_no: [{ required: true, message: '请输入序列号', trigger: 'blur' }]
}

function show() {
  resetForm()
  open.value = true
}

function close() {
  open.value = false
}

function resetForm() {
  form.model = ''
  form.serial_no = ''
  form.purchase_date = ''
  form.warranty_end = ''
  form.thumbnail = ''
  formRef.value?.clearValidate()
}

async function submit() {
  const inst = formRef.value
  if (!inst) return
  const ok = await inst.validate().catch(() => false)
  if (!ok) return

  loading.value = true
  try {
    await store.bindDevice({
      model: form.model.trim(),
      serial_no: form.serial_no.trim(),
      purchase_date: form.purchase_date || undefined,
      warranty_end: form.warranty_end || undefined,
      thumbnail: form.thumbnail.trim() || undefined
    })
    ElMessage.success('设备绑定成功')
    close()
    emit('success')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '绑定失败')
  } finally {
    loading.value = false
  }
}

defineExpose({ show, close })
</script>

<template>
  <el-dialog v-model="open" title="绑定新设备" width="480px" :close-on-click-modal="false">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" status-icon>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <el-form-item label="设备型号" prop="model" class="md:col-span-2">
          <el-input v-model="form.model" placeholder="如：Pro X3 智能降噪款" />
        </el-form-item>
        <el-form-item label="序列号" prop="serial_no" class="md:col-span-2">
          <el-input v-model="form.serial_no" placeholder="请输入设备序列号" />
        </el-form-item>
        <el-form-item label="购买日期">
          <el-date-picker
            v-model="form.purchase_date"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="保修截止日">
          <el-date-picker
            v-model="form.warranty_end"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="设备图片URL（可选）" class="md:col-span-2">
          <el-input v-model="form.thumbnail" placeholder="https://..." />
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">确认绑定</el-button>
    </template>
  </el-dialog>
</template>
