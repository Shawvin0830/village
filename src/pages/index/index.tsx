import { View, Text } from '@tarojs/components'
import { useState, useCallback } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Network } from '@/network'
import { BookOpen, Mic, ShieldCheck, ArrowRight, Plus } from 'lucide-react-taro'

interface Subtopic {
  id: string
  name: string
  icon: string
  transcript_status: string
  verify_status: string
  auth_level: string
  summary: string | null
}

interface Topic {
  id: string
  name: string
  description: string | null
  status: string
  subtopics: Subtopic[]
  created_at: string
}

interface DashboardData {
  topic: Topic | null
  nextSteps: string[]
}

const AUTH_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  not_set: { label: '未授权', icon: '❓', color: 'bg-stone-100 text-stone-500' },
  archived: { label: '仅存档', icon: '🔒', color: 'bg-stone-100 text-stone-600' },
  village: { label: '村内可见', icon: '🔓', color: 'bg-blue-50 text-blue-700' },
  public: { label: '可对外分享', icon: '📢', color: 'bg-amber-50 text-amber-700' },
}

const TRANSCRIPT_LABELS: Record<string, { label: string; color: string }> = {
  not_started: { label: '未转录', color: 'bg-stone-100 text-stone-500' },
  transcribed: { label: '已转录', color: 'bg-green-50 text-green-700' },
}

const VERIFY_LABELS: Record<string, { label: string; color: string }> = {
  not_started: { label: '未核实', color: 'bg-stone-100 text-stone-500' },
  pending: { label: '待核实', color: 'bg-red-50 text-red-600' },
  verified: { label: '已核实', color: 'bg-green-50 text-green-700' },
  disputed: { label: '有争议', color: 'bg-amber-50 text-amber-700' },
}

const IndexPage = () => {
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState<DashboardData>({ topic: null, nextSteps: [] })

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/topics/dashboard' })
      console.log('Dashboard response:', res.data)
      const data = res.data?.data
      if (data) {
        setDashboard(data)
      }
    } catch (err) {
      console.error('获取进度看板失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    fetchDashboard()
  })

  const goToTopicDetail = (topicId: string) => {
    Taro.navigateTo({ url: `/pages/topic-detail/index?id=${topicId}` })
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

  const goToAuthorization = (topicId: string) => {
    Taro.navigateTo({ url: `/pages/authorization/index?topicId=${topicId}` })
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-stone-50 px-4 pt-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-24 w-full mb-2" />
        <Skeleton className="h-24 w-full mb-2" />
        <Skeleton className="h-24 w-full" />
      </View>
    )
  }

  const { topic, nextSteps } = dashboard

  if (!topic) {
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
        <Text className="block text-sm text-stone-500">当前话题的进展情况</Text>
      </View>

      {/* 话题卡片 */}
      <View className="px-4 mb-4">
        <Card className="border-stone-100 shadow-sm">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <Text className="block text-lg font-semibold text-stone-800 flex-1">
                {topic.name}
              </Text>
              <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                <Text className="text-xs">{topic.subtopics.length} 个子话题</Text>
              </Badge>
            </View>
            {topic.description && (
              <Text className="block text-sm text-stone-500 mb-3">{topic.description}</Text>
            )}

            {/* 子话题状态列表 */}
            <View className="space-y-2">
              {topic.subtopics.map((sub) => {
                const authInfo = AUTH_LABELS[sub.auth_level] || AUTH_LABELS.not_set
                const transcriptInfo = TRANSCRIPT_LABELS[sub.transcript_status] || TRANSCRIPT_LABELS.not_started
                const verifyInfo = VERIFY_LABELS[sub.verify_status] || VERIFY_LABELS.not_started
                return (
                  <View
                    key={sub.id}
                    className="flex items-center gap-2 py-2 border-b border-stone-50 last:border-0"
                  >
                    <Text className="text-base">{sub.icon}</Text>
                    <Text className="block text-sm text-stone-700 flex-1">{sub.name}</Text>
                    <View className="flex gap-1">
                      <Badge className={`text-xs ${transcriptInfo.color}`}>
                        <Text className="text-xs">{transcriptInfo.label}</Text>
                      </Badge>
                      <Badge className={`text-xs ${verifyInfo.color}`}>
                        <Text className="text-xs">{verifyInfo.label}</Text>
                      </Badge>
                      <Badge className={`text-xs ${authInfo.color}`}>
                        <Text className="text-xs">{authInfo.icon}</Text>
                      </Badge>
                    </View>
                  </View>
                )
              })}
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 快捷操作 */}
      <View className="px-4 mb-4">
        <Text className="block text-base font-semibold text-stone-800 mb-3">快捷操作</Text>
        <View className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 border-stone-200 bg-white"
            onClick={() => goToInterviewPlan(topic.id)}
          >
            <BookOpen size={24} color="#B45309" />
            <Text className="text-xs text-stone-700">准备采访</Text>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 border-stone-200 bg-white"
            onClick={() => goToInterviewRecord(topic.id)}
          >
            <Mic size={24} color="#4D7C0F" />
            <Text className="text-xs text-stone-700">整理录音</Text>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 border-stone-200 bg-white"
            onClick={() => goToAuthorization(topic.id)}
          >
            <ShieldCheck size={24} color="#166534" />
            <Text className="text-xs text-stone-700">确认授权</Text>
          </Button>
        </View>
      </View>

      {/* 下一步建议 */}
      {nextSteps.length > 0 && (
        <View className="px-4 mb-4">
          <Text className="block text-base font-semibold text-stone-800 mb-3">下一步建议</Text>
          <Card className="border-amber-100 bg-amber-50 shadow-sm">
            <CardContent className="p-4">
              {nextSteps.map((step, i) => (
                <View key={i} className="flex items-start gap-2 mb-2 last:mb-0">
                  <ArrowRight size={16} color="#B45309" className="mt-1 flex-shrink-0" />
                  <Text className="block text-sm text-stone-700">{step}</Text>
                </View>
              ))}
            </CardContent>
          </Card>
        </View>
      )}

      {/* 查看详情 */}
      <View className="px-4">
        <Button
          variant="ghost"
          className="w-full text-amber-700"
          onClick={() => goToTopicDetail(topic.id)}
        >
          <Text>查看话题详情</Text>
          <ArrowRight size={16} color="#B45309" className="ml-1" />
        </Button>
      </View>
    </View>
  )
}

export default IndexPage
