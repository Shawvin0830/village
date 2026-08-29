import Taro from '@tarojs/taro'

export type OperatorRole = 'admin' | 'editor' | 'viewer' | ''

export interface StoredOperatorIdentity {
  token: string
  projectCode: string
  displayName: string
  role: OperatorRole
  roleLabel: string
}

export const OPERATOR_TOKEN_KEY = 'vm_operator_token'
export const PROJECT_CODE_KEY = 'vm_project_code'
export const DISPLAY_NAME_KEY = 'vm_display_name'
export const OPERATOR_ROLE_KEY = 'vm_operator_role'
export const OPERATOR_ROLE_LABEL_KEY = 'vm_operator_role_label'

export const generateOperatorToken = () =>
  `op-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`

export const getStoredOperatorIdentity = (): StoredOperatorIdentity => ({
  token: Taro.getStorageSync(OPERATOR_TOKEN_KEY) || '',
  projectCode: Taro.getStorageSync(PROJECT_CODE_KEY) || '',
  displayName: Taro.getStorageSync(DISPLAY_NAME_KEY) || '',
  role: Taro.getStorageSync(OPERATOR_ROLE_KEY) || '',
  roleLabel: Taro.getStorageSync(OPERATOR_ROLE_LABEL_KEY) || '',
})

export const saveStoredOperatorIdentity = (identity: StoredOperatorIdentity) => {
  Taro.setStorageSync(OPERATOR_TOKEN_KEY, identity.token)
  Taro.setStorageSync(PROJECT_CODE_KEY, identity.projectCode)
  Taro.setStorageSync(DISPLAY_NAME_KEY, identity.displayName)
  Taro.setStorageSync(OPERATOR_ROLE_KEY, identity.role)
  Taro.setStorageSync(OPERATOR_ROLE_LABEL_KEY, identity.roleLabel)
}

export const roleCanEdit = (role: OperatorRole) => role === 'admin' || role === 'editor'

export const roleCanDelete = (role: OperatorRole) => role === 'admin'
