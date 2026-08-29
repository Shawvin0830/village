/**
 * 轻量身份管理模块
 * 只需昵称 + 角色，无需项目码和角色码
 */

import Taro from '@tarojs/taro'

export type OperatorRole = 'admin' | 'editor' | 'viewer'

export interface StoredOperator {
  id: string
  displayName: string
  role: OperatorRole
  operatorToken: string
}

const STORAGE_KEY = 'village_operator'

const ROLE_LABELS: Record<OperatorRole, string> = {
  admin: '管理员',
  editor: '协作者',
  viewer: '记录者',
}

export function getRoleLabel(role: OperatorRole): string {
  return ROLE_LABELS[role] || role
}

export function getStoredOperator(): StoredOperator | null {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredOperator
  } catch {
    return null
  }
}

export function saveOperator(operator: StoredOperator): void {
  Taro.setStorageSync(STORAGE_KEY, JSON.stringify(operator))
}

export function clearOperator(): void {
  Taro.removeStorageSync(STORAGE_KEY)
}

export function getOperatorToken(): string | null {
  return getStoredOperator()?.operatorToken ?? null
}
