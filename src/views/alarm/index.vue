<template>
  <div class="app-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <div class="stat-info">
              <div class="label">今日告警</div>
              <div class="value">{{ statistics.todayCount }}</div>
            </div>
            <el-icon :size="40" color="#F56C6C"><Warning /></el-icon>
          </div>
          <div class="trend">
            较昨日
            <span :class="statistics.todayTrend >= 0 ? 'up' : 'down'">
              {{ Math.abs(statistics.todayTrend) }}%
              <el-icon>
                <component :is="statistics.todayTrend >= 0 ? 'ArrowUp' : 'ArrowDown'" />
              </el-icon>
            </span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <div class="stat-info">
              <div class="label">未处理告警</div>
              <div class="value">{{ statistics.unhandledCount }}</div>
            </div>
            <el-icon :size="40" color="#E6A23C"><Bell /></el-icon>
          </div>
          <div class="trend">
            较昨日
            <span :class="statistics.unhandledTrend >= 0 ? 'up' : 'down'">
              {{ Math.abs(statistics.unhandledTrend) }}%
              <el-icon>
                <component :is="statistics.unhandledTrend >= 0 ? 'ArrowUp' : 'ArrowDown'" />
              </el-icon>
            </span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <div class="stat-info">
              <div class="label">已处理告警</div>
              <div class="value">{{ statistics.handledCount }}</div>
            </div>
            <el-icon :size="40" color="#67C23A"><CircleCheck /></el-icon>
          </div>
          <div class="trend">
            较昨日
            <span :class="statistics.handledTrend >= 0 ? 'up' : 'down'">
              {{ Math.abs(statistics.handledTrend) }}%
              <el-icon>
                <component :is="statistics.handledTrend >= 0 ? 'ArrowUp' : 'ArrowDown'" />
              </el-icon>
            </span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-header">
            <div class="stat-info">
              <div class="label">告警处理率</div>
              <div class="value">{{ statistics.handleRate }}%</div>
            </div>
            <el-icon :size="40" color="#409EFF"><DataLine /></el-icon>
          </div>
          <div class="trend">
            较昨日
            <span :class="statistics.handleRateTrend >= 0 ? 'up' : 'down'">
              {{ Math.abs(statistics.handleRateTrend) }}%
              <el-icon>
                <component :is="statistics.handleRateTrend >= 0 ? 'ArrowUp' : 'ArrowDown'" />
              </el-icon>
            </span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索区域 -->
    <el-card class="search-wrapper">
      <el-form :model="queryParams" ref="queryFormRef" :inline="true">
        <el-form-item label="设备名称" prop="deviceName">
          <el-input
            v-model="queryParams.deviceName"
            placeholder="请输入设备名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="告警类型" prop="type">
          <el-select v-model="queryParams.type" placeholder="告警类型" clearable>
            <el-option label="阈值告警" value="threshold" />
            <el-option label="设备告警" value="device" />
            <el-option label="系统告警" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="处理状态" clearable>
            <el-option label="未处理" value="unhandled" />
            <el-option label="已处理" value="handled" />
            <el-option label="已忽略" value="ignored" />
          </el-select>
        </el-form-item>
        <el-form-item label="告警时间">
          <el-date-picker
            v-model="queryParams.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            :shortcuts="dateShortcuts"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">搜索</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 告警列表 -->
    <el-card class="table-wrapper">
      <template #header>
        <div class="header-operations">
          <el-button type="primary" :icon="Document" @click="handleExport">导出</el-button>
          <el-button type="danger" :icon="Delete" @click="handleBatchDelete">批量删除</el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="alarmList"
        @selection-change="handleSelectionChange"
        border
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="time" label="告警时间" width="180" show-overflow-tooltip />
        <el-table-column prop="deviceName" label="设备名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="type" label="告警类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getAlarmTypeTag(row.type)">
              {{ getAlarmTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="告警等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getAlarmLevelTag(row.level)">
              {{ getAlarmLevelName(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="告警内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="处理状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getAlarmStatusTag(row.status)">
              {{ getAlarmStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :icon="View"
              @click="handleView(row)"
            >
              查看
            </el-button>
            <el-button
              v-if="row.status === 'unhandled'"
              type="success"
              link
              :icon="Check"
              @click="handleProcess(row)"
            >
              处理
            </el-button>
            <el-button
              v-if="row.status === 'unhandled'"
              type="info"
              link
              :icon="TurnOff"
              @click="handleIgnore(row)"
            >
              忽略
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[10, 20, 30, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <!-- 告警处理对话框 -->
    <el-dialog
      title="告警处理"
      v-model="processDialog.visible"
      width="500px"
      append-to-body
    >
      <el-form
        ref="processFormRef"
        :model="processForm"
        :rules="processRules"
        label-width="100px"
      >
        <el-form-item label="处理方式" prop="method">
          <el-radio-group v-model="processForm.method">
            <el-radio label="auto">自动处理</el-radio>
            <el-radio label="manual">人工处理</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理结果" prop="result">
          <el-input
            v-model="processForm.result"
            type="textarea"
            rows="4"
            placeholder="请输入处理结果"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitProcess">确 定</el-button>
          <el-button @click="cancelProcess">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Document, Delete, View, Check, TurnOff, Warning, Bell, CircleCheck, DataLine } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 统计数据
const statistics = reactive({
  todayCount: 25,
  todayTrend: 12.5,
  unhandledCount: 8,
  unhandledTrend: -5.2,
  handledCount: 17,
  handledTrend: 8.4,
  handleRate: 68,
  handleRateTrend: 3.1
})

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  deviceName: '',
  type: '',
  status: '',
  timeRange: []
})

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24)
      return [start, end]
    }
  },
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  },
  {
    text: '最近一月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    }
  }
]

