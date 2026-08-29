import { View, Text } from '@tarojs/components'
import { useState, useCallback, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Network } from '@/network'
import { BookOpen, ChevronDown, CircleCheck, CircleDot, Circle, ArrowRight, Plus } from 'lucide-react-taro'

interface Subtopic {
  id: string
  name: string
  icon: string
  transcript_status: string
  verify_status: string
  auth_level: string
}

interface Topic {
  id: string
  name: string
  description: string | null
  status: string
  subtopic_count: number
  subtopics: Subtopic[]
  has_interview_plan: boolean
  created_at: string
}

// 步骤定义
const STEPS = [
  { key: 'plan', label: '策划' },
  { key: 'transcript', label: '录音' },
  { key: 'verify', label: '核实' },
  { key: 'auth', label: '授权' },
] as const

// 判断子话题各步骤状态
const getSubtopicProgress = (subtopic: Subtopic, hasPlan: boolean) => {
  const planDone = hasPlan
  const transcriptDone = subtopic.transcript_status === 'transcribed'
  const verifyDone = subtopic.verify_status === 'verified'
  const authDone = subtopic.auth_level !== 'not_set'
  
  const allDone = planDone && transcriptDone && verifyDone && authDone
  
  return {
    plan: planDone,
    transcript: transcriptDone,
    verify: verifyDone,
    auth: authDone,
    allDone,
  }
}

// 获取当前步骤索引
const getCurrentStep = (progress: ReturnType<typeof getSubtopicProgress>) => {
  if (progress.allDone) return -1 // 已完成
  if (!progress.plan) return 0
  if (!progress.transcript) return 1
  if (!progress.verify) return 2
  if (!progress.auth) return 3
  return -1
}

