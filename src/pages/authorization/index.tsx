import { View, Text } from '@tarojs/components'
import { useState, useCallback } from 'react'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Network } from '@/network'
import { ShieldCheck, Check } from 'lucide-react-taro'

interface SubtopicAuth {
  id: string
  name: string
  icon: string
  summary: string | null
  auth_level: string
  auth_method: string | null
  auth_person: string | null
  auth_time: string | null
}

const AUTH_OPTIONS = [
  { value: 'archived', label: '仅存档', icon: '🔒', desc: '只有项目组能看' },
  { value: 'village', label: '村内可见', icon: '🔓', desc: '村里的人能看' },
  { value: 'public', label: '可对外分享', icon: '📢', desc: '经本人同意可以公开发布' },
]

const AuthorizationPage = () => {
  const router = useRouter()
  const topicId = router.params.topicId || ''

  const [subtopics, setSubtopics] = useState<SubtopicAuth[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const fetchSubtopics = useCallback(async () => {
    if (!topicId) return
    try {
      setLoading(true)
      const res = await Network.request({ url: `/api/topics/${topicId}/subtopics` })
      console.log('Auth subtopics:', res.data)
      const data = res.data?.data
      if (data) {
        setSubtopics(data)
      }
    } catch (err) {
      console.error('获取子话题失败:', err)
    } finally {
      setLoading(false)
    }
  }, [topicId])

  useLoad(() => {
    fetchSubtopics()
  })

  const handleSetAuth = async (subId: string, level: string) => {
    try {
      setSaving(subId)
      const res = await Network.request({
        url: `/api/topics/${topicId}/subtopics/${subId}/auth`,
        method: 'POST',
        data: {
          auth_level: level,
          auth_method: '口述同意',
          auth_person: '',
        },
      })
      console.log('Set auth:', res.data)
      if (res.data?.data) {
        Taro.showToast({ title: '授权已更新', icon: 'success' })
        fetchSubtopics()
      }
    } catch (err) {
      console.error('设置授权失败:', err)
      Taro.showToast({ title: '设置失败', icon: 'none' })
    } finally {
      setSaving(null)
    }
  }

  const getAuthBadge = (level: string) => {
    switch (level) {
      case 'archived':
        return <Badge className="bg-stone-100 text-stone-600"><Text className="text-xs">🔒 仅存档</Text></Badge>
      case 'village':
        return <Badge className="bg-blue-50 text-blue-700"><Text className="text-xs">🔓 村内可见</Text></Badge>
      case 'public':
        return <Badge className="bg-amber-50 text-amber-700"><Text className="text-xs">📢 可分享</Text></Badge>
      default:
        return <Badge className="bg-stone-100 text-stone-500"><Text className="text-xs">❓ 未授权</Text></Badge>
    }
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-stone-50 px-4 pt-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-stone-50 pb-8">
      {/* 头部 */}
      <View className="px-4 pt-6 pb-4">
        <View className="flex items-center gap-2 mb-2">
          <ShieldCheck size={24} color="#166534" />
          <Text className="block text-xl font-bold text-stone-800">授权管理</Text>
        </View>
        <Text className="block text-sm text-stone-500">
          逐个确认每个子话题的授权级别，老人随时可以改主意
        </Text>
      </View>

      {/* 子话题授权列表 */}
      <View className="px-4 space-y-4">
        {subtopics.length === 0 ? (
          <Card className="border-stone-100 bg-white">
            <CardContent className="p-6 flex flex-col items-center">
              <Text className="block text-3xl mb-2">🔐</Text>
              <Text className="block text-sm text-stone-500 text-center">
                还没有子话题，请先添加子话题并完成采访
              </Text>
            </CardContent>
          </Card>
        ) : (
          subtopics.map((sub) => (
            <Card key={sub.id} className="border-stone-100 bg-white">
              <CardContent className="p-4">
                <View className="flex items-center justify-between mb-3">
                  <View className="flex items-center gap-2">
                    <Text className="text-xl">{sub.icon}</Text>
                    <Text className="block text-sm font-semibold text-stone-800">{sub.name}</Text>
                  </View>
                  {getAuthBadge(sub.auth_level)}
                </View>

                {sub.summary && (
                  <Text className="block text-xs text-stone-500 mb-3">
                    内容简介：{sub.summary}
                  </Text>
                )}

                {/* 授权选项 */}
                <View className="space-y-2">
                  {AUTH_OPTIONS.map((opt) => {
                    const isSelected = sub.auth_level === opt.value
                    const isSavingThis = saving === sub.id
                    return (
                      <Button
                        key={opt.value}
                        variant="outline"
                        className={`w-full justify-between h-auto py-3 px-4 ${
                          isSelected
                            ? 'border-amber-300 bg-amber-50'
                            : 'border-stone-200 bg-white'
                        }`}
                        onClick={() => handleSetAuth(sub.id, opt.value)}
                        disabled={isSavingThis}
                      >
                        <View className="flex items-center gap-2">
                          <Text className="text-base">{opt.icon}</Text>
                          <View>
                            <Text className="block text-sm font-medium text-stone-800">
                              {opt.label}
                            </Text>
                            <Text className="block text-xs text-stone-400">{opt.desc}</Text>
                          </View>
                        </View>
                        {isSelected && <Check size={18} color="#B45309" />}
                      </Button>
                    )
                  })}
                </View>

                {/* 授权记录 */}
                {sub.auth_level !== 'not_set' && sub.auth_time && (
                  <View className="mt-3 pt-3 border-t border-stone-100">
                    <Text className="block text-xs text-stone-400">
                      授权方式：{sub.auth_method || '口述同意'} | 时间：{new Date(sub.auth_time).toLocaleDateString('zh-CN')}
                    </Text>
                    <Text className="block text-xs text-amber-600 mt-1">
                      ⚠️ 以后可以改主意
                    </Text>
                  </View>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </View>

      {/* 授权总览 */}
      {subtopics.length > 0 && subtopics.every((s) => s.auth_level !== 'not_set') && (
        <View className="px-4 mt-6">
          <Card className="border-green-100 bg-green-50">
            <CardContent className="p-4 flex flex-col items-center">
              <Text className="block text-3xl mb-2">🎉</Text>
              <Text className="block text-base font-semibold text-stone-800 mb-1">
                全部确认完毕
              </Text>
              <Text className="block text-sm text-stone-500 text-center">
                所有子话题的授权级别已确认
              </Text>
            </CardContent>
          </Card>
        </View>
      )}
    </View>
  )
}

export default AuthorizationPage
