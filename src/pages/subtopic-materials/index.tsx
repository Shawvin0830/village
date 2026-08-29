import { View, Text } from '@tarojs/components'
import { useState, useCallback } from 'react'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Network } from '@/network'
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  FileText,
  Quote,
  ShieldCheck,
  UserRound,
} from 'lucide-react-taro'

interface TopicAffiliation {
  primary: string
  secondary: string
}

interface IntervieweeProfile {
  id: string
  name: string
  age?: string | null
  occupation?: string | null
  role?: string | null
  auth_status?: string | null
  auth_note?: string | null
  topic_affiliations?: TopicAffiliation[]
  confirmed_at?: string | null
}

interface QuoteItem {
  id: string
  quote: string
  summary: string
  full_interview: string
  created_by_name?: string | null
  updated_by_name?: string | null
  created_at?: string | null
  interviewee: IntervieweeProfile
}

interface ReferenceItem {
  id: string
  title: string
  source?: string | null
  url?: string | null
  tags?: string[]
  summary: string
  content: string
  created_by_name?: string | null
  updated_by_name?: string | null
  created_at?: string | null
}

interface SubtopicMaterialsData {
  topic_id: string
  topic_name: string
  subtopic: {
    id: string
    name: string
    icon?: string | null
    summary?: string | null
    transcript_status?: string | null
    verify_status?: string | null
  }
  quotes: QuoteItem[]
  references: ReferenceItem[]
}

const AUTH_LABELS: Record<string, { label: string; color: string }> = {
  unset: { label: '未设置', color: 'bg-stone-100 text-stone-600' },
  agreed: { label: '同意', color: 'bg-green-50 text-green-700' },
  declined: { label: '不同意', color: 'bg-red-50 text-red-600' },
}

const authInfo = (status?: string | null) => AUTH_LABELS[status || 'unset'] || AUTH_LABELS.unset

const compactDate = (value?: string | null) => {
  if (!value) return '时间待补充'
  return new Date(value).toLocaleDateString('zh-CN')
}

const formatProfileLine = (person: IntervieweeProfile) =>
  [person.age ? `${person.age}岁` : '', person.occupation || '', person.role || '']
    .filter(Boolean)
    .join(' / ') || '年龄、职业、身份待补充'

const affiliationText = (items?: TopicAffiliation[]) => {
  if (!items || items.length === 0) return '话题归属待标注'
  return items.map((item) => `${item.primary}-${item.secondary}`).join('、')
}

const normalizeTags = (tags?: string[]) => {
  if (!Array.isArray(tags)) return []
  return tags.map((item) => String(item)).filter(Boolean)
}

