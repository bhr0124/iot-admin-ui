<template>
  <div class="app-wrapper">
    <!-- 侧边栏 -->
    <div class="sidebar-container">
      <div class="logo-container">
        <h1 class="logo-title">农业物联网</h1>
      </div>
      <el-menu
        :default-active="route.path"
        :unique-opened="true"
        :collapse="false"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <sidebar-item v-for="route in routes" :key="route.path" :item="route" :base-path="route.path"/>
      </el-menu>
    </div>

    <!-- 主要内容区 -->
    <div class="main-container">
      <!-- 顶部导航栏 -->
      <div class="navbar">
        <breadcrumb class="breadcrumb-container"/>
        <div class="right-menu">
          <el-dropdown trigger="click">
            <div class="avatar-wrapper">
              <el-avatar :size="40" icon="UserFilled"/>
              <span class="user-name">{{ userName }}</span>
              <el-icon><CaretBottom /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 主要内容 -->
      <div class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { constantRoutes } from '@/router'
import SidebarItem from './components/SidebarItem.vue'
import Breadcrumb from './components/Breadcrumb.vue'
import { CaretBottom } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const routes = computed(() => {
  return constantRoutes.filter(route => !route.hidden)
})

const userName = computed(() => {
  return userStore.name || '管理员'
})

const handleLogout = async () => {
  await userStore.logout()
  router.push('/login')
}
</script>

<style lang="scss" scoped>
.app-wrapper {
  height: 100%;
  display: flex;

  .sidebar-container {
    width: 210px;
    height: 100%;
    background: #304156;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    overflow-y: auto;

    .logo-container {
      height: 50px;
      padding: 10px 0;
      text-align: center;
      
      .logo-title {
        color: #fff;
        font-size: 18px;
        margin: 0;
        line-height: 30px;
      }
    }
  }

  .main-container {
    flex: 1;
    margin-left: 210px;
    position: relative;
    
    .navbar {
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 15px;
      box-shadow: 0 1px 4px rgba(0,21,41,.08);
      
      .breadcrumb-container {
        float: left;
      }
      
      .right-menu {
        float: right;
        
        .avatar-wrapper {
          display: flex;
          align-items: center;
          cursor: pointer;
          
          .user-name {
            margin: 0 5px;
            color: #333;
          }
        }
      }
    }

    .app-main {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background-color: #f0f2f5;
    }
  }
}
</style> 