// 告警列表数据
const alarmList = ref([])
const loading = ref(false)
const total = ref(0)

// 选中数据
const selectedRows = ref([])

// 处理对话框
const processDialog = reactive({
  visible: false
})

// 处理表单
const processForm = reactive({
  id: undefined,
  method: 'auto',
  result: ''
})

// 处理表单校验规则
const processRules = {
  result: [
    { required: true, message: '请输入处理结果', trigger: 'blur' }
  ]
}

// 表单引用
const queryFormRef = ref()
const processFormRef = ref()

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

// 获取告警状态标签样式
function getAlarmStatusTag(status) {
  const map = {
    unhandled: 'danger',
    handled: 'success',
    ignored: 'info'
  }
  return map[status]
}

// 获取告警状态名称
function getAlarmStatusName(status) {
  const map = {
    unhandled: '未处理',
    handled: '已处理',
    ignored: '已忽略'
  }
  return map[status]
}

// 查询告警列表
async function getList() {
  loading.value = true
  try {
    // TODO: 调用后端API获取告警列表
    // const res = await listAlarm(queryParams)
    // alarmList.value = res.data.rows
    // total.value = res.data.total

    // 模拟数据
    alarmList.value = [
      {
        id: 1,
        time: '2024-01-21 10:23:45',
        deviceName: '温湿度传感器-01',
        type: 'threshold',
        level: 'high',
        content: '温度超过预警阈值：35℃',
        status: 'unhandled'
      },
      {
        id: 2,
        time: '2024-01-21 09:15:30',
        deviceName: '土壤传感器-01',
        type: 'device',
        level: 'medium',
        content: '设备离线',
        status: 'handled'
      }
    ]
    total.value = 2
  } catch (error) {
    console.error('获取告警列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 查询按钮操作
function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

// 重置按钮操作
function resetQuery() {
  queryFormRef.value?.resetFields()
  handleQuery()
}

// 多选框选中数据
function handleSelectionChange(selection) {
  selectedRows.value = selection
}

// 导出按钮操作
function handleExport() {
  // TODO: 实现告警数据导出功能
  ElMessage.info('开发中...')
}

// 批量删除按钮操作
function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的数据')
    return
  }

  ElMessageBox.confirm(
    `是否确认删除选中的${selectedRows.value.length}条数据？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    // TODO: 调用后端API批量删除告警
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {})
}

// 查看按钮操作
function handleView(row) {
  // TODO: 跳转到告警详情页面
  console.log('查看告警:', row)
}

// 处理按钮操作
function handleProcess(row) {
  processDialog.visible = true
  processForm.id = row.id
  processForm.method = 'auto'
  processForm.result = ''
}

// 忽略按钮操作
function handleIgnore(row) {
  ElMessageBox.confirm(
    '是否确认忽略该告警？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    // TODO: 调用后端API忽略告警
    ElMessage.success('操作成功')
    getList()
  }).catch(() => {})
}

// 取消处理
function cancelProcess() {
  processDialog.visible = false
  processForm.id = undefined
  processForm.method = 'auto'
  processForm.result = ''
  processFormRef.value?.resetFields()
}

// 提交处理
async function submitProcess() {
  try {
    await processFormRef.value.validate()
    // TODO: 调用后端API处理告警
    ElMessage.success('处理成功')
    processDialog.visible = false
    getList()
  } catch (error) {
    console.error('表单校验失败:', error)
  }
}

// 分页大小改变
function handleSizeChange(val) {
  queryParams.pageSize = val
  getList()
}

// 页码改变
function handleCurrentChange(val) {
  queryParams.pageNum = val
  getList()
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;

  .stat-row {
    margin-bottom: 20px;
  }

  .stat-card {
    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .stat-info {
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

    .trend {
      font-size: 14px;
      color: #909399;

      .up {
        color: #F56C6C;
      }

      .down {
        color: #67C23A;
      }
    }
  }

  .search-wrapper {
    margin-bottom: 20px;
  }

  .table-wrapper {
    margin-bottom: 20px;
  }

  .header-operations {
    display: flex;
    justify-content: flex-start;
    gap: 10px;
  }
}

.dialog-footer {
  text-align: right;
}
</style> 