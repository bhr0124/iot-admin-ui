<template>
  <div class="device-condition">
    <el-form :model="condition" label-width="100px">
      <el-form-item label="告警事件" prop="event">
        <el-select v-model="condition.event" placeholder="请选择告警事件">
          <el-option label="设备离线" value="offline" />
          <el-option label="设备重启" value="restart" />
          <el-option label="数据异常" value="data_error" />
          <el-option label="通信超时" value="timeout" />
        </el-select>
      </el-form-item>
      <el-form-item label="持续时间" prop="duration" v-if="condition.event === 'offline'">
        <el-input-number v-model="condition.duration" :min="0" :step="1">
          <template #append>分钟</template>
        </el-input-number>
      </el-form-item>
      <el-form-item label="重试次数" prop="retries" v-if="condition.event === 'data_error'">
        <el-input-number v-model="condition.retries" :min="1" :step="1" />
      </el-form-item>
      <el-form-item label="超时时间" prop="timeout" v-if="condition.event === 'timeout'">
        <el-input-number v-model="condition.timeout" :min="0" :step="1">
          <template #append>秒</template>
        </el-input-number>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      event: undefined,
      duration: 5,
      retries: 3,
      timeout: 30
    })
  }
})

const emit = defineEmits(['update:modelValue'])

const condition = ref({ ...props.modelValue })

watch(condition, (val) => {
  emit('update:modelValue', val)
}, { deep: true })

watch(() => props.modelValue, (val) => {
  condition.value = { ...val }
}, { deep: true })
</script>

<style lang="scss" scoped>
.device-condition {
  padding: 10px;
}
</style> 