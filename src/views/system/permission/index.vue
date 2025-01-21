<template>
  <div class="app-container">
    <!-- 操作按钮区域 -->
    <el-card class="table-wrapper">
      <template #header>
        <div class="header-operations">
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增权限</el-button>
          <el-button :icon="Refresh" @click="getList">刷新</el-button>
        </div>
      </template>

      <!-- 表格区域 -->
      <el-table
        v-loading="loading"
        :data="permissionList"
        row-key="id"
        :tree-props="{ children: 'children' }"
        border
        style="width: 100%"
      >
        <el-table-column prop="name" label="权限名称" show-overflow-tooltip />
        <el-table-column prop="code" label="权限标识" width="180" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'primary' : row.type === 2 ? 'success' : 'info'">
              {{ row.type === 1 ? '菜单' : row.type === 2 ? '按钮' : '目录' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" width="180" show-overflow-tooltip />
        <el-table-column prop="component" label="组件路径" width="180" show-overflow-tooltip />
        <el-table-column prop="icon" label="图标" width="100" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.icon">
              <component :is="row.icon" />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :icon="Plus"
              @click="handleAdd(row)"
              v-if="row.type !== 2"
            >
              新增
            </el-button>
            <el-button
              type="primary"
              link
              :icon="Edit"
              @click="handleUpdate(row)"
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
    </el-card>

    <!-- 添加/修改权限对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="600px"
      append-to-body
    >
      <el-form
        ref="permissionFormRef"
        :model="permissionForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="上级权限">
          <el-tree-select
            v-model="permissionForm.parentId"
            :data="parentOptions"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            value-key="id"
            placeholder="选择上级权限"
            check-strictly
            :render-after-expand="false"
          />
        </el-form-item>
        <el-form-item label="权限类型" prop="type">
          <el-radio-group v-model="permissionForm.type">
            <el-radio :label="0">目录</el-radio>
            <el-radio :label="1">菜单</el-radio>
            <el-radio :label="2">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="permissionForm.name" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="权限标识" prop="code" v-if="permissionForm.type === 2">
          <el-input v-model="permissionForm.code" placeholder="请输入权限标识" />
        </el-form-item>
        <el-form-item label="路由路径" prop="path" v-if="permissionForm.type !== 2">
          <el-input v-model="permissionForm.path" placeholder="请输入路由路径" />
        </el-form-item>
        <el-form-item label="组件路径" prop="component" v-if="permissionForm.type === 1">
          <el-input v-model="permissionForm.component" placeholder="请输入组件路径" />
        </el-form-item>
        <el-form-item label="图标" prop="icon" v-if="permissionForm.type !== 2">
          <el-input v-model="permissionForm.icon" placeholder="请输入图标名称">
            <template #append>
              <el-button :icon="Search">选择图标</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="显示排序" prop="sort">
          <el-input-number v-model="permissionForm.sort" :min="0" :max="999" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="permissionForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
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
import { ref, reactive, onMounted } from 'vue'
import { Plus, Edit, Delete, Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 权限表格数据
const permissionList = ref([])
const loading = ref(false)

// 上级权限选项
const parentOptions = ref([])

// 弹窗属性
const dialog = reactive({
  title: '',
  visible: false
})

// 表单参数
const permissionForm = reactive({
  id: undefined,
  parentId: undefined,
  name: '',
  type: 0,
  code: '',
  path: '',
  component: '',
  icon: '',
  sort: 0,
  status: 1
})

// 表单校验规则
const rules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择权限类型', trigger: 'change' }
  ],
  code: [
    { required: true, message: '请输入权限标识', trigger: 'blur' }
  ],
  path: [
    { required: true, message: '请输入路由路径', trigger: 'blur' }
  ],
  component: [
    { required: true, message: '请输入组件路径', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入显示排序', trigger: 'blur' }
  ]
}

// 表单引用
const permissionFormRef = ref()

// 查询权限列表
async function getList() {
  loading.value = true
  try {
    // TODO: 调用后端API获取权限列表
    // const res = await listPermission()
    // permissionList.value = res.data

    // 模拟数据
    permissionList.value = [
      {
        id: 1,
        name: '系统管理',
        type: 0,
        path: '/system',
        icon: 'Setting',
        sort: 1,
        status: 1,
        children: [
          {
            id: 11,
            parentId: 1,
            name: '用户管理',
            type: 1,
            path: 'user',
            component: 'system/user/index',
            sort: 1,
            status: 1,
            children: [
              {
                id: 111,
                parentId: 11,
                name: '用户查询',
                type: 2,
                code: 'system:user:query',
                sort: 1,
                status: 1
              },
              {
                id: 112,
                parentId: 11,
                name: '用户新增',
                type: 2,
                code: 'system:user:add',
                sort: 2,
                status: 1
              }
            ]
          }
        ]
      }
    ]
  } catch (error) {
    console.error('获取权限列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 构建上级权限选项
function buildParentOptions() {
  // 过滤掉按钮类型的权限
  const filterButtons = (items) => {
    return items.filter(item => {
      if (item.children) {
        item.children = filterButtons(item.children)
      }
      return item.type !== 2
    })
  }
  
  parentOptions.value = [
    { id: 0, name: '主目录', children: filterButtons(JSON.parse(JSON.stringify(permissionList.value))) }
  ]
}

// 新增按钮操作
function handleAdd(row) {
  reset()
  dialog.title = '添加权限'
  dialog.visible = true
  buildParentOptions()
  
  if (row) {
    permissionForm.parentId = row.id
    if (row.type === 0) {
      permissionForm.type = 1
    } else if (row.type === 1) {
      permissionForm.type = 2
    }
  }
}

// 修改按钮操作
function handleUpdate(row) {
  reset()
  dialog.title = '修改权限'
  dialog.visible = true
  buildParentOptions()
  Object.assign(permissionForm, row)
}

// 表单重置
function reset() {
  permissionForm.id = undefined
  permissionForm.parentId = undefined
  permissionForm.name = ''
  permissionForm.type = 0
  permissionForm.code = ''
  permissionForm.path = ''
  permissionForm.component = ''
  permissionForm.icon = ''
  permissionForm.sort = 0
  permissionForm.status = 1
  permissionFormRef.value?.resetFields()
}

// 取消按钮
function cancel() {
  dialog.visible = false
  reset()
}

// 提交按钮
async function submitForm() {
  try {
    await permissionFormRef.value.validate()
    // TODO: 调用后端API保存权限信息
    ElMessage.success(permissionForm.id ? '修改成功' : '新增成功')
    dialog.visible = false
    getList()
  } catch (error) {
    console.error('表单校验失败:', error)
  }
}

// 删除按钮操作
function handleDelete(row) {
  ElMessageBox.confirm(
    `是否确认删除名称为"${row.name}"的权限？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    // TODO: 调用后端API删除权限
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {})
}

// 权限状态修改
async function handleStatusChange(row) {
  // TODO: 调用后端API修改权限状态
  ElMessage.success('修改成功')
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;

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