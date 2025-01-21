<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-card class="search-wrapper">
      <el-form :model="queryParams" ref="queryFormRef" :inline="true">
        <el-form-item label="角色名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入角色名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="角色状态" clearable>
            <el-option label="启用" value="1" />
            <el-option label="禁用" value="0" />
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
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增角色</el-button>
      </template>

      <!-- 表格区域 -->
      <el-table
        v-loading="loading"
        :data="roleList"
        border
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="角色名称" width="150" show-overflow-tooltip />
        <el-table-column prop="code" label="角色编码" width="150" show-overflow-tooltip />
        <el-table-column prop="sort" label="显示顺序" width="100" align="center" />
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
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="180" show-overflow-tooltip />
        <el-table-column label="操作" align="center" width="250">
          <template #default="{ row }">
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
              @click="handlePermission(row)"
            >
              权限分配
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

    <!-- 添加/修改角色对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="500px"
      append-to-body
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="roleForm.code" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="显示顺序" prop="sort">
          <el-input-number v-model="roleForm.sort" :min="0" :max="999" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="roleForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="roleForm.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 分配权限对话框 -->
    <el-dialog
      title="分配权限"
      v-model="permissionDialog.visible"
      width="600px"
      append-to-body
    >
      <el-form label-width="80px">
        <el-form-item label="角色名称">
          <el-input v-model="permissionDialog.roleName" disabled />
        </el-form-item>
        <el-form-item label="权限分配">
          <el-tree
            ref="permissionTreeRef"
            :data="permissionTree"
            :props="{ label: 'name', children: 'children' }"
            show-checkbox
            node-key="id"
            empty-text="加载中，请稍候"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitPermission">确 定</el-button>
          <el-button @click="cancelPermission">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Plus, Edit, Setting, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  status: ''
})

// 总数据条数
const total = ref(0)

// 角色表格数据
const roleList = ref([])
const loading = ref(false)

// 弹窗属性
const dialog = reactive({
  title: '',
  visible: false
})

// 表单参数
const roleForm = reactive({
  id: undefined,
  name: '',
  code: '',
  sort: 0,
  status: 1,
  remark: ''
})

// 表单校验规则
const rules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入显示顺序', trigger: 'blur' }
  ]
}

// 表单引用
const queryFormRef = ref()
const roleFormRef = ref()

// 权限分配对话框
const permissionDialog = reactive({
  visible: false,
  roleId: undefined,
  roleName: ''
})

// 权限树数据
const permissionTree = ref([])
const permissionTreeRef = ref()

// 查询角色列表
async function getList() {
  loading.value = true
  try {
    // TODO: 调用后端API获取角色列表
    // const res = await listRole(queryParams)
    // roleList.value = res.data.rows
    // total.value = res.data.total

    // 模拟数据
    roleList.value = [
      {
        id: 1,
        name: '超级管理员',
        code: 'ROLE_ADMIN',
        sort: 1,
        status: 1,
        remark: '系统最高权限',
        createTime: '2024-01-21 12:00:00'
      },
      {
        id: 2,
        name: '普通用户',
        code: 'ROLE_USER',
        sort: 2,
        status: 1,
        remark: '普通用户权限',
        createTime: '2024-01-21 12:00:00'
      }
    ]
    total.value = 2
  } catch (error) {
    console.error('获取角色列表失败:', error)
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
  dialog.title = '添加角色'
  dialog.visible = true
}

// 修改按钮操作
function handleUpdate(row) {
  reset()
  dialog.title = '修改角色'
  dialog.visible = true
  // TODO: 调用后端API获取角色详细信息
  Object.assign(roleForm, row)
}

// 表单重置
function reset() {
  roleForm.id = undefined
  roleForm.name = ''
  roleForm.code = ''
  roleForm.sort = 0
  roleForm.status = 1
  roleForm.remark = ''
  roleFormRef.value?.resetFields()
}

// 取消按钮
function cancel() {
  dialog.visible = false
  reset()
}

// 提交按钮
async function submitForm() {
  try {
    await roleFormRef.value.validate()
    // TODO: 调用后端API保存角色信息
    ElMessage.success(roleForm.id ? '修改成功' : '新增成功')
    dialog.visible = false
    getList()
  } catch (error) {
    console.error('表单校验失败:', error)
  }
}

// 删除按钮操作
function handleDelete(row) {
  ElMessageBox.confirm(
    `是否确认删除角色名称为"${row.name}"的角色？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    // TODO: 调用后端API删除角色
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {})
}

// 角色状态修改
async function handleStatusChange(row) {
  // TODO: 调用后端API修改角色状态
  ElMessage.success('修改成功')
}

// 权限分配按钮操作
async function handlePermission(row) {
  permissionDialog.roleId = row.id
  permissionDialog.roleName = row.name
  permissionDialog.visible = true
  // TODO: 调用后端API获取权限树数据和角色已有权限
  permissionTree.value = [
    {
      id: 1,
      name: '系统管理',
      children: [
        {
          id: 11,
          name: '用户管理'
        },
        {
          id: 12,
          name: '角色管理'
        },
        {
          id: 13,
          name: '权限管理'
        }
      ]
    }
  ]
  // 设置角色已有权限
  permissionTreeRef.value?.setCheckedKeys([11, 12])
}

// 取消权限分配
function cancelPermission() {
  permissionDialog.visible = false
  permissionDialog.roleId = undefined
  permissionDialog.roleName = ''
  permissionTree.value = []
}

// 提交权限分配
async function submitPermission() {
  const checkedKeys = permissionTreeRef.value.getCheckedKeys()
  const halfCheckedKeys = permissionTreeRef.value.getHalfCheckedKeys()
  const permissionIds = [...checkedKeys, ...halfCheckedKeys]
  
  // TODO: 调用后端API保存角色权限
  ElMessage.success('权限分配成功')
  permissionDialog.visible = false
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
}

.dialog-footer {
  text-align: right;
}
</style> 