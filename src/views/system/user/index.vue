<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-card class="search-wrapper">
      <el-form :model="queryParams" ref="queryFormRef" :inline="true">
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="queryParams.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="queryParams.phone"
            placeholder="请输入手机号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="用户状态" clearable>
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
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增用户</el-button>
      </template>

      <!-- 表格区域 -->
      <el-table
        v-loading="loading"
        :data="userList"
        border
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="username" label="用户名" width="120" show-overflow-tooltip />
        <el-table-column prop="nickname" label="昵称" width="120" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号" width="120" show-overflow-tooltip />
        <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
        <el-table-column prop="role" label="角色" width="120" show-overflow-tooltip />
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
        <el-table-column prop="createTime" label="创建时间" width="180" show-overflow-tooltip />
        <el-table-column label="操作" align="center" width="180">
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
              :icon="Key"
              @click="handleResetPwd(row)"
            >
              重置密码
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

    <!-- 添加/修改用户对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="500px"
      append-to-body
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="userForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色" prop="roleIds">
          <el-select
            v-model="userForm.roleIds"
            multiple
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="userForm.status">
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
import { Search, Refresh, Plus, Edit, Key, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { validPhone, validEmail } from '@/utils/validate'

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  username: '',
  phone: '',
  status: ''
})

// 总数据条数
const total = ref(0)

// 用户表格数据
const userList = ref([])
const loading = ref(false)

// 角色选项
const roleOptions = ref([])

// 弹窗属性
const dialog = reactive({
  title: '',
  visible: false
})

// 表单参数
const userForm = reactive({
  id: undefined,
  username: '',
  nickname: '',
  password: '',
  phone: '',
  email: '',
  roleIds: [],
  status: 1
})

// 表单校验规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '用户名长度必须在4-20个字符之间', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { validator: validatePhone, trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { validator: validateEmail, trigger: 'blur' }
  ],
  roleIds: [
    { required: true, message: '请选择角色', trigger: 'blur' }
  ]
}

// 表单引用
const queryFormRef = ref()
const userFormRef = ref()

// 自定义校验规则
function validatePhone(rule, value, callback) {
  if (!validPhone(value)) {
    callback(new Error('请输入正确的手机号'))
  } else {
    callback()
  }
}

function validateEmail(rule, value, callback) {
  if (!validEmail(value)) {
    callback(new Error('请输入正确的邮箱地址'))
  } else {
    callback()
  }
}

// 查询用户列表
async function getList() {
  loading.value = true
  try {
    // TODO: 调用后端API获取用户列表
    // const res = await listUser(queryParams)
    // userList.value = res.data.rows
    // total.value = res.data.total

    // 模拟数据
    userList.value = [
      {
        id: 1,
        username: 'admin',
        nickname: '管理员',
        phone: '13800138000',
        email: 'admin@example.com',
        role: '超级管理员',
        status: 1,
        createTime: '2024-01-21 12:00:00'
      }
    ]
    total.value = 1
  } catch (error) {
    console.error('获取用户列表失败:', error)
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
  dialog.title = '添加用户'
  dialog.visible = true
}

// 修改按钮操作
function handleUpdate(row) {
  reset()
  dialog.title = '修改用户'
  dialog.visible = true
  // TODO: 调用后端API获取用户详细信息
  Object.assign(userForm, row)
}

// 表单重置
function reset() {
  userForm.id = undefined
  userForm.username = ''
  userForm.nickname = ''
  userForm.password = ''
  userForm.phone = ''
  userForm.email = ''
  userForm.roleIds = []
  userForm.status = 1
  userFormRef.value?.resetFields()
}

// 取消按钮
function cancel() {
  dialog.visible = false
  reset()
}

// 提交按钮
async function submitForm() {
  try {
    await userFormRef.value.validate()
    // TODO: 调用后端API保存用户信息
    ElMessage.success(userForm.id ? '修改成功' : '新增成功')
    dialog.visible = false
    getList()
  } catch (error) {
    console.error('表单校验失败:', error)
  }
}

// 删除按钮操作
function handleDelete(row) {
  ElMessageBox.confirm(
    `是否确认删除用户名为"${row.username}"的用户？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    // TODO: 调用后端API删除用户
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {})
}

// 用户状态修改
async function handleStatusChange(row) {
  // TODO: 调用后端API修改用户状态
  ElMessage.success('修改成功')
}

// 重置密码按钮操作
function handleResetPwd(row) {
  ElMessageBox.prompt('请输入新密码', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^.{6,20}$/,
    inputErrorMessage: '密码长度必须在6-20个字符之间'
  }).then(async ({ value }) => {
    // TODO: 调用后端API重置密码
    ElMessage.success('重置成功')
  }).catch(() => {})
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

// 获取角色列表
async function getRoleOptions() {
  // TODO: 调用后端API获取角色列表
  roleOptions.value = [
    { id: 1, name: '超级管理员' },
    { id: 2, name: '普通用户' }
  ]
}

onMounted(() => {
  getList()
  getRoleOptions()
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