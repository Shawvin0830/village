import { View, Text } from '@tarojs/components'
import { useState, useCallback } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Network } from '@/network'
import { BookOpen, Users, FileText, FolderOpen, FilePen, ChevronDown, ChevronUp, Plus } from 'lucide-react-taro'

interface Topic {
  id: string
  name: string
  description: string | null
  status: string
  is_completed: boolean
  subtopic_count: number
  has_interview_plan: boolean
  authorized_count: number
  interview_count: number
  organized_count: number
  has_story: boolean
  created_at: string
}

const IndexPage = () => {
  const [loading, setLoading] = useState(true)
  const [topics, setTopics] = useState<Topic[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/topics' })
      console.log('Topics response:', res.data)
      const data = res.data?.data
      if (Array.isArray(data)) {
        setTopics(data)
      }
    } catch (err) {
      console.error('获取话题列表失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    fetchTopics()
  })

  const activeTopics = topics.filter((t) => t.status !== 'archived')
  const archivedTopics = topics.filter((t) => t.status === 'archived')

  const handleToggleExpand = (topicId: string) => {
    setExpandedId(expandedId === topicId ? null : topicId)
  }

  const handleToggleComplete = async (topic: Topic) => {
    const newVal = !topic.is_completed
    try {
      const res = await Network.request({
        url: `/api/topics/${topic.id}/complete`,
        method: 'PUT',
        data: { isCompleted: newVal },
      })
      console.log('Toggle complete:', res.data)
      if (res.data?.data) {
        setTopics((prev) =>
          prev.map((t) =>
            t.id === topic.id ? { ...t, is_completed: newVal } : t,
          ),
        )
      }
    } catch (err) {
      console.error('更新完成状态失败:', err)
      Taro.showToast({ title: '更新失败', icon: 'none' })
    }
  }

  const goToTopics = (topicId: string) => {
    Taro.switchTab({ url: '/pages/topics/index' })
    setTimeout(() => {
      Taro.navigateTo({ url: `/pages/topic-detail/index?id=${topicId}` })
    }, 300)
  }

  const goToPlan = (topicId: string) => {
    Taro.navigateTo({ url: `/pages/interview-plan/index?topicId=${topicId}` })
  }

  const goToScript = (topicId: string) => {
    Taro.navigateTo({ url: `/pages/interview-script/index?topicId=${topicId}` })
  }

  const goToAuth = (topicId: string) => {
    Taro.navigateTo({ url: `/pages/authorization/index?topicId=${topicId}` })
  }

  const goToStories = () => {
    Taro.switchTab({ url: '/pages/material-library/index' })
  }

  const goToCreateTopic = () => {
    Taro.switchTab({ url: '/pages/topics/index' })
  }

  // 进度项状态
  const getProgressItems = (topic: Topic) => [
    {
      key: 'subtopics',
      label: '子议题数',
      icon: FolderOpen,
      status: topic.subtopic_count > 0 ? 'done' : 'pending',
      detail: `${topic.subtopic_count} 个子议题`,
      onClick: () => goToTopics(topic.id),
    },
    {
      key: 'plan',
      label: '采访策划',
      icon: BookOpen,
      status: topic.has_interview_plan ? 'done' : 'pending',
      detail: topic.has_interview_plan ? '已完成' : '未开始',
      onClick: () => goToPlan(topic.id),
    },
    {
      key: 'script',
      label: '采访提纲',
      icon: FilePen,
      status: topic.interview_count > 0 ? 'done' : 'pending',
      detail: topic.interview_count > 0 ? `${topic.interview_count} 份提纲` : '未开始',
      onClick: () => goToScript(topic.id),
    },
    {
      key: 'auth',
      label: '授权进度',
      icon: Users,
      status: topic.authorized_count > 0 ? 'done' : 'pending',
      detail: topic.authorized_count > 0 ? `${topic.authorized_count} 人已授权` : '未开始',
      onClick: () => goToAuth(topic.id),
    },
    {
      key: 'story',
      label: '村庄故事',
      icon: FileText,
      status: topic.has_story ? 'done' : 'pending',
      detail: topic.has_story ? '已生成' : '未生成',
      onClick: () => goToStories(),
    },
  ]

  if (loading) {
    return (
      <View className="min-h-screen bg-stone-50 px-4 pt-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-24 w-full mb-3" />
        <Skeleton className="h-24 w-full mb-3" />
        <Skeleton className="h-24 w-full" />
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-stone-50 pb-20">
      {/* 头部 */}
      <View className="px-4 pt-6 pb-4 flex items-center justify-between">
        <View>
          <Text className="block text-xl font-bold text-stone-800">话题进度</Text>
          <Text className="block text-sm text-stone-500">
            {activeTopics.length} 个进行中话题
          </Text>
        </View>
        <Button
          size="sm"
          className="bg-amber-700 hover:bg-amber-800 text-white"
          onClick={goToCreateTopic}
        >
          <Plus size={16} color="#FFFFFF" className="mr-1" />
          <Text>新建</Text>
        </Button>
      </View>

      {/* 进行中的话题卡片 */}
      <View className="px-4">
        {activeTopics.length === 0 ? (
          <Card className="border-stone-100 bg-white mt-2">
            <CardContent className="p-8 flex flex-col items-center">
              <BookOpen size={40} color="#D6D3D1" />
              <Text className="block text-sm text-stone-500 text-center mt-4">
                还没有进行中的话题{'\n'}点击「新建」开始记录村庄记忆
              </Text>
            </CardContent>
          </Card>
        ) : (
          <View className="space-y-3">
            {activeTopics.map((topic) => {
              const isExpanded = expandedId === topic.id
              const progressItems = getProgressItems(topic)
              const doneCount = progressItems.filter((p) => p.status === 'done').length

              return (
                <Card
                  key={topic.id}
                  className={`border-stone-100 shadow-sm bg-white ${topic.is_completed ? 'border-l-4 border-l-green-500' : ''}`}
                >
                  <CardContent className="p-4">
                    {/* 卡片头部 */}
                    <View
                      className="flex items-center gap-3"
                      onClick={() => handleToggleExpand(topic.id)}
                    >
                      <View className="flex-1 min-w-0">
                        <View className="flex items-center gap-2">
                          <Text className="block text-base font-semibold text-stone-800 truncate">
                            {topic.name}
                          </Text>
                          {topic.is_completed && (
                            <Badge className="bg-green-50 text-green-700">
                              <Text className="text-xs">已完成</Text>
                            </Badge>
                          )}
                        </View>
                        <View className="flex items-center gap-2 mt-1">
                          <Text className="text-xs text-stone-500">
                            {doneCount}/{progressItems.length} 项完成
                          </Text>
                          {topic.description && (
                            <Text className="text-xs text-stone-400 truncate">
                              {topic.description}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp size={20} color="#78716C" />
                        ) : (
                          <ChevronDown size={20} color="#78716C" />
                        )}
                      </View>
                    </View>

                    {/* 展开的进度详情 */}
                    {isExpanded && (
                      <View className="mt-4 pt-4 border-t border-stone-100">
                        {/* 进度项列表 */}
                        <View className="space-y-3">
                          {progressItems.map((item) => {
                            const IconComp = item.icon
                            return (
                              <View
                                key={item.key}
                                className="flex items-center gap-3 active:bg-stone-50 rounded-lg p-2 -m-2"
                                onClick={item.onClick}
                              >
                                <View className={
                                  item.status === 'done'
                                    ? 'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-50'
                                    : 'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-stone-100'
                                }
                                >
                                  <IconComp
                                    size={16}
                                    color={item.status === 'done' ? '#166534' : '#A8A29E'}
                                  />
                                </View>
                                <View className="flex-1 min-w-0">
                                  <Text className="block text-sm font-medium text-stone-800">
                                    {item.label}
                                  </Text>
                                  <Text className="block text-xs text-stone-500">
                                    {item.detail}
                                  </Text>
                                </View>
                                <Badge className={
                                  item.status === 'done'
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-stone-100 text-stone-500'
                                }
                                >
                                  <Text className="text-xs">
                                    {item.status === 'done' ? '已完成' : '待处理'}
                                  </Text>
                                </Badge>
                              </View>
                            )
                          })}
                        </View>

                        {/* 话题完成勾选 */}
                        <View className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                          <View className="flex-1">
                            <Text className="block text-sm font-medium text-stone-800">
                              话题完成
                            </Text>
                            <Text className="block text-xs text-stone-500">
                              勾选标记此话题已完成
                            </Text>
                          </View>
                          <Switch
                            checked={topic.is_completed}
                            onCheckedChange={() => handleToggleComplete(topic)}
                          />
                        </View>
                      </View>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </View>
        )}
      </View>

      {/* 已归档话题 */}
      {archivedTopics.length > 0 && (
        <View className="px-4 mt-6">
          <Text className="block text-sm font-medium text-stone-400 mb-3">
            已归档 ({archivedTopics.length})
          </Text>
          <View className="space-y-2">
            {archivedTopics.map((topic) => (
              <Card key={topic.id} className="border-stone-100 bg-stone-50 opacity-60">
                <CardContent className="p-3 flex items-center gap-3">
                  <View className="flex-1 min-w-0">
                    <Text className="block text-sm text-stone-500 truncate">
                      {topic.name}
                    </Text>
                  </View>
                  <Badge className="bg-stone-100 text-stone-500">
                    <Text className="text-xs">已归档</Text>
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

export default IndexPage
