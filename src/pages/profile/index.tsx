import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Info, Heart, BookOpen, LogOut } from 'lucide-react-taro'
import {
  getStoredOperator,
  saveOperator,
  clearOperator,
  getRoleLabel,
  type OperatorRole,
  type StoredOperator,
} from '@/identity'
import { Network } from '@/network'

const ROLES: { value: OperatorRole; label: string; desc: string }[] = [
  { value: 'admin', label: '管理员', desc: '可以创建、编辑、管理所有内容' },
  { value: 'editor', label: '协作者', desc: '可以编辑和补充内容' },
  { value: 'viewer', label: '记录者', desc: '只读浏览，查看村庄记忆' },
]

const ProfilePage = () => {
  const [operator, setOperator] = useState<StoredOperator | null>(getStoredOperator)
  const [displayName, setDisplayName] = useState('')
  const [selectedRole, setSelectedRole] = useState<OperatorRole>('viewer')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    const name = displayName.trim()
    if (!name) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/operators/identify',
        method: 'POST',
        data: { display_name: name, role: selectedRole },
      })
      const data = (res.data as any)?.data
      if (data) {
        const op: StoredOperator = {
          id: data.id,
          displayName: data.display_name,
          role: data.role as OperatorRole,
          operatorToken: data.operator_token,
        }
        saveOperator(op)
        setOperator(op)
        Taro.showToast({ title: '设置成功', icon: 'success' })
      }
    } catch (e) {
      Taro.showToast({ title: '设置失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearOperator()
    setOperator(null)
    setDisplayName('')
  }

  return (
    <View className="min-h-screen bg-stone-50 pb-20">
      {/* 头部 */}
      <View className="px-4 pt-6 pb-4">
        <Text className="block text-xl font-bold text-stone-800">我的</Text>
      </View>

      {/* 身份卡片 */}
      <View className="px-4 mb-4">
        <Card className="border-stone-100 bg-white">
          <CardContent className="p-4">
            {operator ? (
              <View>
                <View className="flex items-center gap-3 mb-3">
                  <View className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Text className="text-white text-lg font-bold">
                      {operator.displayName.charAt(0)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="block text-base font-semibold text-stone-800">
                      {operator.displayName}
                    </Text>
                    <Text className="block text-sm text-emerald-600">
                      {getRoleLabel(operator.role)}
                    </Text>
                  </View>
                  <View onClick={handleLogout}>
                    <LogOut size={20} color="#999" />
                  </View>
                </View>
                <Text className="block text-xs text-stone-400">
                  点击右下角角落标签可快速查看身份
                </Text>
              </View>
            ) : (
              <View>
                <Text className="block text-sm font-medium text-stone-700 mb-3">
                  设置你的身份
                </Text>
                {/* 昵称输入 */}
                <View className="mb-3">
                  <View className="bg-stone-50 rounded-xl px-3 py-2">
                    <Input
                      className="w-full bg-transparent text-sm"
                      placeholder="输入你的昵称"
                      value={displayName}
                      onInput={(e) => setDisplayName(e.detail.value)}
                    />
                  </View>
                </View>
                {/* 角色选择 */}
                <View className="mb-3">
                  {ROLES.map((r) => (
                    <View
                      key={r.value}
                      onClick={() => setSelectedRole(r.value)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-2 ${
                        selectedRole === r.value
                          ? 'bg-emerald-50 border border-emerald-200'
                          : 'bg-stone-50 border border-transparent'
                      }`}
                    >
                      <View
                        className={`w-4 h-4 rounded-full border-2 ${
                          selectedRole === r.value
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-stone-300'
                        }`}
                      />
                      <View>
                        <Text className="block text-sm font-medium text-stone-700">
                          {r.label}
                        </Text>
                        <Text className="block text-xs text-stone-400">{r.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <Button
                  className="w-full bg-emerald-600 text-white rounded-xl"
                  disabled={loading}
                  onClick={handleRegister}
                >
                  <Text className="text-white">{loading ? '设置中...' : '确认设置'}</Text>
                </Button>
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* 项目信息 */}
      <View className="px-4 mb-4">
        <Card className="border-stone-100 bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <View className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
              <BookOpen size={28} color="#B45309" />
            </View>
            <View>
              <Text className="block text-base font-semibold text-stone-800">村庄记忆</Text>
              <Text className="block text-sm text-stone-500">记录村庄文化，传承集体记忆</Text>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 功能列表 */}
      <View className="px-4 mb-4">
        <Card className="border-stone-100 bg-white">
          <CardContent className="p-0">
            <View className="px-4 py-3 flex items-center gap-3">
              <Info size={20} color="#78716C" />
              <Text className="block text-sm text-stone-700 flex-1">关于村庄记忆</Text>
            </View>
            <Separator className="bg-stone-100" />
            <View className="px-4 py-3 flex items-center gap-3">
              <Heart size={20} color="#78716C" />
              <Text className="block text-sm text-stone-700 flex-1">使用帮助</Text>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 说明 */}
      <View className="px-4">
        <Card className="border-amber-100 bg-amber-50">
          <CardContent className="p-4">
            <Text className="block text-sm font-medium text-stone-800 mb-2">
              关于这个小程序
            </Text>
            <Text className="block text-xs text-stone-500 leading-relaxed">
              村庄记忆是一个帮助乡村图书馆记录村庄文化和老人记忆的AI助手。
              通过采访策划、录音转写、授权管理等工具，帮助孩子和大人们一起记录珍贵的村庄记忆。
            </Text>
            <Text className="block text-xs text-stone-400 mt-3">
              V1.0
            </Text>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}

export default ProfilePage
