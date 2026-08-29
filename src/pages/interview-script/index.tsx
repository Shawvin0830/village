import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Network } from '@/network'
import { ClipboardList, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react-taro'

interface InterviewScript {
  id: string
  topic_id: string
  plan_id: string | null
  title: string | null
  selected_questions: Array<{
    question: string
    intent?: string
    follow_up?: string[]
    dimension?: string
  }>
  warmup_questions: Array<{
    question: string
    intent?: string
  }>
  closing_questions: Array<{
    question: string
    intent?: string
  }>
  status: string
  created_at: string
  updated_at: string
}

export default function InterviewScriptPage() {
  const router = useRouter()
  const topicId = router.params.topicId || ''

  const [script, setScript] = useState<InterviewScript | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (topicId) {
      loadLatestScript()
    }
  }, [topicId])

  const loadLatestScript = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/interview-scripts/topic/${topicId}/latest`,
        method: 'GET'
      })
      console.log('Load latest script response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        setScript(res.data.data)
      } else {
        setScript(null)
      }
    } catch (error) {
      console.error('Load latest script error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleQuestion = (index: number) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedQuestions(newExpanded)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}月${day}日 ${hours}:${minutes}`
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-stone-50">
        <View className="px-4 py-4">
          <Skeleton className="h-20 w-full rounded-xl mb-4" />
          <Skeleton className="h-40 w-full rounded-xl mb-4" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </View>
      </View>
    )
  }

  if (!script) {
    return (
      <View className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-8">
        <View className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
          <ClipboardList size={32} color="#a8a29e" />
        </View>
        <Text className="block text-lg font-semibold text-stone-700 mb-2">暂无采访稿</Text>
        <Text className="block text-sm text-stone-500 text-center mb-6">
          请先在「采访策划」页面选择问题并确认保存
        </Text>
        <Button
          variant="outline"
          className="border-amber-700 text-amber-700"
          onClick={() => Taro.navigateBack()}
        >
          <Text className="text-sm">返回</Text>
        </Button>
      </View>
    )
  }

  const selectedQuestions = script.selected_questions || []
  const warmupQuestions = script.warmup_questions || []
  const closingQuestions = script.closing_questions || []

  return (
    <View className="min-h-screen bg-stone-50 pb-8">
      <ScrollView scrollY className="h-full">
        <View className="px-4 py-4">
          {/* 采访稿信息 */}
          <Card className="border-amber-200 bg-amber-50 shadow-sm mb-4">
            <CardContent className="p-4">
              <View className="flex items-center gap-3 mb-3">
                <View className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <ClipboardList size={20} color="#B45309" />
                </View>
                <View className="flex-1">
                  <Text className="block text-base font-semibold text-stone-800">
                    {script.title || '采访稿'}
                  </Text>
                  <Text className="block text-xs text-stone-500">
                    更新于 {formatDate(script.updated_at)}
                  </Text>
                </View>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadLatestScript}
                >
                  <RefreshCw size={16} color="#78716c" />
                </Button>
              </View>
              <View className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  核心问题 {selectedQuestions.length}
                </Badge>
                {warmupQuestions.length > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    暖场 {warmupQuestions.length}
                  </Badge>
                )}
                {closingQuestions.length > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    收尾 {closingQuestions.length}
                  </Badge>
                )}
              </View>
            </CardContent>
          </Card>

          {/* 暖场问题 */}
          {warmupQuestions.length > 0 && (
            <Card className="border-green-200 bg-green-50 shadow-sm mb-4">
              <CardContent className="p-4">
                <Text className="block text-sm font-semibold text-green-800 mb-3">
                  暖场问题
                </Text>
                {warmupQuestions.map((q, index) => (
                  <View key={`warmup-${index}`} className="mb-2 last:mb-0">
                    <Text className="block text-sm text-stone-700">
                      {index + 1}. {q.question}
                    </Text>
                  </View>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 核心问题 */}
          {selectedQuestions.length > 0 && (
            <Card className="border-stone-200 bg-white shadow-sm mb-4">
              <CardContent className="p-4">
                <Text className="block text-sm font-semibold text-stone-800 mb-3">
                  核心问题
                </Text>
                {selectedQuestions.map((q, index) => (
                  <View key={`core-${index}`} className="mb-3 last:mb-0">
                    <View
                      className="flex items-start gap-2"
                      onClick={() => toggleQuestion(index)}
                    >
                      <Text className="block text-sm font-medium text-stone-800 flex-1">
                        {index + 1}. {q.question}
                      </Text>
                      {(q.intent || (q.follow_up && q.follow_up.length > 0)) && (
                        expandedQuestions.has(index) ? (
                          <ChevronUp size={16} color="#78716c" />
                        ) : (
                          <ChevronDown size={16} color="#78716c" />
                        )
                      )}
                    </View>
                    {expandedQuestions.has(index) && (
                      <View className="mt-2 ml-5">
                        {q.intent && (
                          <View className="mb-2">
                            <Text className="block text-xs font-medium text-stone-500 mb-1">
                              意图
                            </Text>
                            <Text className="block text-xs text-stone-600">
                              {q.intent}
                            </Text>
                          </View>
                        )}
                        {q.follow_up && q.follow_up.length > 0 && (
                          <View>
                            <Text className="block text-xs font-medium text-stone-500 mb-1">
                              追问
                            </Text>
                            {q.follow_up.map((followUp, fi) => (
                              <Text key={fi} className="block text-xs text-stone-600 mb-1">
                                • {followUp}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 收尾问题 */}
          {closingQuestions.length > 0 && (
            <Card className="border-blue-200 bg-blue-50 shadow-sm mb-4">
              <CardContent className="p-4">
                <Text className="block text-sm font-semibold text-blue-800 mb-3">
                  收尾问题
                </Text>
                {closingQuestions.map((q, index) => (
                  <View key={`closing-${index}`} className="mb-2 last:mb-0">
                    <Text className="block text-sm text-stone-700">
                      {index + 1}. {q.question}
                    </Text>
                  </View>
                ))}
              </CardContent>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
