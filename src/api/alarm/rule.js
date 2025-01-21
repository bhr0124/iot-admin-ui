import request from '@/utils/request'

// 获取告警规则列表
export function listAlarmRule(query) {
  return request({
    url: '/alarm/rule/list',
    method: 'get',
    params: query
  })
}

// 获取告警规则详情
export function getAlarmRule(ruleId) {
  return request({
    url: `/alarm/rule/${ruleId}`,
    method: 'get'
  })
}

// 新增告警规则
export function addAlarmRule(data) {
  return request({
    url: '/alarm/rule',
    method: 'post',
    data: data
  })
}

// 修改告警规则
export function updateAlarmRule(data) {
  return request({
    url: '/alarm/rule',
    method: 'put',
    data: data
  })
}

// 删除告警规则
export function deleteAlarmRule(ruleIds) {
  return request({
    url: `/alarm/rule/${ruleIds}`,
    method: 'delete'
  })
}

// 启用/禁用告警规则
export function toggleAlarmRule(ruleId, enabled) {
  return request({
    url: `/alarm/rule/${ruleId}/${enabled}`,
    method: 'put'
  })
}

// 导出告警规则
export function exportAlarmRule(query) {
  return request({
    url: '/alarm/rule/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  })
}

// 获取告警规则统计信息
export function getAlarmRuleStatistics(ruleId) {
  return request({
    url: `/alarm/rule/${ruleId}/statistics`,
    method: 'get'
  })
}

// 获取告警规则的最近告警记录
export function getAlarmRuleRecords(ruleId, query) {
  return request({
    url: `/alarm/rule/${ruleId}/records`,
    method: 'get',
    params: query
  })
} 