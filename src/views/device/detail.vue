<template>
  <div class="app-container">
    <!-- 设备基本信息 -->
    <el-card class="info-wrapper">
      <template #header>
        <div class="card-header">
          <span>设备信息</span>
          <el-button type="primary" link :icon="Back" @click="goBack">返回</el-button>
        </div>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="设备名称">{{ deviceInfo.name }}</el-descriptions-item>
        <el-descriptions-item label="设备类型">
          <el-tag :type="getDeviceTypeTag(deviceInfo.type)">
            {{ getDeviceTypeName(deviceInfo.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="设备状态">
          <el-tag :type="getDeviceStatusTag(deviceInfo.status)">
            {{ getDeviceStatusName(deviceInfo.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="安装位置">{{ deviceInfo.location }}</el-descriptions-item>
        <el-descriptions-item label="采集间隔">{{ deviceInfo.interval }}秒</el-descriptions-item>
        <el-descriptions-item label="最后在线时间">{{ deviceInfo.lastOnlineTime }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 实时数据 -->
    <el-row :gutter="20" class="data-row">
      <template v-if="deviceInfo.type === 'temperature'">
        <el-col :span="12">
          <el-card class="data-card">
            <div class="data-header">
              <el-icon :size="40" color="#409EFF"><Sunny /></el-icon>
              <div class="data-info">
                <div class="label">实时温度</div>
                <div class="value">{{ realtimeData.temperature }}℃</div>
              </div>
            </div>
            <div ref="tempGaugeRef" class="gauge-chart"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="data-card">
            <div class="data-header">
              <el-icon :size="40" color="#67C23A"><Watermelon /></el-icon>
              <div class="data-info">
                <div class="label">实时湿度</div>
                <div class="value">{{ realtimeData.humidity }}%</div>
              </div>
            </div>
            <div ref="humidityGaugeRef" class="gauge-chart"></div>
          </el-card>
        </el-col>
      </template>
    </el-row>

    <!-- 历史数据 -->
    <el-card class="chart-wrapper">
      <template #header>
        <div class="card-header">
          <span>历史数据</span>
          <div class="chart-controls">
            <el-radio-group v-model="timeRange" size="small" @change="handleTimeRangeChange">
              <el-radio-button label="hour">1小时</el-radio-button>
              <el-radio-button label="day">24小时</el-radio-button>
              <el-radio-button label="week">7天</el-radio-button>
              <el-radio-button label="month">30天</el-radio-button>
            </el-radio-group>
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              :shortcuts="dateShortcuts"
              @change="handleDateRangeChange"
            />
          </div>
        </div>
      </template>
      <div ref="historyChartRef" class="history-chart"></div>
    </el-card>

    <!-- 告警记录 -->
    <el-card class="alarm-wrapper">
      <template #header>
        <div class="card-header">
          <span>告警记录</span>
          <el-button type="primary" link>查看更多</el-button>
        </div>
      </template>
      <el-table :data="alarmList" border style="width: 100%">
        <el-table-column prop="time" label="告警时间" width="180" />
        <el-table-column prop="type" label="告警类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.type === 'threshold' ? 'danger' : 'warning'">
              {{ row.type === 'threshold' ? '阈值告警' : '设备告警' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="告警内容" />
        <el-table-column prop="status" label="处理状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'handled' ? 'success' : 'info'">
              {{ row.status === 'handled' ? '已处理' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :disabled="row.status === 'handled'"
              @click="handleAlarm(row)"
            >
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Back, Sunny, Watermelon } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()

// 设备基本信息
const deviceInfo = reactive({
  id: undefined,
  name: '温湿度传感器-01',
  type: 'temperature',
  status: 'online',
  location: '1号大棚',
  interval: 60,
  lastOnlineTime: '2024-01-21 12:00:00'
})

// 实时数据
const realtimeData = reactive({
  temperature: 25.6,
  humidity: 68.5
})

// 图表实例
const tempGaugeRef = ref(null)
const humidityGaugeRef = ref(null)
const historyChartRef = ref(null)
let tempGauge = null
let humidityGauge = null
let historyChart = null

// 时间范围
const timeRange = ref('hour')
const dateRange = ref([])

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000)
      return [start, end]
    }
  },
  {
    text: '最近24小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24)
      return [start, end]
    }
  },
  {
    text: '最近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  }
]

// 告警记录
const alarmList = ref([
  {
    time: '2024-01-21 10:23:45',
    type: 'threshold',
    content: '温度超过预警阈值：35℃',
    status: 'unhandled'
  },
  {
    time: '2024-01-21 09:15:30',
    type: 'device',
    content: '设备离线',
    status: 'handled'
  }
])

// 获取设备类型标签样式
function getDeviceTypeTag(type) {
  const map = {
    temperature: '',
    soil: 'success',
    light: 'warning',
    weather: 'info'
  }
  return map[type]
}

// 获取设备类型名称
function getDeviceTypeName(type) {
  const map = {
    temperature: '温湿度传感器',
    soil: '土壤传感器',
    light: '光照传感器',
    weather: '气象站'
  }
  return map[type]
}

// 获取设备状态标签样式
function getDeviceStatusTag(status) {
  const map = {
    online: 'success',
    offline: 'info',
    fault: 'danger'
  }
  return map[status]
}

// 获取设备状态名称
function getDeviceStatusName(status) {
  const map = {
    online: '在线',
    offline: '离线',
    fault: '故障'
  }
  return map[status]
}

// 返回列表页
function goBack() {
  router.push('/device')
}

// 初始化温度仪表盘
function initTempGauge() {
  const option = {
    series: [{
      type: 'gauge',
      min: -20,
      max: 50,
      axisLine: {
        lineStyle: {
          width: 30,
          color: [
            [0.3, '#67C23A'],
            [0.7, '#409EFF'],
            [1, '#F56C6C']
          ]
        }
      },
      pointer: {
        itemStyle: {
          color: 'auto'
        }
      },
      axisTick: {
        distance: -30,
        length: 8,
        lineStyle: {
          color: '#fff',
          width: 2
        }
      },
      splitLine: {
        distance: -30,
        length: 30,
        lineStyle: {
          color: '#fff',
          width: 4
        }
      },
      axisLabel: {
        color: 'inherit',
        distance: 40,
        fontSize: 12
      },
      detail: {
        valueAnimation: true,
        formatter: '{value} ℃',
        color: 'inherit'
      },
      data: [{
        value: realtimeData.temperature
      }]
    }]
  }
  
  tempGauge = echarts.init(tempGaugeRef.value)
  tempGauge.setOption(option)
}

// 初始化湿度仪表盘
function initHumidityGauge() {
  const option = {
    series: [{
      type: 'gauge',
      min: 0,
      max: 100,
      axisLine: {
        lineStyle: {
          width: 30,
          color: [
            [0.3, '#F56C6C'],
            [0.7, '#67C23A'],
            [1, '#409EFF']
          ]
        }
      },
      pointer: {
        itemStyle: {
          color: 'auto'
        }
      },
      axisTick: {
        distance: -30,
        length: 8,
        lineStyle: {
          color: '#fff',
          width: 2
        }
      },
      splitLine: {
        distance: -30,
        length: 30,
        lineStyle: {
          color: '#fff',
          width: 4
        }
      },
      axisLabel: {
        color: 'inherit',
        distance: 40,
        fontSize: 12
      },
      detail: {
        valueAnimation: true,
        formatter: '{value} %',
        color: 'inherit'
      },
      data: [{
        value: realtimeData.humidity
      }]
    }]
  }
  
  humidityGauge = echarts.init(humidityGaugeRef.value)
  humidityGauge.setOption(option)
}

// 初始化历史数据图表
function initHistoryChart() {
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['温度', '湿度']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      boundaryGap: false
    },
    yAxis: [
      {
        type: 'value',
        name: '温度(℃)',
        position: 'left'
      },
      {
        type: 'value',
        name: '湿度(%)',
        position: 'right'
      }
    ],
    series: [
      {
        name: '温度',
        type: 'line',
        yAxisIndex: 0,
        data: generateMockData('temperature')
      },
      {
        name: '湿度',
        type: 'line',
        yAxisIndex: 1,
        data: generateMockData('humidity')
      }
    ]
  }
  
  historyChart = echarts.init(historyChartRef.value)
  historyChart.setOption(option)
}

// 生成模拟数据
function generateMockData(type) {
  const now = new Date()
  const data = []
  for (let i = 0; i < 60; i++) {
    const time = new Date(now - (60 - i) * 60 * 1000)
    const value = type === 'temperature'
      ? Math.random() * 10 + 20
      : Math.random() * 20 + 60
    data.push([time, value.toFixed(1)])
  }
  return data
}

// 时间范围改变
function handleTimeRangeChange(val) {
  // TODO: 根据时间范围获取历史数据
  console.log('时间范围改变:', val)
}

// 日期范围改变
function handleDateRangeChange(val) {
  // TODO: 根据日期范围获取历史数据
  console.log('日期范围改变:', val)
}

// 处理告警
function handleAlarm(row) {
  // TODO: 调用后端API处理告警
  ElMessage.success('处理成功')
  row.status = 'handled'
}

// 监听窗口大小变化
function handleResize() {
  tempGauge?.resize()
  humidityGauge?.resize()
  historyChart?.resize()
}

// 获取设备详情
async function getDeviceDetail() {
  // TODO: 调用后端API获取设备详情
  deviceInfo.id = route.params.id
}

// 获取实时数据
function startRealtimeData() {
  // TODO: 建立WebSocket连接获取实时数据
  const timer = setInterval(() => {
    realtimeData.temperature = (Math.random() * 10 + 20).toFixed(1)
    realtimeData.humidity = (Math.random() * 20 + 60).toFixed(1)
    
    tempGauge?.setOption({
      series: [{
        data: [{
          value: realtimeData.temperature
        }]
      }]
    })
    
    humidityGauge?.setOption({
      series: [{
        data: [{
          value: realtimeData.humidity
        }]
      }]
    })
  }, 3000)

  return timer
}

let timer = null

onMounted(() => {
  getDeviceDetail()
  initTempGauge()
  initHumidityGauge()
  initHistoryChart()
  timer = startRealtimeData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (timer) {
    clearInterval(timer)
  }
  tempGauge?.dispose()
  humidityGauge?.dispose()
  historyChart?.dispose()
})
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;

  .info-wrapper {
    margin-bottom: 20px;
  }

  .data-row {
    margin-bottom: 20px;
  }

  .data-card {
    .data-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 20px;

      .data-info {
        .label {
          font-size: 14px;
          color: #909399;
        }

        .value {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
        }
      }
    }

    .gauge-chart {
      height: 300px;
    }
  }

  .chart-wrapper {
    margin-bottom: 20px;

    .chart-controls {
      display: flex;
      gap: 20px;
    }

    .history-chart {
      height: 400px;
    }
  }

  .alarm-wrapper {
    margin-bottom: 20px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 