import request from '@/utils/request'

// 获取设备类型列表
export function listDeviceType(query) {
  return request({
    url: '/device/type/list',
    method: 'get',
    params: query
  })
}

// 获取所有设备类型（用于下拉选择）
export function listAllDeviceType() {
  return request({
    url: '/device/type/listAll',
    method: 'get'
  })
} 