const SubtopicMaterialsPage = () => {
  const router = useRouter()
  const topicId = router.params.topicId || ''
  const subtopicId = router.params.subtopicId || ''

  const [data, setData] = useState<SubtopicMaterialsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedQuote, setSelectedQuote] = useState<QuoteItem | null>(null)

  const fetchMaterials = useCallback(async () => {
    if (!topicId || !subtopicId) return
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/topics/${topicId}/subtopics/${subtopicId}/materials`,
      })
      const nextData = res.data?.data
      if (nextData) setData(nextData)
    } catch (err) {
      console.error('获取子话题材料失败:', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [topicId, subtopicId])

  useLoad(() => {
    fetchMaterials()
  })

  if (loading) {
    return (
      <View className="min-h-screen bg-stone-50 px-4 pt-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-28 w-full mb-3" />
        <Skeleton className="h-28 w-full mb-3" />
        <Skeleton className="h-20 w-full" />
      </View>
    )
  }

  if (!data) {
    return (
      <View className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <Text className="block text-sm text-stone-500 text-center">
          没有找到这个子话题的材料
        </Text>
      </View>
    )
  }

  const renderProfile = (quote: QuoteItem) => {
    const person = quote.interviewee
    const status = authInfo(person.auth_status)

    return (
      <View className="min-h-screen bg-stone-50 pb-8">
        <View className="px-4 pt-6 pb-4">
          <Button
            size="sm"
            variant="ghost"
            className="mb-3"
            onClick={() => setSelectedQuote(null)}
          >
            <ArrowLeft size={16} color="#57534E" className="mr-1" />
            <Text>返回摘录</Text>
          </Button>
          <Text className="block text-xl font-bold text-stone-800">受访人档案</Text>
          <Text className="block text-sm text-stone-500 mt-1">
            {data.topic_name} / {data.subtopic.name}
          </Text>
        </View>

        <View className="px-4 space-y-3">
          <Card className="border-stone-100 bg-white">
            <CardContent className="p-4">
              <View className="flex items-start justify-between mb-3">
                <View className="flex items-center flex-1">
                  <View className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center mr-3">
                    <UserRound size={22} color="#92400E" />
                  </View>
                  <View className="flex-1">
                    <Text className="block text-base font-semibold text-stone-800">
                      {person.name}
                    </Text>
                    <Text className="block text-xs text-stone-500 mt-1">
                      {formatProfileLine(person)}
                    </Text>
                  </View>
                </View>
                <Badge className={status.color}>
                  <Text className="text-xs">{status.label}</Text>
                </Badge>
              </View>

              <View className="bg-stone-50 rounded-lg p-3 mb-3">
                <Text className="block text-xs text-stone-500 mb-1">话题归属</Text>
                <Text className="block text-sm text-stone-700 leading-relaxed">
                  {affiliationText(person.topic_affiliations)}
                </Text>
              </View>

              <View className="bg-stone-50 rounded-lg p-3">
                <View className="flex items-center mb-1">
                  <ShieldCheck size={14} color="#166534" className="mr-1" />
                  <Text className="text-xs text-stone-500">授权备注</Text>
                </View>
                <Text className="block text-sm text-stone-700 leading-relaxed">
                  {person.auth_note || '暂无特殊要求'}
                </Text>
              </View>
            </CardContent>
          </Card>

          <Card className="border-stone-100 bg-white">
            <CardContent className="p-4">
              <View className="flex items-center mb-3">
                <Quote size={18} color="#B45309" className="mr-2" />
                <Text className="block text-base font-semibold text-stone-800">
                  这段里他说了什么
                </Text>
              </View>
              <View className="bg-amber-50 rounded-lg p-4 border border-amber-100 mb-3">
                <Text className="block text-sm text-amber-900 leading-relaxed">
                  “{quote.quote}”
                </Text>
              </View>
              <Text className="block text-xs text-stone-500">
                来源：采访整理文档 / {compactDate(quote.created_at)}
              </Text>
              <Text className="block text-xs text-stone-400 mt-1">
                整理人：{quote.updated_by_name || quote.created_by_name || '待补充'}
              </Text>
            </CardContent>
          </Card>

          <Card className="border-stone-100 bg-white">
            <CardContent className="p-4">
              <View className="flex items-center mb-3">
                <FileText size={18} color="#57534E" className="mr-2" />
                <Text className="block text-base font-semibold text-stone-800">
                  完整采访内容
                </Text>
              </View>
              <Text className="block text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                {quote.full_interview}
              </Text>
            </CardContent>
          </Card>
        </View>
      </View>
    )
  }

  if (selectedQuote) {
    return renderProfile(selectedQuote)
  }

  return (
    <View className="min-h-screen bg-stone-50 pb-8">
      <View className="px-4 pt-6 pb-4">
        <Text className="block text-xl font-bold text-stone-800">
          {data.subtopic.icon || '📌'} {data.subtopic.name}
        </Text>
        <Text className="block text-sm text-stone-500 mt-1">
          {data.topic_name}
        </Text>
        {data.subtopic.summary && (
          <Text className="block text-sm text-stone-600 leading-relaxed mt-3">
            {data.subtopic.summary}
          </Text>
        )}
      </View>

      <View className="px-4 mb-4">
        <View className="grid grid-cols-2 gap-3">
          <Card className="border-stone-100 bg-white">
            <CardContent className="p-3">
              <Text className="block text-lg font-bold text-stone-800">{data.quotes.length}</Text>
              <Text className="block text-xs text-stone-500">历史采访摘录</Text>
            </CardContent>
          </Card>
          <Card className="border-stone-100 bg-white">
            <CardContent className="p-3">
              <Text className="block text-lg font-bold text-stone-800">{data.references.length}</Text>
              <Text className="block text-xs text-stone-500">外部文献</Text>
            </CardContent>
          </Card>
        </View>
      </View>

      <View className="px-4 mb-5">
        <View className="flex items-center mb-3">
          <FileText size={18} color="#92400E" className="mr-2" />
          <Text className="block text-base font-semibold text-stone-800">
            谁讲过这段
          </Text>
        </View>

        {data.quotes.length === 0 ? (
          <Card className="border-stone-100 bg-white">
            <CardContent className="p-6">
              <Text className="block text-sm text-stone-500 text-center">
                还没有关联到这个子话题的历史采访
              </Text>
            </CardContent>
          </Card>
        ) : (
          <View className="space-y-3">
            {data.quotes.map((item) => {
              const status = authInfo(item.interviewee.auth_status)
              return (
                <Card
                  key={item.id}
                  className="border-stone-100 bg-white shadow-sm"
                  onClick={() => setSelectedQuote(item)}
                >
                  <CardContent className="p-4">
                    <View className="flex items-start justify-between mb-3">
                      <View className="flex items-center flex-1">
                        <View className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mr-3">
                          <UserRound size={20} color="#92400E" />
                        </View>
                        <View className="flex-1">
                          <Text className="block text-sm font-semibold text-stone-800">
                            {item.interviewee.name}
                          </Text>
                          <Text className="block text-xs text-stone-500 mt-1">
                            {formatProfileLine(item.interviewee)}
                          </Text>
                        </View>
                      </View>
                      <Badge className={status.color}>
                        <Text className="text-xs">{status.label}</Text>
                      </Badge>
                    </View>

                    <View className="bg-amber-50 rounded-lg p-3 border border-amber-100 mb-3">
                      <Text className="block text-sm text-amber-900 leading-relaxed">
                        “{item.quote}”
                      </Text>
                    </View>

                    <View className="flex items-center justify-between">
                      <Text className="text-xs text-stone-500">
                        整理人：{item.updated_by_name || item.created_by_name || '待补充'}
                      </Text>
                      <View className="flex items-center ml-2">
                        <Text className="text-xs text-amber-700">查看档案</Text>
                        <ChevronRight size={14} color="#B45309" />
                      </View>
                    </View>
                    <Text className="block text-xs text-stone-500 mt-2 line-clamp-2">
                      {item.summary || '摘要待补充'}
                    </Text>
                  </CardContent>
                </Card>
              )
            })}
          </View>
        )}
      </View>

      <View className="px-4">
        <View className="flex items-center mb-3">
          <BookOpen size={18} color="#1D4ED8" className="mr-2" />
          <Text className="block text-base font-semibold text-stone-800">
            外部文献
          </Text>
        </View>

        {data.references.length === 0 ? (
          <Card className="border-stone-100 bg-white">
            <CardContent className="p-6">
              <Text className="block text-sm text-stone-500 text-center">
                还没有关联到这个子话题的外部文献
              </Text>
            </CardContent>
          </Card>
        ) : (
          <View className="space-y-3">
            {data.references.map((item) => {
              const tags = normalizeTags(item.tags)
              return (
                <Card key={item.id} className="border-stone-100 bg-white">
                  <CardContent className="p-4">
                    <Text className="block text-sm font-semibold text-stone-800 mb-1">
                      {item.title}
                    </Text>
                    <Text className="block text-xs text-stone-500 mb-3">
                      {item.source || '来源待补充'} / {compactDate(item.created_at)}
                    </Text>
                    <Text className="block text-xs text-stone-400 mb-2">
                      添加者：{item.updated_by_name || item.created_by_name || '待补充'}
                    </Text>
                    <Text className="block text-sm text-stone-700 leading-relaxed">
                      {item.summary || item.content}
                    </Text>
                    {tags.length > 0 && (
                      <>
                        <Separator className="my-3" />
                        <View className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              <Text className="text-xs">{tag}</Text>
                            </Badge>
                          ))}
                        </View>
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </View>
        )}
      </View>
    </View>
  )
}

export default SubtopicMaterialsPage
