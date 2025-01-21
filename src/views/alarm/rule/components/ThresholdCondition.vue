<template>
  <div class="threshold-condition">
    <el-form :model="condition" label-width="100px">
      <el-form-item label="监测指标" prop="metric">
        <el-select v-model="condition.metric" placeholder="请选择监测指标">
          <el-option label="温度" value="temperature" />
          <el-option label="湿度" value="humidity" />
          <el-option label="光照" value="light" />
          <el-option label="土壤湿度" value="soil_moisture" />
        </el-select>
      </el-form-item>
      <el-form-item label="比较运算符" prop="operator">
        <el-select v-model="condition.operator" placeholder="请选择比较运算符">
          <el-option label="大于" value=">" />
          <el-option label="大于等于" value=">=" />
          <el-option label="小于" value="<" />
          <el-option label="小于等于" value="<=" />
          <el-option label="等于" value="==" />
          <el-option label="不等于" value="!=" />
        </el-select>
      </el-form-item>
      <el-form-item label="阈值" prop="threshold">
        <el-input-number v-model="condition.threshold" :precision="2" :step="0.1" />
      </el-form-item>
      <el-form-item label="持续时间" prop="duration">
        <el-input-number v-model="condition.duration" :min="0" :step="1">
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
      metric: undefined,
      operator: undefined,
      threshold: 0,
      duration: 0
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
.threshold-condition {
  padding: 10px;
}
</style> 