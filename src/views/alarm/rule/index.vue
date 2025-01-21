<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-card class="search-wrapper">
      <el-form :model="queryParams" ref="queryFormRef" :inline="true">
        <el-form-item label="规则名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入规则名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="设备类型" prop="deviceTypeId">
          <el-select v-model="queryParams.deviceTypeId" placeholder="设备类型" clearable>
            <el-option
              v-for="item in deviceTypeOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="告警类型" prop="type">
          <el-select v-model="queryParams.type" placeholder="告警类型" clearable>
            <el-option label="阈值告警" value="threshold" />
            <el-option label="设备告警" value="device" />
            <el-option label="系统告警" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="告警等级" prop="level">
          <el-select v-model="queryParams.level" placeholder="告警等级" clearable>
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="enabled">
          <el-select v-model="queryParams.enabled" placeholder="状态" clearable>
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
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
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增</el-button>
          <el-button type="danger" :icon="Delete" :disabled="!selectedIds.length" @click="handleBatchDelete">
            批量删除
          </el-button>
          <el-button type="warning" :icon="Download" @click="handleExport">导出</el-button>
        </div>
      </template>

      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="ruleList"
        @selection-change="handleSelectionChange"
        border
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="规则名称" prop="name" min-width="120" show-overflow-tooltip />
        <el-table-column label="设备类型" prop="deviceTypeName" width="120" show-overflow-tooltip />
        <el-table-column label="告警类型" prop="type" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getAlarmTypeTag(row.type)">
              {{ getAlarmTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="告警等级" prop="level" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getAlarmLevelTag(row.level)">
              {{ getAlarmLevelName(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="enabled" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              :active-value="true"
              :inactive-value="false"
              @change="(val) => handleStatusChange(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="160" align="center" />
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
              type="success"
              link
              :icon="Edit"
              @click="handleEdit(row)"
            >
              修改
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
      <pagination
        v-if="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>

    <!-- 添加/修改对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="800px"
      append-to-body
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="请输入规则描述"
          />
        </el-form-item>
        <el-form-item label="设备类型" prop="deviceTypeId">
          <el-select v-model="form.deviceTypeId" placeholder="请选择设备类型">
            <el-option
              v-for="item in deviceTypeOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="告警类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择告警类型">
            <el-option label="阈值告警" value="threshold" />
            <el-option label="设备告警" value="device" />
            <el-option label="系统告警" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="告警等级" prop="level">
          <el-select v-model="form.level" placeholder="请选择告警等级">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发条件" prop="condition" v-if="form.type">
          <component
            :is="conditionComponent"
            v-model="form.condition"
            v-if="conditionComponent"
          />
          <el-input
            v-else
            v-model="form.condition"
            type="textarea"
            placeholder="请输入触发条件(JSON格式)"
          />
        </el-form-item>
        <el-form-item label="告警模板" prop="template">
          <el-input
            v-model="form.template"
            type="textarea"
            placeholder="请输入告警内容模板"
          />
        </el-form-item>
        <el-form-item label="状态" prop="enabled">
          <el-radio-group v-model="form.enabled">
            <el-radio :label="true">启用</el-radio>
            <el-radio :label="false">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Search, Refresh, Plus, Delete, Download, View, Edit } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  listAlarmRule,
  getAlarmRule,
  addAlarmRule,
  updateAlarmRule,
  deleteAlarmRule,
  toggleAlarmRule,
  exportAlarmRule
} from '@/api/alarm/rule'
import { listAllDeviceType } from '@/api/device/type'
import ThresholdCondition from './components/ThresholdCondition.vue'
import DeviceCondition from './components/DeviceCondition.vue'
import { useRouter } from 'vue-router'

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: undefined,
  deviceTypeId: undefined,
  type: undefined,
  level: undefined,
  enabled: undefined
})

// 设备类型选项（需要从后端获取）
const deviceTypeOptions = ref([])

// 表格数据
const loading = ref(false)
const ruleList = ref([])
const total = ref(0)
const selectedIds = ref([])

// 对话框
const dialog = reactive({
  visible: false,
  title: ''
})

// 表单对象
const form = reactive({
  id: undefined,
  name: undefined,
  description: undefined,
  deviceTypeId: undefined,
  type: undefined,
  level: undefined,
  condition: {},
  template: undefined,
  enabled: true
})

// 表单校验规则
const rules = {
  name: [
    { required: true, message: '规则名称不能为空', trigger: 'blur' }
  ],
  deviceTypeId: [
    { required: true, message: '请选择设备类型', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择告警类型', trigger: 'change' }
  ],
  level: [
    { required: true, message: '请选择告警等级', trigger: 'change' }
  ],
  condition: [
    { required: true, message: '触发条件不能为空', trigger: 'blur' }
  ],
  template: [
    { required: true, message: '告警模板不能为空', trigger: 'blur' }
  ]
}

// 表单引用
const queryFormRef = ref()
const formRef = ref()

// 计算属性：条件组件
const conditionComponent = computed(() => {
  switch (form.type) {
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

// 查询列表
async function getList() {
  loading.value = true
  try {
    const res = await listAlarmRule(queryParams)
    ruleList.value = res.rows
    total.value = res.total
  } catch (error) {
    console.error('获取告警规则列表失败:', error)
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
  selectedIds.value = selection.map(item => item.id)
}

// 新增按钮操作
function handleAdd() {
  dialog.title = '添加告警规则'
  dialog.visible = true
  Object.assign(form, {
    id: undefined,
    name: undefined,
    description: undefined,
    deviceTypeId: undefined,
    type: undefined,
    level: undefined,
    condition: {},
    template: undefined,
    enabled: true
  })
}

// 修改按钮操作
async function handleEdit(row) {
  dialog.title = '修改告警规则'
  dialog.visible = true
  try {
    const res = await getAlarmRule(row.id)
    const data = { ...res.data }
    if (typeof data.condition === 'string') {
      data.condition = JSON.parse(data.condition)
    }
    Object.assign(form, data)
  } catch (error) {
    console.error('获取告警规则详情失败:', error)
  }
}

// 查看按钮操作
function handleView(row) {
  const router = useRouter()
  router.push(`/alarm/rule/detail/${row.id}`)
}

// 提交表单
async function submitForm() {
  try {
    await formRef.value.validate()
    const submitData = { ...form }
    submitData.condition = JSON.stringify(submitData.condition)
    
    if (submitData.id) {
      await updateAlarmRule(submitData)
    } else {
      await addAlarmRule(submitData)
    }
    ElMessage.success('操作成功')
    dialog.visible = false
    getList()
  } catch (error) {
    console.error('提交表单失败:', error)
  }
}

// 取消按钮
function cancel() {
  dialog.visible = false
  formRef.value?.resetFields()
}

// 删除按钮操作
function handleDelete(row) {
  ElMessageBox.confirm(
    '是否确认删除该告警规则？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await deleteAlarmRule(row.id)
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {})
}

// 批量删除按钮操作
function handleBatchDelete() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要删除的数据')
    return
  }

  ElMessageBox.confirm(
    `是否确认删除选中的${selectedIds.value.length}条数据？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await deleteAlarmRule(selectedIds.value.join(','))
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {})
}

// 导出按钮操作
function handleExport() {
  exportAlarmRule(queryParams)
}

// 状态修改
async function handleStatusChange(row, value) {
  try {
    await toggleAlarmRule(row.id, value)
    ElMessage.success('修改成功')
    getList()
  } catch (error) {
    console.error('修改状态失败:', error)
    row.enabled = !value
  }
}

// 获取设备类型选项
async function getDeviceTypeOptions() {
  try {
    const res = await listAllDeviceType()
    deviceTypeOptions.value = res.data
  } catch (error) {
    console.error('获取设备类型选项失败:', error)
  }
}

const router = useRouter()

onMounted(() => {
  getDeviceTypeOptions()
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
</style> 