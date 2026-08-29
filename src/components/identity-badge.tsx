import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getStoredOperator, getRoleLabel } from '@/identity'

/**
 * 角落身份标签
 * 显示当前用户昵称和角色，点击跳转到「我的」页面
 */
export function IdentityBadge() {
  const operator = getStoredOperator()
  if (!operator) return null

  const handleClick = () => {
    Taro.switchTab({ url: '/pages/profile/index' })
  }

  return (
    <View
      onClick={handleClick}
      className="fixed top-12 right-4 z-50 flex items-center gap-1 bg-white/90 rounded-full px-3 py-1 shadow-sm border border-gray-100"
    >
      <View className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
        <Text className="text-white text-xs font-bold">
          {operator.displayName.charAt(0)}
        </Text>
      </View>
      <Text className="text-xs text-gray-600">
        {operator.displayName}·{getRoleLabel(operator.role)}
      </Text>
    </View>
  )
}
