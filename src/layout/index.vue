<template>
  <div class="app-wrapper">
    <!-- 侧边栏 -->
    <div class="sidebar-container">
      <div class="logo-container">
        <img src="@/assets/logo.png" alt="Logo" class="logo">
        <h1 class="title">农业物联网平台</h1>
      </div>
      <el-menu
        :default-active="route.path"
        class="sidebar-menu"
        :collapse="isCollapse"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <sidebar-item v-for="route in routes" :key="route.path" :item="route" :base-path="route.path" />
      </el-menu>
    </div>

    <!-- 主要内容区 -->
    <div class="main-container">
      <!-- 顶部导航栏 -->
      <div class="navbar">
        <div class="left">
          <el-icon class="fold-btn" @click="toggleSidebar">
            <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
          <breadcrumb />
        </div>
        <div class="right">
          <el-dropdown trigger="click">
            <div class="avatar-container">
              <el-avatar :size="32" :src="userStore.avatar" />
              <span class="username">{{ userStore.name }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleProfile">个人信息</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
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
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { constantRoutes } from '@/router'
import SidebarItem from './components/SidebarItem.vue'
import Breadcrumb from './components/Breadcrumb.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const routes = computed(() => constantRoutes)

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

const handleProfile = () => {
  router.push('/profile')
}

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
    background-color: #304156;
    transition: width 0.3s;
    overflow-x: hidden;

    &.is-collapse {
      width: 64px;
    }

    .logo-container {
      height: 50px;
      padding: 10px;
      display: flex;
      align-items: center;
      background: #2b2f3a;

      .logo {
        width: 32px;
        height: 32px;
        margin-right: 10px;
      }

      .title {
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        white-space: nowrap;
      }
    }

    .sidebar-menu {
      border: none;
    }
  }

  .main-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .navbar {
      height: 50px;
      padding: 0 15px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: #fff;
      box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

      .left {
        display: flex;
        align-items: center;

        .fold-btn {
          padding: 0 15px;
          font-size: 20px;
          cursor: pointer;
          transition: color 0.3s;

          &:hover {
            color: #409EFF;
          }
        }
      }

      .right {
        .avatar-container {
          display: flex;
          align-items: center;
          padding: 0 8px;
          cursor: pointer;

          .username {
            margin-left: 8px;
            font-size: 14px;
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