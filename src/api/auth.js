import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export function register(data) {
  return request({
    url: '/auth/register',
    method: 'post',
    data
  })
}

export function getInfo() {
  return request({
    url: '/auth/info',
    method: 'get'
  })
}

export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

export function updatePassword(data) {
  return request({
    url: '/auth/password',
    method: 'put',
    data
  })
}

export function updateProfile(data) {
  return request({
    url: '/auth/profile',
    method: 'put',
    data
  })
} 