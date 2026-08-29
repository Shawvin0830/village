import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Network } from '@/network'
import { BookOpen, Lightbulb, RefreshCw, Search, Plus, Trash2, FileText } from 'lucide-react-taro'

interface InterviewPlan {
  id: string
  context_summary: string | null
  adult_questions: string[] | null
  child_questions: string[] | null
  tips: string[] | null
}

interface ReferenceMaterial {
  id: string
  source: 'manual' | 'web_search' | 'library'
  title: string
  content: string
  url?: string | null
  structured_data?: any
  tags?: string[] | null
  created_at: string
}

const InterviewPlanPage = () => {
  const router = useRouter()
  const topicId = router.params.topicId || ''

  const [plan, setPlan] = useState<InterviewPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  // 参考资料状态
  const [materials, setMaterials] = useState<ReferenceMaterial[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('list')

  // 手动添加资料
  const [manualTitle, setManualTitle] = useState('')
  const [manualContent, setManualContent] = useState('')
  const [addingManual, setAddingManual] = useState(false)

  // AI 联网搜索
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [lastSearchResult, setLastSearchResult] = useState<any>(null)

  // 加载已有参考资料
  useEffect(() => {
    if (topicId) {
      loadMaterials()
    }
  }, [topicId])

  const loadMaterials = async () => {
    try {
      setMaterialsLoading(true)
      const res = await Network.request({
        url: `/api/reference-materials/topic/${topicId}`,
        method: 'GET',
      })
      console.log('Load materials response:', res.data)
      if (res.data?.data) {
        setMaterials(res.data.data)
      }
    } catch (err) {
      console.error('加载参考资料失败:', err)
    } finally {
      setMaterialsLoading(false)
    }
  }

  // 手动添加资料
  const handleAddManual = async () => {
    if (!manualTitle.trim() || !manualContent.trim()) {
      Taro.showToast({ title: '请填写标题和内容', icon: 'none' })
      return
    }
    try {
      setAddingManual(true)
      const res = await Network.request({
        url: '/api/reference-materials',
        method: 'POST',
        data: {
          topic_id: topicId,
          title: manualTitle.trim(),
          content: manualContent.trim(),
          tags: ['手动输入'],
        },
      })
      console.log('Add manual material response:', res.data)
      if (res.data?.code === 200) {
        Taro.showToast({ title: '添加成功', icon: 'success' })
        setManualTitle('')
        setManualContent('')
        setActiveTab('list')
        loadMaterials()
      }
    } catch (err) {
      console.error('添加参考资料失败:', err)
      Taro.showToast({ title: '添加失败', icon: 'none' })
    } finally {
      setAddingManual(false)
    }
  }

  // AI 联网搜索
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Taro.showToast({ title: '请输入搜索关键词', icon: 'none' })
      return
    }
    try {
      setSearching(true)
      const res = await Network.request({
        url: '/api/reference-materials/search',
        method: 'POST',
        data: {
          topic_id: topicId,
          query: searchQuery.trim(),
          count: 5,
        },
      })
      console.log('Search response:', res.data)
      if (res.data?.code === 200) {
        setLastSearchResult(res.data.data)
        Taro.showToast({ title: '搜索完成', icon: 'success' })
        setActiveTab('list')
        loadMaterials()
      }
    } catch (err) {
      console.error('联网搜索失败:', err)
      Taro.showToast({ title: '搜索失败', icon: 'none' })
    } finally {
      setSearching(false)
    }
  }

  // 删除资料
  const handleDelete = async (id: string) => {
    try {
      await Network.request({
        url: `/api/reference-materials/${id}`,
        method: 'DELETE',
      })
      Taro.showToast({ title: '已删除', icon: 'success' })
      loadMaterials()
    } catch (err) {
      console.error('删除失败:', err)
    }
  }

  // 生成采访策划
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

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'manual':
        return '手动输入'
      case 'web_search':
        return '联网搜索'
      case 'library':
        return '图书馆资料'
      default:
        return source
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'manual':
        return '📝'
      case 'web_search':
        return '🌐'
      case 'library':
        return '📚'
      default:
        return '📄'
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
          添加参考资料，AI 帮你生成采访问题清单
        </Text>
      </View>

      {/* 参考资料区域 */}
      <View className="px-4 mb-4">
        <Card className="border-stone-100 bg-white">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <View className="flex items-center gap-2">
                <FileText size={18} color="#B45309" />
                <Text className="block text-base font-semibold text-stone-800">
                  参考资料
                </Text>
              </View>
              <Text className="block text-xs text-stone-400">
                {materials.length} 条
              </Text>
            </View>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-3">
                <TabsTrigger value="list">
                  <Text className="text-xs">已有资料</Text>
                </TabsTrigger>
                <TabsTrigger value="add">
                  <Text className="text-xs">手动添加</Text>
                </TabsTrigger>
                <TabsTrigger value="search">
                  <Text className="text-xs">联网搜索</Text>
                </TabsTrigger>
              </TabsList>

              {/* 已有资料列表 */}
              <TabsContent value="list">
                {materialsLoading ? (
                  <View className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </View>
                ) : materials.length === 0 ? (
                  <View className="py-6 flex flex-col items-center">
                    <Text className="block text-2xl mb-2">📭</Text>
                    <Text className="block text-sm text-stone-400">
                      还没有参考资料
                    </Text>
                    <Text className="block text-xs text-stone-400 mt-1">
                      手动添加或让 AI 联网搜索
                    </Text>
                  </View>
                ) : (
                  <View className="space-y-2 max-h-64 overflow-y-auto">
                    {materials.map((m) => (
                      <View
                        key={m.id}
                        className="flex items-start gap-2 p-2 bg-stone-50 rounded-lg"
                      >
                        <Text className="text-sm mt-1">{getSourceIcon(m.source)}</Text>
                        <View className="flex-1 min-w-0">
                          <Text className="block text-sm font-medium text-stone-700 truncate">
                            {m.title}
                          </Text>
                          <View className="flex items-center gap-2 mt-1">
                            <Text className="block text-xs text-stone-400">
                              {getSourceLabel(m.source)}
                            </Text>
                            {m.url && (
                              <Text className="block text-xs text-amber-600 truncate">
                                {m.url}
                              </Text>
                            )}
                          </View>
                          {m.structured_data?.summary && (
                            <Text className="block text-xs text-stone-500 mt-1 line-clamp-2">
                              {m.structured_data.summary}
                            </Text>
                          )}
                        </View>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0 p-1"
                          onClick={() => handleDelete(m.id)}
                        >
                          <Trash2 size={14} color="#9CA3AF" />
                        </Button>
                      </View>
                    ))}
                  </View>
                )}
              </TabsContent>

              {/* 手动添加 */}
              <TabsContent value="add">
                <View className="space-y-3">
                  <View>
                    <Text className="block text-xs text-stone-500 mb-1">标题</Text>
                    <View className="bg-stone-50 rounded-lg px-3 py-2">
                      <Input
                        className="w-full bg-transparent text-sm"
                        placeholder="如：村志摘录、张爷爷的讲述..."
                        value={manualTitle}
                        onInput={(e) => setManualTitle(e.detail.value)}
                      />
                    </View>
                  </View>
                  <View>
                    <Text className="block text-xs text-stone-500 mb-1">内容</Text>
                    <Textarea
                      className="min-h-32 text-sm"
                      placeholder="粘贴或输入你查到的资料内容..."
                      value={manualContent}
                      onInput={(e) => setManualContent(e.detail.value)}
                      maxlength={5000}
                    />
                  </View>
                  <Button
                    className="w-full bg-amber-700 hover:bg-amber-800 text-white"
                    onClick={handleAddManual}
                    disabled={addingManual}
                  >
                    <Plus size={16} color="#ffffff" className="mr-1" />
                    <Text>{addingManual ? '添加中...' : '添加资料'}</Text>
                  </Button>
                </View>
              </TabsContent>

              {/* 联网搜索 */}
              <TabsContent value="search">
                <View className="space-y-3">
                  <View>
                    <Text className="block text-xs text-stone-500 mb-1">搜索关键词</Text>
                    <View className="bg-stone-50 rounded-lg px-3 py-2">
                      <Input
                        className="w-full bg-transparent text-sm"
                        placeholder="如：潮汕宗祠建筑 历史 特点"
                        value={searchQuery}
                        onInput={(e) => setSearchQuery(e.detail.value)}
                      />
                    </View>
                  </View>
                  <Button
                    className="w-full bg-lime-700 hover:bg-lime-800 text-white"
                    onClick={handleSearch}
                    disabled={searching}
                  >
                    <Search size={16} color="#ffffff" className="mr-1" />
                    <Text>{searching ? '搜索中...' : 'AI 联网搜索并保存'}</Text>
                  </Button>
                  <Text className="block text-xs text-stone-400 text-center">
                    搜索结果会自动保存为参考资料
                  </Text>

                  {/* 搜索结果预览 */}
                  {lastSearchResult && (
                    <View className="mt-3 p-3 bg-lime-50 rounded-lg">
                      <Text className="block text-xs font-medium text-lime-800 mb-2">
                        搜索摘要
                      </Text>
                      <Text className="block text-xs text-stone-600">
                        {lastSearchResult.summary}
                      </Text>
                      {lastSearchResult.structured_data?.key_facts?.length > 0 && (
                        <View className="mt-2">
                          <Text className="block text-xs font-medium text-lime-800 mb-1">
                            关键事实
                          </Text>
                          {lastSearchResult.structured_data.key_facts.slice(0, 3).map((f: string, i: number) => (
                            <Text key={i} className="block text-xs text-stone-600">
                              - {f}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
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
                AI 会综合参考资料，生成问题清单
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
            <Text className="block text-sm text-stone-500 mb-6">正在分析话题和参考资料</Text>
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
