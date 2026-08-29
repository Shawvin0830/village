import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Network } from '@/network'
import { BookOpen, Lightbulb, RefreshCw } from 'lucide-react-taro'

interface InterviewPlan {
  id: string
  context_summary: string | null
  adult_questions: string[] | null
  child_questions: string[] | null
  tips: string[] | null
}

const InterviewPlanPage = () => {
  const router = useRouter()
  const topicId = router.params.topicId || ''

  const [plan, setPlan] = useState<InterviewPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!topicId) return
    try {
      setGenerating(true)
      setLoading(true)
      const res = await Network.request({
        url: '/api/interview-plans/generate',
        method: 'POST',
        data: { topic_id: topicId },
      })
      console.log('Generate plan response:', res.data)
      const data = res.data?.data
      if (data) {
        setPlan(data)
      }
    } catch (err) {
      console.error('生成采访策划失败:', err)
      Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
    } finally {
      setGenerating(false)
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen bg-stone-50 pb-8">
      {/* 头部 */}
      <View className="px-4 pt-6 pb-4">
        <View className="flex items-center gap-2 mb-2">
          <BookOpen size={24} color="#B45309" />
          <Text className="block text-xl font-bold text-stone-800">采访策划</Text>
        </View>
        <Text className="block text-sm text-stone-500">
          AI 帮你生成采访问题清单和追问锦囊
        </Text>
      </View>

      {/* 生成按钮 */}
      {!plan && !loading && (
        <View className="px-4 mb-6">
          <Card className="border-stone-100 bg-white">
            <CardContent className="p-6 flex flex-col items-center">
              <Text className="block text-4xl mb-4">📋</Text>
              <Text className="block text-base text-stone-700 mb-2 text-center">
                准备好采访问题
              </Text>
              <Text className="block text-sm text-stone-500 mb-6 text-center">
                AI 会根据话题背景，生成大人版和孩子版的采访问题
              </Text>
              <Button
                className="bg-amber-700 hover:bg-amber-800 text-white"
                onClick={handleGenerate}
                disabled={generating}
              >
                <Text>{generating ? 'AI 正在思考...' : '生成采访问题'}</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      )}

      {/* 加载中 */}
      {loading && (
        <View className="px-4">
          <View className="flex flex-col items-center py-8">
            <Text className="block text-4xl mb-4">🤔</Text>
            <Text className="block text-base text-stone-700 mb-2">AI 正在思考中...</Text>
            <Text className="block text-sm text-stone-500 mb-6">正在分析话题背景，生成问题清单</Text>
            <Skeleton className="h-4 w-64 mb-2" />
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-56" />
          </View>
        </View>
      )}

      {/* 策划结果 */}
      {plan && (
        <View className="px-4 space-y-4">
          {/* 语境摘要 */}
          {plan.context_summary && (
            <Card className="border-stone-100 bg-white">
              <CardContent className="p-4">
                <Text className="block text-base font-semibold text-stone-800 mb-3">
                  📚 语境摘要
                </Text>
                <Text className="block text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
                  {plan.context_summary}
                </Text>
              </CardContent>
            </Card>
          )}

          {/* 大人版问题 */}
          {plan.adult_questions && plan.adult_questions.length > 0 && (
            <Card className="border-stone-100 bg-white">
              <CardContent className="p-4">
                <Text className="block text-base font-semibold text-stone-800 mb-3">
                  🧑 大人备用版
                </Text>
                <Text className="block text-xs text-stone-400 mb-3">
                  心里有数就行，不需要直接问
                </Text>
                <View className="space-y-2">
                  {plan.adult_questions.map((q, i) => (
                    <View key={i} className="flex items-start gap-2">
                      <Text className="block text-sm font-medium text-amber-700 mt-1 flex-shrink-0">
                        {i + 1}.
                      </Text>
                      <Text className="block text-sm text-stone-700">{q}</Text>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          )}

          {/* 孩子版问题 */}
          {plan.child_questions && plan.child_questions.length > 0 && (
            <Card className="border-lime-100 bg-lime-50">
              <CardContent className="p-4">
                <Text className="block text-base font-semibold text-stone-800 mb-3">
                  👧 小孩执行版
                </Text>
                <Text className="block text-xs text-stone-400 mb-3">
                  直接问就行，简单口语化
                </Text>
                <View className="space-y-2">
                  {plan.child_questions.map((q, i) => (
                    <View key={i} className="flex items-start gap-2">
                      <Text className="block text-sm font-medium text-lime-800 mt-1 flex-shrink-0">
                        {i + 1}.
                      </Text>
                      <Text className="block text-sm text-stone-700">{q}</Text>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          )}

          {/* 追问锦囊 */}
          {plan.tips && plan.tips.length > 0 && (
            <Card className="border-amber-100 bg-amber-50">
              <CardContent className="p-4">
                <View className="flex items-center gap-2 mb-3">
                  <Lightbulb size={18} color="#B45309" />
                  <Text className="block text-base font-semibold text-stone-800">
                    追问锦囊
                  </Text>
                </View>
                <View className="space-y-2">
                  {plan.tips.map((tip, i) => (
                    <View key={i} className="flex items-start gap-2">
                      <Text className="text-sm">💡</Text>
                      <Text className="block text-sm text-stone-700">{tip}</Text>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          )}

          {/* 重新生成 */}
          <View className="pt-2">
            <Button
              variant="outline"
              className="w-full border-stone-200 text-stone-600"
              onClick={handleGenerate}
              disabled={generating}
            >
              <RefreshCw size={16} color="#B45309" className="mr-2" />
              <Text>{generating ? '重新生成中...' : '重新生成'}</Text>
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}

export default InterviewPlanPage
