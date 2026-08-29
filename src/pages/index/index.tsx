import { View, Text } from '@tarojs/components'
import { useState, useCallback } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Network } from '@/network'
import { BookOpen, ChevronDown, CircleCheck, CircleDot, ArrowRight, Plus, Archive, Users, Mic, FileText, FilePen } from 'lucide-react-taro'

interface Topic {
  id: string
  name: string
  description: string | null
  status: string
  subtopic_count: number
  has_interview_plan: boolean
  authorized_count: number
  interview_count: number
  organized_count: number
  archived_at: string | null
  created_at: string
}

// 步骤定义
const STEPS = [
  { key: 'plan', label: '采访策划', icon: BookOpen },
  { key: 'auth', label: '授权', icon: Users },
  { key: 'interview', label: '采访', icon: Mic },
  { key: 'organize', label: '整理', icon: FileText },
] as const

// 获取步骤统计文本
const getStepStat = (topic: Topic, stepKey: string): string => {
  switch (stepKey) {
    case 'plan':
      return topic.has_interview_plan ? '已完成' : '未开始'
    case 'auth':
      return `${topic.authorized_count} 人已授权`
    case 'interview':
      return `${topic.interview_count} 个采访`
    case 'organize':
      return `${topic.organized_count} 份已整理`
    default:
      return ''
  }
}

// 判断步骤是否完成
const isStepDone = (topic: Topic, stepKey: string): boolean => {
  switch (stepKey) {
    case 'plan':
      return topic.has_interview_plan
    case 'auth':
      return topic.authorized_count > 0
    case 'interview':
      return topic.interview_count > 0
    case 'organize':
      return topic.organized_count > 0
    default:
      return false
  }
}

// 获取当前步骤索引
const getCurrentStep = (topic: Topic): number => {
  if (!topic.has_interview_plan) return 0
  if (topic.authorized_count === 0) return 1
  if (topic.interview_count === 0) return 2
  if (topic.organized_count === 0) return 3
  return -1 // 全部完成
}

