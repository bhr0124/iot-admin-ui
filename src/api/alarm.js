import request from '@/utils/request'

// 获取告警统计数据
export function getAlarmStatistics() {
  return request({
    url: '/alarm/statistics',
    method: 'get'
  })
}

// 获取告警列表
export function listAlarm(query) {
  return request({
    url: '/alarm/list',
    method: 'get',
    params: query
  })
}

// 处理告警
export function processAlarm(data) {
  return request({
    url: '/alarm/process',
    method: 'post',
    params: data
  })
}

// 忽略告警
export function ignoreAlarm(alarmId) {
  return request({
    url: `/alarm/${alarmId}/ignore`,
    method: 'put'
  })
}

// 批量删除告警
export function deleteAlarms(alarmIds) {
  return request({
    url: '/alarm',
    method: 'delete',
    data: alarmIds
  })
}

// 导出告警数据
export function exportAlarm(query) {
  return request({
    url: '/alarm/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  })
}

// 获取告警详情
export function getAlarmDetail(alarmId) {
  return request({
    url: `/alarm/${alarmId}`,
    method: 'get'
  })
} 