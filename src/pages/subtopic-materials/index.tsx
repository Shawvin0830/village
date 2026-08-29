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
  Pencil,
  Quote,
  ShieldCheck,
  UserRound,
  ExternalLink,
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
  essence_summary?: string | null
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

type ViewMode = 'main' | 'interviews' | 'references' | 'profile'

const SubtopicMaterialsPage = () => {
  const router = useRouter()
  const topicId = router.params.topicId || ''
  const subtopicId = router.params.subtopicId || ''

  const [data, setData] = useState<SubtopicMaterialsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('main')
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

  const goBack = () => {
    if (view === 'profile') {
      setView('interviews')
      setSelectedQuote(null)
    } else {
      setView('main')
    }
  }

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

  // ---- 受访人档案详情 ----
  if (view === 'profile' && selectedQuote) {
    const person = selectedQuote.interviewee
    const status = authInfo(person.auth_status)

    return (
      <View className="min-h-screen bg-stone-50 pb-8">
        <View className="px-4 pt-6 pb-4">
          <Button size="sm" variant="ghost" className="mb-3" onClick={goBack}>
            <ArrowLeft size={16} color="#57534E" className="mr-1" />
            <Text>返回采访记录</Text>
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
                  &ldquo;{selectedQuote.quote}&rdquo;
                </Text>
              </View>
              <Text className="block text-xs text-stone-500">
                来源：采访整理文档 / {compactDate(selectedQuote.created_at)}
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
                {selectedQuote.full_interview}
              </Text>
            </CardContent>
          </Card>
        </View>
      </View>
    )
  }

  // ---- 历史采访沉淀列表 ----
  if (view === 'interviews') {
    return (
      <View className="min-h-screen bg-stone-50 pb-8">
        <View className="px-4 pt-6 pb-2">
          <Button size="sm" variant="ghost" className="mb-3" onClick={goBack}>
            <ArrowLeft size={16} color="#57534E" className="mr-1" />
            <Text>返回子话题</Text>
          </Button>
          <View className="flex items-center mb-2">
            <Quote size={20} color="#B45309" className="mr-2" />
            <Text className="block text-xl font-bold text-stone-800">历史采访沉淀</Text>
          </View>
          <Text className="block text-sm text-stone-500">
            {data.topic_name} / {data.subtopic.name}
          </Text>
        </View>

        {/* 采访精华摘要 */}
        {(data.essence_summary || data.subtopic.summary) && (
          <View className="px-4 mb-4">
            <Card className="border-amber-100 bg-amber-50">
              <CardContent className="p-4">
                <View className="flex items-center mb-2">
                  <FileText size={16} color="#92400E" className="mr-2" />
                  <Text className="block text-sm font-semibold text-amber-900">
                    内容精华
                  </Text>
                </View>
                <Text className="block text-sm text-stone-700 leading-relaxed">
                  {data.essence_summary || data.subtopic.summary}
                </Text>
              </CardContent>
            </Card>
          </View>
        )}

        {/* 采访记录列表 */}
        <View className="px-4">
          <Text className="block text-base font-semibold text-stone-800 mb-3">
            采访记录（{data.quotes.length}）
          </Text>

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
              {data.quotes.map((item) => (
                <Card
                  key={item.id}
                  className="border-stone-100 bg-white shadow-sm"
                  onClick={() => {
                    setSelectedQuote(item)
                    setView('profile')
                  }}
                >
                  <CardContent className="p-4">
                    {/* 时间 + 采访人 */}
                    <View className="flex items-center justify-between mb-3">
                      <View className="flex items-center flex-1">
                        <View className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center mr-2">
                          <UserRound size={18} color="#92400E" />
                        </View>
                        <View className="flex-1">
                          <Text className="block text-sm font-semibold text-stone-800">
                            {item.interviewee.name}
                          </Text>
                          <Text className="block text-xs text-stone-500">
                            {compactDate(item.created_at)}
                          </Text>
                        </View>
                      </View>
                      <ChevronRight size={16} color="#A8A29E" />
                    </View>

                    <Separator className="mb-3" />

                    {/* 结构化文档（摘录精华） */}
                    <View className="mb-3">
                      <Text className="block text-xs text-stone-500 mb-2">采访摘录</Text>
                      <View className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                        <Text className="block text-sm text-amber-900 leading-relaxed">
                          &ldquo;{item.quote}&rdquo;
                        </Text>
                      </View>
                    </View>

                    {/* 采访原始文本 */}
                    <View className="mb-3">
                      <Text className="block text-xs text-stone-500 mb-2">原始文本</Text>
                      <Text className="block text-sm text-stone-600 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                        {item.full_interview}
                      </Text>
                    </View>

                    {/* 编辑按钮 */}
                    <View className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-stone-200"
                        onClick={(e) => {
                          e.stopPropagation()
                          Taro.navigateTo({
                            url: `/pages/interview-manage/index?topicId=${topicId}&subtopicId=${subtopicId}&subName=${encodeURIComponent(data.subtopic.name)}&editId=${item.id}`,
                          })
                        }}
                      >
                        <Pencil size={14} color="#B45309" className="mr-1" />
                        <Text className="text-xs text-amber-700">编辑</Text>
                      </Button>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          )}
        </View>
      </View>
    )
  }

  // ---- 外部文献列表 ----
  if (view === 'references') {
    return (
      <View className="min-h-screen bg-stone-50 pb-8">
        <View className="px-4 pt-6 pb-2">
          <Button size="sm" variant="ghost" className="mb-3" onClick={goBack}>
            <ArrowLeft size={16} color="#57534E" className="mr-1" />
            <Text>返回子话题</Text>
          </Button>
          <View className="flex items-center mb-2">
            <BookOpen size={20} color="#1D4ED8" className="mr-2" />
            <Text className="block text-xl font-bold text-stone-800">外部文献</Text>
          </View>
          <Text className="block text-sm text-stone-500">
            {data.topic_name} / {data.subtopic.name}
          </Text>
        </View>

        <View className="px-4">
          <Text className="block text-base font-semibold text-stone-800 mb-3">
            文献资料（{data.references.length}）
          </Text>

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
              {data.references.map((item) => (
                <Card key={item.id} className="border-stone-100 bg-white shadow-sm">
                  <CardContent className="p-4">
                    {/* 摘录内容 */}
                    <View className="mb-3">
                      <Text className="block text-xs text-stone-500 mb-2">摘录</Text>
                      <View className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <Text className="block text-sm text-blue-900 leading-relaxed">
                          {item.summary || item.content}
                        </Text>
                      </View>
                    </View>

                    {/* 原文 */}
                    <View className="mb-3">
                      <Text className="block text-xs text-stone-500 mb-2">原文</Text>
                      <Text className="block text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                        {item.content}
                      </Text>
                    </View>

                    {/* 原文链接 */}
                    {item.url && (
                      <View
                        className="flex items-center mt-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (item.url) {
                            Taro.setClipboardData({
                              data: item.url,
                              success: () => {
                                Taro.showToast({ title: '链接已复制', icon: 'success' })
                              },
                            })
                          }
                        }}
                      >
                        <ExternalLink size={14} color="#1D4ED8" className="mr-1" />
                        <Text className="text-sm text-blue-600">
                          {item.source || '查看原文来源'}
                        </Text>
                      </View>
                    )}

                    <Text className="block text-xs text-stone-400 mt-2">
                      {item.source || '来源待补充'} · {compactDate(item.created_at)}
                    </Text>
                  </CardContent>
                </Card>
              ))}
            </View>
          )}
        </View>
      </View>
    )
  }

  // ---- 主视图：精华摘要 + 两个入口卡片 ----
  return (
    <View className="min-h-screen bg-stone-50 pb-8">
      {/* 子话题标题 */}
      <View className="px-4 pt-6 pb-3">
        <Text className="block text-xl font-bold text-stone-800">
          {data.subtopic.icon || '📌'} {data.subtopic.name}
        </Text>
        <Text className="block text-sm text-stone-500 mt-1">{data.topic_name}</Text>
      </View>

      {/* 精华内容摘要 */}
      {(data.essence_summary || data.subtopic.summary) && (
        <View className="px-4 mb-5">
          <Card className="border-amber-100 bg-amber-50">
            <CardContent className="p-4">
              <View className="flex items-center mb-2">
                <FileText size={16} color="#92400E" className="mr-2" />
                <Text className="block text-sm font-semibold text-amber-900">
                  内容精华
                </Text>
              </View>
              <Text className="block text-sm text-stone-700 leading-relaxed">
                {data.essence_summary || data.subtopic.summary}
              </Text>
            </CardContent>
          </Card>
        </View>
      )}

      {/* 两个入口卡片 */}
      <View className="px-4 space-y-3">
        <Card
          className="border-stone-100 bg-white shadow-sm"
          onClick={() => setView('interviews')}
        >
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View className="flex items-center flex-1">
                <View className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mr-3">
                  <Quote size={20} color="#B45309" />
                </View>
                <View className="flex-1">
                  <Text className="block text-base font-semibold text-stone-800">
                    历史采访沉淀
                  </Text>
                  <Text className="block text-xs text-stone-500 mt-1">
                    {data.quotes.length} 条采访记录
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#A8A29E" />
            </View>
          </CardContent>
        </Card>

        <Card
          className="border-stone-100 bg-white shadow-sm"
          onClick={() => setView('references')}
        >
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View className="flex items-center flex-1">
                <View className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mr-3">
                  <BookOpen size={20} color="#1D4ED8" />
                </View>
                <View className="flex-1">
                  <Text className="block text-base font-semibold text-stone-800">
                    外部文献
                  </Text>
                  <Text className="block text-xs text-stone-500 mt-1">
                    {data.references.length} 篇文献资料
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#A8A29E" />
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}

export default SubtopicMaterialsPage
