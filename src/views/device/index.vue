<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-card class="search-wrapper">
      <el-form :model="queryParams" ref="queryFormRef" :inline="true">
        <el-form-item label="设备名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入设备名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="设备类型" prop="type">
          <el-select v-model="queryParams.type" placeholder="设备类型" clearable>
            <el-option label="温湿度传感器" value="temperature" />
            <el-option label="土壤传感器" value="soil" />
            <el-option label="光照传感器" value="light" />
            <el-option label="气象站" value="weather" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="设备状态" clearable>
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
            <el-option label="故障" value="fault" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">搜索</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮区域 -->
    <el-card class="table-wrapper">
      <template #header>
        <div class="header-operations">
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增设备</el-button>
          <el-button type="success" :icon="Upload" @click="handleImport">批量导入</el-button>
          <el-button type="warning" :icon="Download" @click="handleExport">批量导出</el-button>
        </div>
      </template>

      <!-- 表格区域 -->
      <el-table
        v-loading="loading"
        :data="deviceList"
        border
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="设备名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="type" label="设备类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getDeviceTypeTag(row.type)">
              {{ getDeviceTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getDeviceStatusTag(row.status)">
              {{ getDeviceStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="安装位置" min-width="120" show-overflow-tooltip />
        <el-table-column prop="lastOnlineTime" label="最后在线时间" width="180" show-overflow-tooltip />
        <el-table-column label="实时数据" align="center" width="300">
          <template #default="{ row }">
            <div class="realtime-data">
              <template v-if="row.type === 'temperature'">
                <el-tooltip content="温度">
                  <span class="data-item">
                    <el-icon><Sunny /></el-icon>
                    {{ row.temperature }}℃
                  </span>
                </el-tooltip>
                <el-tooltip content="湿度">
                  <span class="data-item">
                    <el-icon><Watermelon /></el-icon>
                    {{ row.humidity }}%
                  </span>
                </el-tooltip>
              </template>
              <template v-if="row.type === 'soil'">
                <el-tooltip content="土壤湿度">
                  <span class="data-item">
                    <el-icon><WaterMeter /></el-icon>
                    {{ row.soilMoisture }}%
                  </span>
                </el-tooltip>
                <el-tooltip content="土壤温度">
                  <span class="data-item">
                    <el-icon><Sunny /></el-icon>
                    {{ row.soilTemperature }}℃
                  </span>
                </el-tooltip>
              </template>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="250">
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
              type="primary"
              link
              :icon="Edit"
              @click="handleUpdate(row)"
            >
              编辑
            </el-button>
            <el-button
              type="primary"
              link
              :icon="Setting"
              @click="handleConfig(row)"
            >
              配置
            </el-button>
            <el-button
              type="danger"
              link
              :icon="Delete"
              @click="handleDelete(row)"
            >
              删除
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

    <!-- 添加/修改设备对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="600px"
      append-to-body
    >
      <el-form
        ref="deviceFormRef"
        :model="deviceForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="deviceForm.name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备类型" prop="type">
          <el-select v-model="deviceForm.type" placeholder="请选择设备类型" style="width: 100%">
            <el-option label="温湿度传感器" value="temperature" />
            <el-option label="土壤传感器" value="soil" />
            <el-option label="光照传感器" value="light" />
            <el-option label="气象站" value="weather" />
          </el-select>
        </el-form-item>
        <el-form-item label="安装位置" prop="location">
          <el-input v-model="deviceForm.location" placeholder="请输入安装位置" />
        </el-form-item>
        <el-form-item label="采集间隔" prop="interval">
          <el-input-number
            v-model="deviceForm.interval"
            :min="1"
            :max="3600"
            :step="1"
            style="width: 100%"
          />
          <template #append>秒</template>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="deviceForm.description"
            type="textarea"
            placeholder="请输入设备描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 设备配置对话框 -->
    <el-dialog
      title="设备配置"
      v-model="configDialog.visible"
      width="600px"
      append-to-body
    >
      <el-form
        ref="configFormRef"
        :model="configForm"
        label-width="120px"
      >
        <template v-if="configForm.type === 'temperature'">
          <el-form-item label="温度报警阈值">
            <el-row :gutter="10">
              <el-col :span="11">
                <el-input-number
                  v-model="configForm.tempLower"
                  :precision="1"
                  :step="0.1"
                  placeholder="最低温度"
                />
              </el-col>
              <el-col :span="2" class="text-center">-</el-col>
              <el-col :span="11">
                <el-input-number
                  v-model="configForm.tempUpper"
                  :precision="1"
                  :step="0.1"
                  placeholder="最高温度"
                />
              </el-col>
            </el-row>
          </el-form-item>
          <el-form-item label="湿度报警阈值">
            <el-row :gutter="10">
              <el-col :span="11">
                <el-input-number
                  v-model="configForm.humidityLower"
                  :precision="1"
                  :step="0.1"
                  placeholder="最低湿度"
                />
              </el-col>
              <el-col :span="2" class="text-center">-</el-col>
              <el-col :span="11">
                <el-input-number
                  v-model="configForm.humidityUpper"
                  :precision="1"
                  :step="0.1"
                  placeholder="最高湿度"
                />
              </el-col>
            </el-row>
          </el-form-item>
        </template>
        <el-form-item label="报警通知">
          <el-checkbox-group v-model="configForm.notifyTypes">
            <el-checkbox label="email">邮件通知</el-checkbox>
            <el-checkbox label="sms">短信通知</el-checkbox>
            <el-checkbox label="push">系统通知</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitConfig">确 定</el-button>
          <el-button @click="cancelConfig">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Plus, View, Edit, Setting, Delete, Upload, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  type: '',
  status: ''
})

// 总数据条数
const total = ref(0)

// 设备表格数据
const deviceList = ref([])
const loading = ref(false)

// 弹窗属性
const dialog = reactive({
  title: '',
  visible: false
})

// 表单参数
const deviceForm = reactive({
  id: undefined,
  name: '',
  type: '',
  location: '',
  interval: 60,
  description: ''
})

// 表单校验规则
const rules = {
  name: [
    { required: true, message: '请输入设备名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择设备类型', trigger: 'change' }
  ],
  location: [
    { required: true, message: '请输入安装位置', trigger: 'blur' }
  ],
  interval: [
    { required: true, message: '请输入采集间隔', trigger: 'blur' }
  ]
}

// 配置对话框
const configDialog = reactive({
  visible: false
})

// 配置表单参数
const configForm = reactive({
  id: undefined,
  type: '',
  tempLower: 0,
  tempUpper: 50,
  humidityLower: 0,
  humidityUpper: 100,
  notifyTypes: ['push']
})

// 表单引用
const queryFormRef = ref()
const deviceFormRef = ref()
const configFormRef = ref()

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

// 查询设备列表
async function getList() {
  loading.value = true
  try {
    // TODO: 调用后端API获取设备列表
    // const res = await listDevice(queryParams)
    // deviceList.value = res.data.rows
    // total.value = res.data.total

    // 模拟数据
    deviceList.value = [
      {
        id: 1,
        name: '温湿度传感器-01',
        type: 'temperature',
        status: 'online',
        location: '1号大棚',
        lastOnlineTime: '2024-01-21 12:00:00',
        temperature: 25.6,
        humidity: 68.5
      },
      {
        id: 2,
        name: '土壤传感器-01',
        type: 'soil',
        status: 'online',
        location: '1号大棚',
        lastOnlineTime: '2024-01-21 12:00:00',
        soilMoisture: 45.8,
        soilTemperature: 22.3
      }
    ]
    total.value = 2
  } catch (error) {
    console.error('获取设备列表失败:', error)
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

// 新增按钮操作
function handleAdd() {
  reset()
  dialog.title = '添加设备'
  dialog.visible = true
}

// 修改按钮操作
function handleUpdate(row) {
  reset()
  dialog.title = '修改设备'
  dialog.visible = true
  Object.assign(deviceForm, row)
}

// 查看按钮操作
function handleView(row) {
  // TODO: 跳转到设备详情页面
  console.log('查看设备:', row)
}

// 配置按钮操作
function handleConfig(row) {
  configDialog.visible = true
  configForm.id = row.id
  configForm.type = row.type
  // TODO: 调用后端API获取设备配置
}

// 删除按钮操作
function handleDelete(row) {
  ElMessageBox.confirm(
    `是否确认删除设备名称为"${row.name}"的设备？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    // TODO: 调用后端API删除设备
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {})
}

// 导入按钮操作
function handleImport() {
  // TODO: 实现设备批量导入功能
  ElMessage.info('开发中...')
}

// 导出按钮操作
function handleExport() {
  // TODO: 实现设备批量导出功能
  ElMessage.info('开发中...')
}

// 表单重置
function reset() {
  deviceForm.id = undefined
  deviceForm.name = ''
  deviceForm.type = ''
  deviceForm.location = ''
  deviceForm.interval = 60
  deviceForm.description = ''
  deviceFormRef.value?.resetFields()
}

// 取消按钮
function cancel() {
  dialog.visible = false
  reset()
}

// 提交按钮
async function submitForm() {
  try {
    await deviceFormRef.value.validate()
    // TODO: 调用后端API保存设备信息
    ElMessage.success(deviceForm.id ? '修改成功' : '新增成功')
    dialog.visible = false
    getList()
  } catch (error) {
    console.error('表单校验失败:', error)
  }
}

// 取消配置
function cancelConfig() {
  configDialog.visible = false
  configForm.id = undefined
  configForm.type = ''
  configForm.tempLower = 0
  configForm.tempUpper = 50
  configForm.humidityLower = 0
  configForm.humidityUpper = 100
  configForm.notifyTypes = ['push']
}

// 提交配置
async function submitConfig() {
  // TODO: 调用后端API保存设备配置
  ElMessage.success('配置成功')
  configDialog.visible = false
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

.realtime-data {
  display: flex;
  justify-content: center;
  gap: 20px;

  .data-item {
    display: flex;
    align-items: center;
    gap: 5px;
  }
}

.text-center {
  text-align: center;
  line-height: 32px;
}
</style> 