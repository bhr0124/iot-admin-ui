<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>告警规则详情</span>
          <el-button type="primary" plain @click="goBack">返回</el-button>
        </div>
      </template>
      
      <el-descriptions :column="2" border>
        <el-descriptions-item label="规则名称">{{ ruleDetail.name }}</el-descriptions-item>
        <el-descriptions-item label="规则状态">
          <el-tag :type="ruleDetail.enabled ? 'success' : 'info'">
            {{ ruleDetail.enabled ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="设备类型">{{ ruleDetail.deviceTypeName }}</el-descriptions-item>
        <el-descriptions-item label="告警类型">
          <el-tag :type="getAlarmTypeTag(ruleDetail.type)">
            {{ getAlarmTypeName(ruleDetail.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="告警等级">
          <el-tag :type="getAlarmLevelTag(ruleDetail.level)">
            {{ getAlarmLevelName(ruleDetail.level) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ ruleDetail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="规则描述" :span="2">{{ ruleDetail.description }}</el-descriptions-item>
        <el-descriptions-item label="触发条件" :span="2">
          <div class="condition-display">
            <component
              :is="conditionComponent"
              v-if="conditionComponent"
              v-model="parsedCondition"
              disabled
            />
            <pre v-else>{{ JSON.stringify(parsedCondition, null, 2) }}</pre>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="告警模板" :span="2">{{ ruleDetail.template }}</el-descriptions-item>
      </el-descriptions>

      <!-- 告警统计 -->
      <div class="statistics-section">
        <h3>告警统计</h3>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>今日告警次数</template>
              <div class="statistics-value">{{ statistics.todayCount || 0 }}</div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>本周告警次数</template>
              <div class="statistics-value">{{ statistics.weekCount || 0 }}</div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header>本月告警次数</template>
              <div class="statistics-value">{{ statistics.monthCount || 0 }}</div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 最近告警记录 -->
      <div class="recent-alarms">
        <h3>最近告警记录</h3>
        <el-table :data="recentAlarms" border stripe>
          <el-table-column label="告警时间" prop="createTime" width="160" />
          <el-table-column label="告警内容" prop="content" show-overflow-tooltip />
          <el-table-column label="处理状态" prop="status" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'processed' ? 'success' : 'warning'">
                {{ row.status === 'processed' ? '已处理' : '未处理' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAlarmRule, getAlarmRuleStatistics, getAlarmRuleRecords } from '@/api/alarm/rule'
import ThresholdCondition from './components/ThresholdCondition.vue'
import DeviceCondition from './components/DeviceCondition.vue'

const route = useRoute()
const router = useRouter()

const ruleDetail = ref({})
const statistics = ref({})
const recentAlarms = ref([])
const parsedCondition = ref({})

// 计算属性：条件组件
const conditionComponent = computed(() => {
  switch (ruleDetail.value.type) {
    case 'threshold':
      return ThresholdCondition
    case 'device':
      return DeviceCondition
    default:
      return null
  }
})

// 获取告警类型标签样式
function getAlarmTypeTag(type) {
  const map = {
    threshold: 'danger',
    device: 'warning',
    system: 'info'
  }
  return map[type]
}

// 获取告警类型名称
function getAlarmTypeName(type) {
  const map = {
    threshold: '阈值告警',
    device: '设备告警',
    system: '系统告警'
  }
  return map[type]
}

// 获取告警等级标签样式
function getAlarmLevelTag(level) {
  const map = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return map[level]
}

// 获取告警等级名称
function getAlarmLevelName(level) {
  const map = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[level]
}

// 获取规则详情
async function getRuleDetail() {
  try {
    const res = await getAlarmRule(route.params.id)
    ruleDetail.value = res.data
    if (typeof res.data.condition === 'string') {
      parsedCondition.value = JSON.parse(res.data.condition)
    } else {
      parsedCondition.value = res.data.condition
    }
  } catch (error) {
    console.error('获取告警规则详情失败:', error)
  }
}

// 获取告警统计
async function getStatistics() {
  try {
    const res = await getAlarmRuleStatistics(route.params.id)
    statistics.value = res.data
  } catch (error) {
    console.error('获取告警统计失败:', error)
  }
}

// 获取最近告警记录
async function getRecentAlarms() {
  try {
    const res = await getAlarmRuleRecords(route.params.id, {
      pageSize: 10,
      pageNum: 1,
      orderBy: 'createTime',
      orderType: 'desc'
    })
    recentAlarms.value = res.rows
  } catch (error) {
    console.error('获取最近告警记录失败:', error)
  }
}

// 定时刷新数据
let refreshTimer = null

// 返回列表页
function goBack() {
  router.push('/alarm/rule')
}

onMounted(() => {
  getRuleDetail()
  getStatistics()
  getRecentAlarms()

  // 每 30 秒刷新一次数据
  refreshTimer = setInterval(() => {
    getStatistics()
    getRecentAlarms()
  }, 30000)
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .condition-display {
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 4px;

    pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }

  .statistics-section {
    margin-top: 20px;

    h3 {
      margin-bottom: 15px;
      font-weight: 500;
    }

    .statistics-value {
      font-size: 24px;
      text-align: center;
      color: #409eff;
    }
  }

  .recent-alarms {
    margin-top: 20px;

    h3 {
      margin-bottom: 15px;
      font-weight: 500;
    }
  }
}
</style> 