import { View, Text } from '@tarojs/components'
import { useState, useCallback } from 'react'
import Taro, { useLoad , useRouter } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Network } from '@/network'
import { Plus, BookOpen, Mic, ShieldCheck, Trash2 } from 'lucide-react-taro'

interface Subtopic {
  id: string
  name: string
  icon: string
  transcript_status: string
  verify_status: string
  auth_level: string
  summary: string | null
}

interface TopicDetail {
  id: string
  name: string
  description: string | null
  status: string
  subtopics: Subtopic[]
  created_at: string
}

const AUTH_MAP: Record<string, { label: string; icon: string; color: string }> = {
  not_set: { label: '未授权', icon: '❓', color: 'bg-stone-100 text-stone-500' },
  archived: { label: '仅存档', icon: '🔒', color: 'bg-stone-100 text-stone-600' },
  village: { label: '村内可见', icon: '🔓', color: 'bg-blue-50 text-blue-700' },
  public: { label: '可分享', icon: '📢', color: 'bg-amber-50 text-amber-700' },
}

const TopicDetailPage = () => {
  const router = useRouter()
  const topicId = router.params.id || ''

  const [topic, setTopic] = useState<TopicDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddSub, setShowAddSub] = useState(false)
  const [subName, setSubName] = useState('')
  const [subIcon, setSubIcon] = useState('📌')
  const [adding, setAdding] = useState(false)

  const ICONS = ['📌', '🏛️', '🪵', '🐉', '🎭', '🍵', '🏮', '🎋', '📿', '🧱']

  const fetchDetail = useCallback(async () => {
    if (!topicId) return
    try {
      setLoading(true)
      const res = await Network.request({ url: `/api/topics/${topicId}` })
      console.log('Topic detail:', res.data)
      const data = res.data?.data
      if (data) {
        setTopic(data)
      }
    } catch (err) {
      console.error('获取话题详情失败:', err)
    } finally {
      setLoading(false)
    }
  }, [topicId])

  useLoad(() => {
    fetchDetail()
  })

  const handleAddSubtopic = async () => {
    if (!subName.trim()) {
      Taro.showToast({ title: '请输入子话题名称', icon: 'none' })
      return
    }
    try {
      setAdding(true)
      const res = await Network.request({
        url: `/api/topics/${topicId}/subtopics`,
        method: 'POST',
        data: { name: subName.trim(), icon: subIcon },
      })
      console.log('Add subtopic:', res.data)
      if (res.data?.data) {
        Taro.showToast({ title: '添加成功', icon: 'success' })
        setShowAddSub(false)
        setSubName('')
        setSubIcon('📌')
        fetchDetail()
      }
    } catch (err) {
      console.error('添加子话题失败:', err)
      Taro.showToast({ title: '添加失败', icon: 'none' })
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteSubtopic = async (subId: string) => {
    const modal = await Taro.showModal({ title: '确认删除', content: '删除后无法恢复，确定要删除吗？' })
    if (!modal.confirm) return
    try {
      await Network.request({
        url: `/api/topics/${topicId}/subtopics/${subId}`,
        method: 'DELETE',
      })
      Taro.showToast({ title: '已删除', icon: 'success' })
      fetchDetail()
    } catch (err) {
      console.error('删除子话题失败:', err)
    }
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-stone-50 px-4 pt-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-20 w-full mb-4" />
        <Skeleton className="h-16 w-full mb-2" />
        <Skeleton className="h-16 w-full mb-2" />
      </View>
    )
  }

  if (!topic) {
    return (
      <View className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Text className="block text-stone-500">话题不存在</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-stone-50 pb-8">
      {/* 话题信息 */}
      <View className="px-4 pt-6 pb-4">
        <Text className="block text-xl font-bold text-stone-800 mb-1">{topic.name}</Text>
        {topic.description && (
          <Text className="block text-sm text-stone-500">{topic.description}</Text>
        )}
      </View>

      {/* 快捷操作 */}
      <View className="px-4 mb-4">
        <View className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="flex flex-col items-center gap-1 h-auto py-3 border-stone-200 bg-white"
            onClick={() => Taro.navigateTo({ url: `/pages/interview-plan/index?topicId=${topicId}` })}
          >
            <BookOpen size={20} color="#B45309" />
            <Text className="text-xs text-stone-700">采访策划</Text>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-1 h-auto py-3 border-stone-200 bg-white"
            onClick={() => Taro.navigateTo({ url: `/pages/interview-record/index?topicId=${topicId}` })}
          >
            <Mic size={20} color="#4D7C0F" />
            <Text className="text-xs text-stone-700">录音转写</Text>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-1 h-auto py-3 border-stone-200 bg-white"
            onClick={() => Taro.navigateTo({ url: `/pages/authorization/index?topicId=${topicId}` })}
          >
            <ShieldCheck size={20} color="#166534" />
            <Text className="text-xs text-stone-700">授权管理</Text>
          </Button>
        </View>
      </View>

      {/* 子话题列表 */}
      <View className="px-4">
        <View className="flex items-center justify-between mb-3">
          <Text className="block text-base font-semibold text-stone-800">子话题</Text>
          <Button size="sm" variant="ghost" className="text-amber-700" onClick={() => setShowAddSub(true)}>
            <Plus size={16} color="#B45309" className="mr-1" />
            <Text>添加</Text>
          </Button>
        </View>

        {topic.subtopics.length === 0 ? (
          <Card className="border-stone-100 bg-white">
            <CardContent className="p-6 flex flex-col items-center">
              <Text className="block text-3xl mb-2">🌱</Text>
              <Text className="block text-sm text-stone-500 text-center">
                还没有子话题，点击上方添加开始
              </Text>
            </CardContent>
          </Card>
        ) : (
          <View className="space-y-3">
            {topic.subtopics.map((sub) => {
              const authInfo = AUTH_MAP[sub.auth_level] || AUTH_MAP.not_set
              return (
                <Card key={sub.id} className="border-stone-100 shadow-sm bg-white">
                  <CardContent className="p-4">
                    <View className="flex items-start justify-between">
                      <View className="flex items-start gap-2 flex-1">
                        <Text className="text-xl mt-1">{sub.icon}</Text>
                        <View className="flex-1">
                          <Text className="block text-sm font-semibold text-stone-800 mb-1">
                            {sub.name}
                          </Text>
                          {sub.summary && (
                            <Text className="block text-xs text-stone-500 mb-2 line-clamp-2">
                              {sub.summary}
                            </Text>
                          )}
                          <View className="flex flex-wrap gap-1">
                            <Badge
                              className={`text-xs ${
                                sub.transcript_status === 'transcribed'
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              <Text className="text-xs">
                                {sub.transcript_status === 'transcribed' ? '已转录' : '未转录'}
                              </Text>
                            </Badge>
                            <Badge
                              className={`text-xs ${
                                sub.verify_status === 'verified'
                                  ? 'bg-green-50 text-green-700'
                                  : sub.verify_status === 'pending'
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              <Text className="text-xs">
                                {sub.verify_status === 'verified'
                                  ? '已核实'
                                  : sub.verify_status === 'pending'
                                    ? '待核实'
                                    : sub.verify_status === 'disputed'
                                      ? '有争议'
                                      : '未核实'}
                              </Text>
                            </Badge>
                            <Badge className={`text-xs ${authInfo.color}`}>
                              <Text className="text-xs">
                                {authInfo.icon} {authInfo.label}
                              </Text>
                            </Badge>
                          </View>
                        </View>
                      </View>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-stone-400"
                        onClick={() => handleDeleteSubtopic(sub.id)}
                      >
                        <Trash2 size={16} color="#B45309" />
                      </Button>
                    </View>
                  </CardContent>
                </Card>
              )
            })}
          </View>
        )}
      </View>

      {/* 添加子话题弹窗 */}
      <Dialog open={showAddSub} onOpenChange={setShowAddSub}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              <Text>添加子话题</Text>
            </DialogTitle>
            <DialogDescription>
              <Text>为当前话题添加一个子话题</Text>
            </DialogDescription>
          </DialogHeader>
          <View className="space-y-4 mt-4">
            <View>
              <Text className="block text-sm font-medium text-stone-700 mb-2">选择图标</Text>
              <View className="flex flex-wrap gap-2">
                {ICONS.map((icon) => (
                  <Button
                    key={icon}
                    size="sm"
                    variant={subIcon === icon ? 'default' : 'outline'}
                    className={subIcon === icon ? 'bg-amber-700 text-white' : 'border-stone-200'}
                    onClick={() => setSubIcon(icon)}
                  >
                    <Text>{icon}</Text>
                  </Button>
                ))}
              </View>
            </View>
            <View>
              <Text className="block text-sm font-medium text-stone-700 mb-2">子话题名称</Text>
              <View className="bg-stone-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="如：木雕、屋脊装饰"
                  value={subName}
                  onInput={(e) => setSubName(e.detail.value)}
                />
              </View>
            </View>
            <View className="flex gap-3">
              <Button variant="outline" className="flex-1 border-stone-200" onClick={() => setShowAddSub(false)}>
                <Text>取消</Text>
              </Button>
              <Button
                className="flex-1 bg-amber-700 text-white"
                onClick={handleAddSubtopic}
                disabled={adding}
              >
                <Text>{adding ? '添加中...' : '添加'}</Text>
              </Button>
            </View>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default TopicDetailPage