const IndexPage = () => {
  const [loading, setLoading] = useState(true)
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<string>('')
  const [showTopicPicker, setShowTopicPicker] = useState(false)

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/topics' })
      console.log('Topics response:', res.data)
      const data = res.data?.data
      if (data && data.length > 0) {
        setTopics(data)
        if (!selectedTopicId) {
          setSelectedTopicId(data[0].id)
        }
      }
    } catch (err) {
      console.error('获取话题列表失败:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedTopicId])

  useDidShow(() => {
    fetchTopics()
  })

  const selectedTopic = topics.find(t => t.id === selectedTopicId) || null

  const handleSelectTopic = (topicId: string) => {
    setSelectedTopicId(topicId)
    setShowTopicPicker(false)
  }

  const goToTopicDetail = (topicId: string) => {
    Taro.navigateTo({ url: `/pages/topic-detail/index?id=${topicId}` })
  }

  const goToCreateTopic = () => {
    Taro.navigateTo({ url: '/pages/topics/index?action=create' })
  }

  const goToInterviewPlan = (topicId: string) => {
    Taro.navigateTo({ url: `/pages/interview-plan/index?topicId=${topicId}` })
  }

  const goToScript = (topicId: string) => {
    Taro.navigateTo({ url: `/pages/interview-script/index?topicId=${topicId}` })
  }

  const goToAuthorization = (topicId: string) => {
    Taro.navigateTo({ url: `/pages/authorization/index?topicId=${topicId}` })
  }

  const goToInterviewRecord = (topicId: string) => {
    Taro.navigateTo({ url: `/pages/interview-record/index?topicId=${topicId}` })
  }

  const handleArchive = async () => {
    if (!selectedTopic) return
    const modal = await Taro.showModal({
      title: '完结本次调研',
      content: `确定要将「${selectedTopic.name}」归档吗？归档后可以随时参考本次调研的材料。`,
    })
    if (!modal.confirm) return

    try {
      const res = await Network.request({
        url: `/api/topics/${selectedTopic.id}/archive`,
        method: 'POST',
      })
      console.log('Archive response:', res.data)
      if (res.data?.code === 200) {
        Taro.showToast({ title: '已归档', icon: 'success' })
        fetchTopics()
      }
    } catch (err) {
      console.error('归档失败:', err)
      Taro.showToast({ title: '归档失败', icon: 'none' })
    }
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-stone-50 px-4 pt-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-48 w-full mb-2" />
      </View>
    )
  }

  if (topics.length === 0) {
    return (
      <View className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6">
        <View className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6">
          <BookOpen size={40} color="#B45309" />
        </View>
        <Text className="block text-xl font-bold text-stone-800 mb-2 text-center">
          开始记录村庄记忆
        </Text>
        <Text className="block text-sm text-stone-500 mb-8 text-center">
          创建一个话题，开始你的第一次采访之旅
        </Text>
        <Button onClick={goToCreateTopic} className="bg-amber-700 hover:bg-amber-800 text-white">
          <Plus size={18} color="#B45309" className="mr-2" />
          <Text>创建第一个话题</Text>
        </Button>
      </View>
    )
  }

  const currentStep = selectedTopic ? getCurrentStep(selectedTopic) : -1
  const isArchived = selectedTopic?.status === 'archived'

  return (
    <View className="min-h-screen bg-stone-50 pb-20">
      {/* 头部 */}
      <View className="px-4 pt-6 pb-4">
        <Text className="block text-xl font-bold text-stone-800 mb-1">进度看板</Text>
        <Text className="block text-sm text-stone-500">查看每个话题的进展情况</Text>
      </View>

      {/* 话题选择器 */}
      <View className="px-4 mb-4">
        <Card 
          className="border-stone-200 shadow-sm"
          onClick={() => setShowTopicPicker(true)}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <View className="flex-1">
              <Text className="block text-xs text-stone-400 mb-1">当前话题</Text>
              <View className="flex items-center gap-2">
                <Text className="block text-base font-semibold text-stone-800">
                  {selectedTopic?.name || '选择话题'}
                </Text>
                {isArchived && (
                  <Badge className="bg-stone-100 text-stone-600 border-stone-200">
                    <Archive size={10} color="#78716C" className="mr-1" />
                    <Text className="text-xs">已归档</Text>
                  </Badge>
                )}
              </View>
              {selectedTopic && (
                <Text className="block text-xs text-stone-500 mt-1">
                  {selectedTopic.subtopic_count} 个子话题
                </Text>
              )}
            </View>
            <ChevronDown size={24} color="#78716C" />
          </CardContent>
        </Card>
      </View>

      {/* 话题选择弹窗 */}
      {showTopicPicker && (
        <View 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
          onClick={() => setShowTopicPicker(false)}
        >
          <View 
            className="w-full bg-white rounded-t-2xl max-h-96 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <View className="p-4 border-b border-stone-100">
              <Text className="block text-base font-semibold text-stone-800 text-center">选择话题</Text>
            </View>
            <View className="overflow-y-auto max-h-72">
              {topics.map((topic) => (
                <View
                  key={topic.id}
                  className={`px-4 py-3 border-b border-stone-50 ${
                    topic.id === selectedTopicId ? 'bg-amber-50' : ''
                  }`}
                  onClick={() => handleSelectTopic(topic.id)}
                >
                  <View className="flex items-center gap-2">
                    <Text className="block text-sm font-medium text-stone-800 flex-1">{topic.name}</Text>
                    {topic.status === 'archived' && (
                      <Badge className="bg-stone-100 text-stone-500 border-stone-200">
                        <Text className="text-xs">已归档</Text>
                      </Badge>
                    )}
                  </View>
                  <Text className="block text-xs text-stone-500 mt-1">
                    {topic.subtopic_count} 个子话题
                  </Text>
                </View>
              ))}
            </View>
            <View className="p-4 border-t border-stone-100">
              <Button
                variant="outline"
                className="w-full border-stone-200"
                onClick={() => setShowTopicPicker(false)}
              >
                <Text>取消</Text>
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* 进度步骤条 */}
      {selectedTopic && (
        <View className="px-4 mb-4">
          <Card className="border-stone-100 shadow-sm">
            <CardContent className="p-4">
              <Text className="block text-base font-semibold text-stone-800 mb-4">调研进度</Text>
              
              {/* 步骤条 */}
              <View className="flex items-center justify-between mb-4">
                {STEPS.map((step, index) => {
                  const isDone = isStepDone(selectedTopic, step.key)
                  const isCurrent = currentStep === index
                  const IconComponent = step.icon
                  
                  return (
                    <View key={step.key} className="flex items-center flex-1">
                      {/* 步骤节点 */}
                      <View className="flex flex-col items-center flex-1">
                        <View className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                          isDone ? 'bg-green-100' : isCurrent ? 'bg-amber-100' : 'bg-stone-100'
                        }`}
                        >
                          {isDone ? (
                            <CircleCheck size={24} color="#166534" />
                          ) : isCurrent ? (
                            <CircleDot size={24} color="#B45309" />
                          ) : (
                            <IconComponent size={20} color="#A8A29E" />
                          )}
                        </View>
                        <Text className={`block text-xs font-medium ${
                          isDone ? 'text-green-700' : isCurrent ? 'text-amber-700' : 'text-stone-400'
                        }`}
                        >
                          {step.label}
                        </Text>
                        <Text className="block text-xs text-stone-500 mt-1 text-center">
                          {getStepStat(selectedTopic, step.key)}
                        </Text>
                      </View>
                      {/* 连接线 */}
                      {index < STEPS.length - 1 && (
                        <View className={`flex-1 h-1 mx-1 mt-[-24px] ${
                          isStepDone(selectedTopic, STEPS[index + 1].key) || isDone
                            ? 'bg-green-300'
                            : 'bg-stone-200'
                        }`}
                        />
                      )}
                    </View>
                  )
                })}
              </View>

              {/* 快捷操作按钮 */}
              <View className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-stone-100">
                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-1 h-auto py-2"
                  onClick={() => goToInterviewPlan(selectedTopic.id)}
                >
                  <BookOpen size={18} color="#B45309" />
                  <Text className="text-xs text-stone-600">采访策划</Text>
                </Button>
                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-1 h-auto py-2"
                  onClick={() => goToScript(selectedTopic.id)}
                >
                  <FilePen size={18} color="#B45309" />
                  <Text className="text-xs text-stone-600">采访稿</Text>
                </Button>
                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-1 h-auto py-2"
                  onClick={() => goToAuthorization(selectedTopic.id)}
                >
                  <Users size={18} color="#B45309" />
                  <Text className="text-xs text-stone-600">授权</Text>
                </Button>
                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-1 h-auto py-2"
                  onClick={() => goToInterviewRecord(selectedTopic.id)}
                >
                  <Mic size={18} color="#B45309" />
                  <Text className="text-xs text-stone-600">采后整理</Text>
                </Button>
              </View>
            </CardContent>
          </Card>
        </View>
      )}

      {/* 归档按钮 */}
      {selectedTopic && !isArchived && currentStep === -1 && (
        <View className="px-4 mb-4">
          <Card className="border-green-200 bg-green-50 shadow-sm">
            <CardContent className="p-4">
              <View className="flex items-center justify-between">
                <View className="flex-1">
                  <Text className="block text-sm font-medium text-green-800 mb-1">
                    调研已完成
                  </Text>
                  <Text className="block text-xs text-green-600">
                    所有步骤已完成，可以归档本次调研
                  </Text>
                </View>
                <Button
                  className="bg-green-700 hover:bg-green-800 text-white"
                  onClick={handleArchive}
                >
                  <Archive size={16} color="#ffffff" className="mr-1" />
                  <Text>归档</Text>
                </Button>
              </View>
            </CardContent>
          </Card>
        </View>
      )}

      {/* 查看详情 */}
      {selectedTopic && (
        <View className="px-4">
          <Button
            variant="ghost"
            className="w-full text-amber-700"
            onClick={() => goToTopicDetail(selectedTopic.id)}
          >
            <Text>查看话题详情</Text>
            <ArrowRight size={16} color="#B45309" className="ml-1" />
          </Button>
        </View>
      )}
    </View>
  )
}

export default IndexPage
