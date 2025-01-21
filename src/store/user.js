import { defineStore } from 'pinia'
import { login, logout, getInfo } from '@/api/auth'
import { getToken, setToken, removeToken } from '@/utils/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    name: '',
    avatar: '',
    roles: []
  }),

  actions: {
    // 用户登录
    async login(userInfo) {
      const { username, password } = userInfo
      try {
        const response = await login({ username: username.trim(), password })
        const { data } = response
        this.token = data
        setToken(data)
        return Promise.resolve()
      } catch (error) {
        return Promise.reject(error)
      }
    },

    // 获取用户信息
    async getInfo() {
      try {
        const { data } = await getInfo()
        const { roles, name, avatar } = data

        if (!roles || roles.length <= 0) {
          throw new Error('getInfo: roles must be a non-null array!')
        }

        this.roles = roles
        this.name = name
        this.avatar = avatar
        return Promise.resolve(data)
      } catch (error) {
        return Promise.reject(error)
      }
    },

    // 用户登出
    async logout() {
      try {
        await logout()
        this.resetToken()
        return Promise.resolve()
      } catch (error) {
        return Promise.reject(error)
      }
    },

    // 重置token
    resetToken() {
      this.token = ''
      this.roles = []
      removeToken()
    }
  }
}) 