const IndexPage = () => {
  const [loading, setLoading] = useState(true)
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<string>('')
  const [showTopicPicker, setShowTopicPicker] = useState(false)
  const [selectedTopicDetail, setSelectedTopicDetail] = useState<Topic | null>(null)

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/topics' })
      console.log('Topics response:', res.data)
      const data = res.data?.data
      if (data && data.length > 0) {
        setTopics(data)
        // 默认选中第一个
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

  // 选中话题后，获取完整话题详情（含子话题列表）
  useEffect(() => {
    if (!selectedTopicId) return
    setSelectedTopicDetail(null) // 切换时先清除旧数据
    let cancelled = false
    const fetchDetail = async () => {
      try {
        const res = await Network.request({ url: `/api/topics/${selectedTopicId}` })
        console.log('Topic detail response:', res.data)
        if (!cancelled) {
          const detail = res.data?.data
          setSelectedTopicDetail(detail || null)
        }
      } catch (err) {
        console.error('获取话题详情失败:', err)
      }
    }
    fetchDetail()
    return () => { cancelled = true }
  }, [selectedTopicId])

  const selectedTopic = selectedTopicDetail || topics.find(t => t.id === selectedTopicId) || null

  const handleSelectTopic = (topicId: string) => {
    setSelectedTopicId(topicId)
    setShowTopicPicker(false)
  }

  const goToTopicDetail = (topicId: string) => {
    Taro.navigateTo({ url: `/pages/topic-detail/index?id=${topicId}` })
  }

  const goToSubtopicDetail = (topicId: string, subtopicId: string) => {
    Taro.navigateTo({ url: `/pages/topic-detail/index?id=${topicId}&subId=${subtopicId}` })
  }

  const goToCreateTopic = () => {
    Taro.navigateTo({ url: '/pages/topics/index?action=create' })
  }

  const goToInterviewPlan = (topicId: string) => {
    Taro.navigateTo({ url: `/pages/interview-plan/index?topicId=${topicId}` })
  }

  const goToInterviewRecord = (topicId: string) => {
    Taro.navigateTo({ url: `/pages/interview-record/index?topicId=${topicId}` })
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-stone-50 px-4 pt-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-24 w-full mb-2" />
        <Skeleton className="h-24 w-full mb-2" />
        <Skeleton className="h-24 w-full" />
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
              <Text className="block text-base font-semibold text-stone-800">
                {selectedTopic?.name || '选择话题'}
              </Text>
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
                  <Text className="block text-sm font-medium text-stone-800">{topic.name}</Text>
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

      {/* 子话题进度列表 */}
      {selectedTopic && (
        <View className="px-4">
          <Text className="block text-base font-semibold text-stone-800 mb-3">子话题进展</Text>
          
          {(selectedTopic.subtopics?.length ?? 0) === 0 ? (
            <Card className="border-stone-100 bg-white">
              <CardContent className="p-6 flex flex-col items-center">
                <Text className="block text-3xl mb-2">🌱</Text>
                <Text className="block text-sm text-stone-500 text-center mb-4">
                  还没有子话题，先去话题详情添加
                </Text>
                <Button
                  variant="outline"
                  className="border-amber-200 text-amber-700"
                  onClick={() => goToTopicDetail(selectedTopic.id)}
                >
                  <Text>前往添加</Text>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <View className="space-y-3">
              {(selectedTopic.subtopics || []).map((subtopic) => {
                const progress = getSubtopicProgress(subtopic, selectedTopic.has_interview_plan ?? false)
                const currentStep = getCurrentStep(progress)
                
                return (
                  <Card
                    key={subtopic.id}
                    className="border-stone-100 shadow-sm"
                    onClick={() => goToSubtopicDetail(selectedTopic.id, subtopic.id)}
                  >
                    <CardContent className="p-4">
                      {/* 子话题标题 */}
                      <View className="flex items-center justify-between mb-3">
                        <View className="flex items-center gap-2 flex-1">
                          <Text className="text-lg">{subtopic.icon}</Text>
                          <Text className="block text-sm font-medium text-stone-800">
                            {subtopic.name}
                          </Text>
                        </View>
                        {progress.allDone ? (
                          <Badge className="bg-green-50 text-green-700 border-green-200">
                            <CircleCheck size={12} color="#166534" className="mr-1" />
                            <Text className="text-xs">已完成</Text>
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                            <Text className="text-xs">进行中</Text>
                          </Badge>
                        )}
                      </View>

                      {/* 步骤条 */}
                      <View className="flex items-center justify-between">
                        {STEPS.map((step, index) => {
                          const isDone = progress[step.key as keyof typeof progress]
                          const isCurrent = currentStep === index
                          
                          return (
                            <View key={step.key} className="flex items-center flex-1">
                              {/* 步骤节点 */}
                              <View className="flex flex-col items-center">
                                {isDone ? (
                                  <CircleCheck size={20} color="#166534" />
                                ) : isCurrent ? (
                                  <CircleDot size={20} color="#B45309" />
                                ) : (
                                  <Circle size={20} color="#D6D3D1" />
                                )}
                                <Text className={`block text-xs mt-1 ${
                                  isDone ? 'text-green-700' : isCurrent ? 'text-amber-700' : 'text-stone-400'
                                }`}
                                >
                                  {step.label}
                                </Text>
                              </View>
                              {/* 连接线 */}
                              {index < STEPS.length - 1 && (
                                <View className={`flex-1 h-1 mx-1 ${
                                  progress[STEPS[index + 1].key as keyof typeof progress] || isDone
                                    ? 'bg-green-300'
                                    : 'bg-stone-200'
                                }`}
                                />
                              )}
                            </View>
                          )
                        })}
                      </View>
                    </CardContent>
                  </Card>
                )
              })}
            </View>
          )}
        </View>
      )}

      {/* 快捷操作 */}
      {selectedTopic && (selectedTopic.subtopics?.length ?? 0) > 0 && (
        <View className="px-4 mt-6">
          <Text className="block text-base font-semibold text-stone-800 mb-3">快捷操作</Text>
          <View className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 border-stone-200 bg-white"
              onClick={() => goToInterviewPlan(selectedTopic.id)}
            >
              <BookOpen size={24} color="#B45309" />
              <Text className="text-xs text-stone-700">
                {selectedTopic.has_interview_plan ? '查看策划' : '准备采访'}
              </Text>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 border-stone-200 bg-white"
              onClick={() => goToInterviewRecord(selectedTopic.id)}
            >
              <BookOpen size={24} color="#4D7C0F" />
              <Text className="text-xs text-stone-700">整理录音</Text>
            </Button>
          </View>
        </View>
      )}

      {/* 查看详情 */}
      {selectedTopic && (
        <View className="px-4 mt-6">
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
