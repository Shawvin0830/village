import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import { BookOpen, RefreshCw, FileText, FolderOpen, Search, Globe, ChevronDown, ChevronUp, FileSearch, BookOpenCheck, Save, Send, MessageCircle, ChevronRight } from 'lucide-react-taro'

interface CoreQuestion {
  dimension: string
  dimension_key: string
  adult_version: string
  child_version: string
  why_ask: string
  follow_up: string
}

interface TipsData {
  people: string[]
  time: string[]
  place: string[]
  practice: string[]
  change: string[]
  dialect: string[]
  special: string[]
}

interface InterviewPlan {
  id: string
  context_summary: string | null
  selected_dimensions: string[] | null
  warmup_questions: string[] | null
  core_questions: CoreQuestion[] | null
  closing_questions: string[] | null
  tips: TipsData | null
  status?: string
  created_at?: string
}

interface Subtopic {
  id: string
  name: string
  icon?: string
  transcript_status?: string
  summary?: string
}

interface Material {
  id: string
  source: string
  title: string
  content: string
  tags: string[] | null
  url: string | null
  created_at: string
}

interface StructuredData {
  summary: string
  keyFacts: string[]
  relatedEntities: string[]
  credibility: 'high' | 'medium' | 'low'
}

interface SearchMaterial {
  title: string
  content: string
  source: string
  url: string
  tags: string[]
  structuredData: StructuredData
}

interface SearchResult {
  searchSummary: string
  materials: SearchMaterial[]
}

interface ResearchDocument {
  title: string
  content: string
}

const InterviewPlanPage = () => {
  const router = useRouter()
  const topicId = router.params.topicId || ''

  // 追问锦囊分类渲染
  const renderTipsCategory = (label: string, items: string[] | undefined) => {
    if (!items || items.length === 0) return null
    return (
      <View className="mb-3">
        <Text className="block text-sm font-medium text-stone-700 mb-1">{label}</Text>
        <View className="space-y-1 ml-1">
          {items.map((tip, i) => (
            <Text key={i} className="block text-xs text-stone-600">· {tip}</Text>
          ))}
        </View>
      </View>
    )
  }

  const [plan, setPlan] = useState<InterviewPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  // 版本历史状态
  const [planVersions, setPlanVersions] = useState<InterviewPlan[]>([])
  const [showVersionHistory, setShowVersionHistory] = useState(false)

  // 资料库状态（仅用于显示数量）
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(false)

  // AI 搜索状态
  const [showAISearch, setShowAISearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [savingIndex, setSavingIndex] = useState<number | null>(null)

  // AI资料搜索内的模式切换：search | research
  const [aiMode, setAiMode] = useState<'search' | 'research'>('search')

  // 话题名称（用于搜索上下文）
  const [topicName, setTopicName] = useState('')

  // 专题研究状态
  const [researching, setResearching] = useState(false)
  const [researchDoc, setResearchDoc] = useState<ResearchDocument | null>(null)
  const [researchFocus, setResearchFocus] = useState('')

  // 策划文档折叠状态
  const [showContext, setShowContext] = useState(false)
  const [showDimensions, setShowDimensions] = useState(false)
  const [expandedIntent, setExpandedIntent] = useState<number | null>(null)

  // 讨论调整状态
  const [feedback, setFeedback] = useState('')
  const [refining, setRefining] = useState(false)

  // 生成前对话状态
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string>('')
  const [generateRequirements, setGenerateRequirements] = useState('')
  const [subtopics, setSubtopics] = useState<Subtopic[]>([])

  // 加载话题名称、资料列表、已有策划和子话题
  useEffect(() => {
    if (topicId) {
      loadMaterials()
      loadTopicName()
      loadPlans()
      loadSubtopics()
    }
  }, [topicId])

  const loadTopicName = async () => {
    try {
      const res = await Network.request({ url: `/api/topics/${topicId}` })
      const data = res.data?.data
      if (data?.name) {
        setTopicName(data.name)
      }
    } catch (err) {
      console.error('获取话题名称失败:', err)
    }
  }

  const loadPlans = async () => {
    try {
      const res = await Network.request({ url: `/api/interview-plans/${topicId}` })
      const data = res.data?.data
      if (data && Array.isArray(data) && data.length > 0) {
        const mappedPlans: InterviewPlan[] = data.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          context_summary: p.context_summary as string | null,
          selected_dimensions: p.adult_questions as string[] | null,
          warmup_questions: p.child_questions as string[] | null,
          core_questions: (p.tips as Record<string, unknown>)?.core_questions as CoreQuestion[] | null,
          closing_questions: (p.tips as Record<string, unknown>)?.closing_questions as string[] | null,
          tips: (p.tips as Record<string, unknown>)?.tips as TipsData | null,
          status: p.status as string | undefined,
          created_at: p.created_at as string | undefined,
        }))
        setPlanVersions(mappedPlans)
        // 默认显示最新版本（数组第一个）
        setPlan(mappedPlans[0])
      }
    } catch (err) {
      console.error('获取采访策划失败:', err)
    }
  }

  const loadSubtopics = async () => {
    try {
      const res = await Network.request({ url: `/api/topics/${topicId}/subtopics` })
      const data = res.data?.data
      if (data && Array.isArray(data)) {
        setSubtopics(data)
      }
    } catch (err) {
      console.error('获取子话题失败:', err)
    }
  }

  const loadMaterials = async () => {
    try {
      setMaterialsLoading(true)
      const res = await Network.request({
        url: `/api/materials/topic/${topicId}`,
        method: 'GET',
      })
      console.log('Load materials response:', res.data)
      const data = res.data?.data
      if (data) {
        setMaterials(data)
      }
    } catch (err) {
      console.error('加载资料失败:', err)
    } finally {
      setMaterialsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Taro.showToast({ title: '请输入搜索关键词', icon: 'none' })
      return
    }
    try {
      setSearching(true)
      setSearchResult(null)
      const res = await Network.request({
        url: '/api/materials/search',
        method: 'POST',
        data: { query: searchQuery.trim(), topicName },
      })
      console.log('AI search response:', res.data)
      const data = res.data?.data
      if (data) {
        setSearchResult(data)
      }
    } catch (err) {
      console.error('AI 搜索失败:', err)
      Taro.showToast({ title: '搜索失败，请重试', icon: 'none' })
    } finally {
      setSearching(false)
    }
  }

  const handleSaveMaterial = async (material: SearchMaterial, index: number) => {
    try {
      setSavingIndex(index)
      const res = await Network.request({
        url: '/api/materials',
        method: 'POST',
        data: {
          topicId,
          source: 'ai_search',
          title: material.title,
          content: material.content,
          url: material.url || null,
          tags: material.tags,
          structuredData: material.structuredData,
        },
      })
      console.log('Save material response:', res.data)
      if (res.data?.code === 200) {
        Taro.showToast({ title: '已保存到资料库', icon: 'success' })
        loadMaterials()
      }
    } catch (err) {
      console.error('保存资料失败:', err)
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' })
    } finally {
      setSavingIndex(null)
    }
  }

  const getCredibilityLabel = (credibility: string) => {
    switch (credibility) {
      case 'high': return '权威'
      case 'medium': return '一般'
      case 'low': return '待验证'
      default: return credibility
    }
  }

  const getCredibilityColor = (credibility: string) => {
    switch (credibility) {
      case 'high': return 'bg-green-50 text-green-700'
      case 'medium': return 'bg-amber-50 text-amber-700'
      case 'low': return 'bg-stone-100 text-stone-500'
      default: return 'bg-stone-100 text-stone-500'
    }
  }

  // 保存研究文档到资料库
  const [savingResearch, setSavingResearch] = useState(false)

  const handleSaveResearch = async () => {
    if (!researchDoc || !topicId) return
    try {
      setSavingResearch(true)
      const res = await Network.request({
        url: '/api/materials',
        method: 'POST',
        data: {
          topicId,
          source: 'ai_research',
          title: researchDoc.title,
          content: researchDoc.content,
        },
      })
      console.log('Save research response:', res.data)
      if (res.data?.code === 200) {
        Taro.showToast({ title: '已保存到资料库', icon: 'success' })
        loadMaterials()
      } else {
        Taro.showToast({ title: res.data?.msg || '保存失败', icon: 'none' })
      }
    } catch (err) {
      console.error('保存研究文档失败:', err)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSavingResearch(false)
    }
  }

  const handleResearch = async () => {
    if (!topicId || !topicName) {
      Taro.showToast({ title: '话题信息不完整', icon: 'none' })
      return
    }
    try {
      setResearching(true)
      setResearchDoc(null)

      const focusAreas = researchFocus
        .split(/[,，、\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)

      const res = await Network.request({
        url: '/api/materials/research',
        method: 'POST',
        data: {
          topicId,
          topicName,
          focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
        },
      })
      console.log('Research response:', res.data)
      const data = res.data?.data
      if (data) {
        setResearchDoc({ title: data.title, content: data.content })
      }
    } catch (err) {
      console.error('专题研究失败:', err)
      Taro.showToast({ title: '研究失败，请重试', icon: 'none' })
    } finally {
      setResearching(false)
    }
  }

  const handleGenerate = async () => {
    // 显示生成前对话弹窗
    setShowGenerateDialog(true)
  }

  const handleConfirmGenerate = async () => {
    if (!topicId) return
    try {
      setGenerating(true)
      setLoading(true)
      setShowGenerateDialog(false)
      const res = await Network.request({
        url: '/api/interview-plans/generate',
        method: 'POST',
        data: {
          topic_id: topicId,
          subtopic_id: selectedSubtopicId || undefined,
          requirements: generateRequirements.trim() || undefined,
        },
      })
      console.log('Generate plan response:', res.data)
      const data = res.data?.data
      if (data) {
        setPlan(data)
        // 将新版本添加到版本历史开头
        setPlanVersions(prev => [data, ...prev])
        // 重置对话框状态
        setSelectedSubtopicId('')
        setGenerateRequirements('')
      }
    } catch (err) {
      console.error('生成采访策划失败:', err)
      Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
    } finally {
      setGenerating(false)
      setLoading(false)
    }
  }

  const handleRefine = async () => {
    if (!feedback.trim() || !plan?.id) {
      Taro.showToast({ title: '请输入你的修改意见', icon: 'none' })
      return
    }
    try {
      setRefining(true)
      const res = await Network.request({
        url: `/api/interview-plans/${plan.id}/refine`,
        method: 'POST',
        data: { feedback: feedback.trim() },
      })
      console.log('Refine plan response:', res.data)
      const data = res.data?.data
      if (data) {
        setPlan(data)
        // 将新版本添加到版本历史开头
        setPlanVersions(prev => [data, ...prev])
        setFeedback('')
        Taro.showToast({ title: '已生成新版本', icon: 'success' })
      }
    } catch (err) {
      console.error('迭代优化失败:', err)
      Taro.showToast({ title: '更新失败，请重试', icon: 'none' })
    } finally {
      setRefining(false)
    }
  }

  const switchVersion = (version: InterviewPlan) => {
    setPlan(version)
    setShowVersionHistory(false)
  }

  // 跳转到资料库管理页
  const goToMaterialLibrary = () => {
    Taro.navigateTo({
      url: `/pages/material-library/index?topicId=${topicId}&topicName=${encodeURIComponent(topicName || '资料库')}`,
    })
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
          添加资料，AI将基于资料为你生成推荐采访的问题清单
        </Text>
      </View>

      {/* 加载中 */}
      {loading && (
        <View className="px-4 mb-4">
          <View className="flex flex-col items-center py-8">
            <Text className="block text-4xl mb-4">🤔</Text>
            <Text className="block text-base text-stone-700 mb-2">AI 正在思考中...</Text>
            <Text className="block text-sm text-stone-500 mb-6">正在分析话题背景和资料，生成问题清单</Text>
            <Skeleton className="h-4 w-64 mb-2" />
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-56" />
          </View>
        </View>
      )}

      {/* 资料库 - 紧凑入口 */}
      <View className="px-4 mb-4">
        <Card className="border-stone-100 bg-white" onClick={goToMaterialLibrary}>
          <CardContent className="p-4 flex items-center justify-between">
            <View className="flex items-center gap-2">
              <FolderOpen size={18} color="#B45309" />
              <Text className="block text-base font-semibold text-stone-800">
                资料库
              </Text>
              {materialsLoading ? (
                <Skeleton className="h-5 w-8" />
              ) : (
                <Badge className="bg-stone-100 text-stone-600 text-xs">
                  {materials.length}
                </Badge>
              )}
            </View>
            <View className="flex items-center gap-1">
              <Text className="block text-xs text-stone-400">进入管理</Text>
              <ChevronRight size={16} color="#9CA3AF" />
            </View>
          </CardContent>
        </Card>
      </View>

      {/* AI 资料搜索（含专题研究能力） */}
      <View className="px-4 mb-4">
        <Card className="border-stone-100 bg-white">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <View className="flex items-center gap-2">
                <Globe size={18} color="#4D7C0F" />
                <Text className="block text-base font-semibold text-stone-800">
                  AI 资料搜索
                </Text>
              </View>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAISearch(!showAISearch)}
              >
                <Search size={14} color="#4D7C0F" className="mr-1" />
                <Text className="text-xs">{showAISearch ? '收起' : '搜索'}</Text>
              </Button>
            </View>

            {showAISearch && (
              <View className="space-y-3">
                {/* 模式切换 */}
                <View className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`flex-1 ${aiMode === 'search' ? 'bg-lime-50 border-lime-300 text-lime-800' : 'border-stone-200 text-stone-500'}`}
                    onClick={() => setAiMode('search')}
                  >
                    <Search size={14} color={aiMode === 'search' ? '#4D7C0F' : '#78716C'} className="mr-1" />
                    <Text className="text-xs">资料搜索</Text>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`flex-1 ${aiMode === 'research' ? 'bg-amber-50 border-amber-300 text-amber-800' : 'border-stone-200 text-stone-500'}`}
                    onClick={() => setAiMode('research')}
                  >
                    <FileSearch size={14} color={aiMode === 'research' ? '#B45309' : '#78716C'} className="mr-1" />
                    <Text className="text-xs">专题研究</Text>
                  </Button>
                </View>

                {/* 资料搜索模式 */}
                {aiMode === 'search' && (
                  <View className="space-y-3">
                    <View>
                      <Text className="block text-xs text-stone-500 mb-1">
                        输入关键词，AI 帮你搜索网络文献并整理成结构化资料
                      </Text>
                      <View className="bg-stone-50 rounded-lg px-3 py-2">
                        <Input
                          className="w-full bg-transparent"
                          placeholder="如：祠堂建筑历史、XX村民俗、传统木雕工艺..."
                          value={searchQuery}
                          onInput={(e) => setSearchQuery(e.detail.value)}
                          onConfirm={handleSearch}
                        />
                      </View>
                    </View>
                    <Button
                      className="w-full bg-lime-800 hover:bg-lime-900 text-white"
                      size="sm"
                      onClick={handleSearch}
                      disabled={searching}
                    >
                      <Search size={14} color="#fff" className="mr-1" />
                      <Text className="text-xs">{searching ? '搜索整理中...' : '搜索并整理资料'}</Text>
                    </Button>

                    {/* 搜索结果 */}
                    {searchResult && (
                      <View className="space-y-3">
                        <View className="p-3 bg-lime-50 rounded-lg">
                          <Text className="block text-xs font-medium text-lime-800 mb-1">
                            AI 整理摘要
                          </Text>
                          <Text className="block text-xs text-stone-600 leading-relaxed">
                            {searchResult.searchSummary}
                          </Text>
                        </View>

                        {searchResult.materials.length === 0 ? (
                          <View className="py-4 text-center">
                            <Text className="block text-sm text-stone-500">
                              未找到相关资料，请尝试其他关键词
                            </Text>
                          </View>
                        ) : (
                          <View className="space-y-2">
                            <Text className="block text-xs text-stone-500">
                              找到 {searchResult.materials.length} 条结构化资料，点击可保存到资料库
                            </Text>
                            {searchResult.materials.map((m, i) => (
                              <View key={i} className="p-3 bg-stone-50 rounded-lg">
                                <View
                                  className="flex items-start justify-between"
                                  onClick={() => setExpandedCard(expandedCard === i ? null : i)}
                                >
                                  <View className="flex items-start gap-2 flex-1">
                                    <FileText size={14} color="#4D7C0F" />
                                    <View className="flex-1">
                                      <Text className="block text-sm font-medium text-stone-800">
                                        {m.title}
                                      </Text>
                                      <View className="flex items-center gap-1 mt-1">
                                        <Text className="block text-xs text-stone-400">
                                          {m.source}
                                        </Text>
                                        <Badge className={`text-xs ${getCredibilityColor(m.structuredData.credibility)}`}>
                                          {getCredibilityLabel(m.structuredData.credibility)}
                                        </Badge>
                                      </View>
                                    </View>
                                  </View>
                                  {expandedCard === i ? (
                                    <ChevronUp size={16} color="#78716C" />
                                  ) : (
                                    <ChevronDown size={16} color="#78716C" />
                                  )}
                                </View>

                                {m.structuredData.summary && (
                                  <Text className="block text-xs text-stone-500 mt-2 ml-5 italic">
                                    {m.structuredData.summary}
                                  </Text>
                                )}

                                {expandedCard === i && (
                                  <View className="mt-3 ml-5 space-y-2">
                                    <Text className="block text-xs text-stone-600 leading-relaxed">
                                      {m.content}
                                    </Text>

                                    {m.structuredData.keyFacts.length > 0 && (
                                      <View>
                                        <Text className="block text-xs font-medium text-stone-700 mb-1">
                                          关键信息
                                        </Text>
                                        {m.structuredData.keyFacts.map((fact, fi) => (
                                          <Text key={fi} className="block text-xs text-stone-500">
                                            · {fact}
                                          </Text>
                                        ))}
                                      </View>
                                    )}

                                    {m.tags.length > 0 && (
                                      <View className="flex flex-wrap gap-1">
                                        {m.tags.map((tag, ti) => (
                                          <Badge key={ti} className="bg-stone-200 text-stone-600 text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </View>
                                    )}

                                    {m.url && (
                                      <Text className="block text-xs text-blue-600">
                                        来源: {m.url}
                                      </Text>
                                    )}
                                  </View>
                                )}

                                <View className="mt-2 ml-5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-lime-300 text-lime-800"
                                    onClick={() => handleSaveMaterial(m, i)}
                                    disabled={savingIndex === i}
                                  >
                                    <FileText size={12} color="#4D7C0F" className="mr-1" />
                                    <Text className="text-xs">
                                      {savingIndex === i ? '保存中...' : '保存到资料库'}
                                    </Text>
                                  </Button>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* 专题研究模式 */}
                {aiMode === 'research' && (
                  <View className="space-y-3">
                    <Text className="block text-xs text-stone-500">
                      AI 会从多个维度搜索网络权威资料，整理成一篇可读的专题研究文档
                    </Text>

                    <View>
                      <Text className="block text-xs text-stone-500 mb-1">
                        重点关注方向（可选，逗号分隔）
                      </Text>
                      <View className="bg-stone-50 rounded-lg px-3 py-2">
                        <Input
                          className="w-full bg-transparent"
                          placeholder="如：建筑特色、方言俗语、宗族制度..."
                          value={researchFocus}
                          onInput={(e) => setResearchFocus(e.detail.value)}
                        />
                      </View>
                    </View>

                    <Button
                      className="w-full bg-amber-700 hover:bg-amber-800 text-white"
                      onClick={handleResearch}
                      disabled={researching}
                    >
                      <FileSearch size={14} color="#fff" className="mr-1" />
                      <Text className="text-xs">{researching ? '正在深度研究（约1分钟）...' : '开始专题研究'}</Text>
                    </Button>

                    {researching && (
                      <View className="py-4 flex flex-col items-center">
                        <Text className="block text-2xl mb-2">🔍</Text>
                        <Text className="block text-sm text-stone-600 mb-1 text-center">
                          AI 正在多维度搜索相关资料
                        </Text>
                        <Text className="block text-xs text-stone-400 text-center">
                          搜索网络文献 → 筛选权威来源 → 整理研究文档
                        </Text>
                        <View className="mt-3 w-full space-y-2">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-5/6" />
                          <Skeleton className="h-3 w-4/6" />
                        </View>
                      </View>
                    )}

                    {researchDoc && !researching && (
                      <View className="space-y-3">
                        <View className="flex items-center gap-2">
                          <BookOpenCheck size={16} color="#166534" />
                          <Text className="block text-sm font-semibold text-stone-800 flex-1">
                            {researchDoc.title}
                          </Text>
                        </View>

                        <View className="p-3 bg-stone-50 rounded-lg">
                          <Text className="block text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                            {researchDoc.content}
                          </Text>
                        </View>

                        <View className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-stone-200"
                            onClick={handleResearch}
                            disabled={researching}
                          >
                            <RefreshCw size={12} color="#B45309" className="mr-1" />
                            <Text className="text-xs">重新研究</Text>
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-amber-500"
                            onClick={handleSaveResearch}
                            disabled={savingResearch}
                          >
                            <Save size={12} color="#fff" className="mr-1" />
                            <Text className="text-xs text-white">
                              {savingResearch ? '保存中...' : '保存到资料库'}
                            </Text>
                          </Button>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* 继续调整 / 生成采访稿 区域（放在建议问题上面） */}
      {!loading && (
        <View className="px-4 mb-4">
          <Card className="border-stone-200 bg-white">
            <CardContent className="p-4">
              {plan ? (
                <>
                  {/* 已有策划：显示继续调整 */}
                  <View className="flex items-center gap-2 mb-3">
                    <MessageCircle size={18} color="#B45309" />
                    <Text className="block text-base font-semibold text-stone-800">
                      继续调整
                    </Text>
                  </View>
                  <Text className="block text-xs text-stone-500 mb-3">
                    告诉 AI 你想怎么改，比如「孩子版问题太学术了」、「再加一个关于XX的问题」
                  </Text>
                  <View className="bg-stone-50 rounded-lg p-3 mb-3">
                    <Textarea
                      style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
                      placeholder="输入你的修改意见..."
                      value={feedback}
                      onInput={(e) => setFeedback(e.detail.value)}
                    />
                  </View>
                  <View className="flex gap-2">
                    <Button
                      className="flex-1 bg-amber-700 hover:bg-amber-800 text-white"
                      onClick={handleRefine}
                      disabled={refining || !feedback.trim()}
                    >
                      <Send size={14} color="#fff" className="mr-1" />
                      <Text className="text-xs">{refining ? 'AI 正在调整...' : '发送反馈'}</Text>
                    </Button>
                    <Button
                      variant="outline"
                      className="border-stone-200"
                      onClick={handleGenerate}
                      disabled={generating}
                    >
                      <RefreshCw size={14} color="#B45309" className="mr-1" />
                      <Text className="text-xs">{generating ? '重新生成中...' : '生成采访稿'}</Text>
                    </Button>
                  </View>
                </>
              ) : (
                <>
                  {/* 未生成策划：显示生成采访稿入口 */}
                  <View className="flex flex-col items-center py-2">
                    <Text className="block text-4xl mb-4">📋</Text>
                    <Text className="block text-base text-stone-700 mb-2 text-center">
                      准备好采访问题
                    </Text>
                    <Text className="block text-sm text-stone-500 mb-6 text-center">
                      AI 会根据话题背景和资料库，生成大人版和孩子版的采访问题
                    </Text>
                    <View style={{ width: '100%' }}>
                      <Button
                        className="w-full bg-amber-700 text-white"
                        onClick={handleGenerate}
                        disabled={generating}
                      >
                        <Text className="text-white">{generating ? 'AI 正在思考...' : '生成采访稿'}</Text>
                      </Button>
                    </View>
                  </View>
                </>
              )}
            </CardContent>
          </Card>
        </View>
      )}

      {/* 策划结果 */}
      {plan && (
        <View className="px-4 space-y-4">
          {/* 版本历史 */}
          {planVersions.length > 1 && (
            <View className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVersionHistory(!showVersionHistory)}
                className="flex items-center gap-1"
              >
                <FileText size={14} color="#78716c" />
                <Text>版本历史 ({planVersions.length})</Text>
                {showVersionHistory ? <ChevronUp size={14} color="#78716c" /> : <ChevronDown size={14} color="#78716c" />}
              </Button>
              <Text className="block text-xs text-stone-400">
                当前：第 {planVersions.findIndex(v => v.id === plan.id) + 1} 版
              </Text>
            </View>
          )}

          {/* 版本历史面板 */}
          {showVersionHistory && planVersions.length > 1 && (
            <Card className="border-stone-200 bg-stone-50">
              <CardContent className="p-3">
                <Text className="block text-sm font-medium text-stone-700 mb-2">所有版本</Text>
                <View className="space-y-2">
                  {planVersions.map((version, index) => (
                    <View
                      key={version.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
                        version.id === plan.id ? 'bg-amber-100 border border-amber-300' : 'bg-white border border-stone-200'
                      }`}
                      onClick={() => switchVersion(version)}
                    >
                      <Text className="block text-xs font-medium text-stone-600">
                        {index === 0 ? '最新' : `第 ${planVersions.length - index} 版`}
                      </Text>
                      {version.id === plan.id && (
                        <Text className="block text-xs text-amber-700 font-medium">当前</Text>
                      )}
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          )}

          {/* 采访策划文档 */}
          <Card className="border-stone-200 bg-white">
            <CardContent className="p-5">
              <View className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-200">
                <BookOpen size={20} color="#B45309" />
                <Text className="block text-lg font-bold text-stone-800">采访策划</Text>
              </View>

              {plan.context_summary && (
                <View className="mb-4">
                  <View
                    className="flex items-center justify-between"
                    onClick={() => setShowContext(!showContext)}
                  >
                    <Text className="block text-sm font-semibold text-stone-700">背景信息</Text>
                    {showContext ? <ChevronUp size={16} color="#78716C" /> : <ChevronDown size={16} color="#78716C" />}
                  </View>
                  {showContext && (
                    <Text className="block text-sm text-stone-600 leading-relaxed whitespace-pre-wrap mt-2">
                      {plan.context_summary}
                    </Text>
                  )}
                </View>
              )}

              {plan.selected_dimensions && plan.selected_dimensions.length > 0 && (
                <View className="mb-4">
                  <View
                    className="flex items-center justify-between"
                    onClick={() => setShowDimensions(!showDimensions)}
                  >
                    <Text className="block text-sm font-semibold text-stone-700">采访维度</Text>
                    {showDimensions ? <ChevronUp size={16} color="#78716C" /> : <ChevronDown size={16} color="#78716C" />}
                  </View>
                  {showDimensions && (
                    <View className="flex flex-wrap gap-2 mt-2">
                      {plan.selected_dimensions.map((dim, i) => (
                        <Badge key={i} className="bg-amber-50 text-amber-800 border-amber-200">
                          {dim}
                        </Badge>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {plan.warmup_questions && plan.warmup_questions.length > 0 && (
                <View className="mb-5">
                  <Text className="block text-sm font-semibold text-stone-700 mb-2">热身问题</Text>
                  <View className="space-y-2">
                    {plan.warmup_questions.map((q, i) => (
                      <View key={i} className="flex items-start gap-2">
                        <Text className="block text-sm text-stone-400 flex-shrink-0">{i + 1}.</Text>
                        <Text className="block text-sm text-stone-700">{q}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {plan.core_questions && plan.core_questions.length > 0 && (
                <View className="mb-5">
                  <Text className="block text-sm font-semibold text-stone-700 mb-3">核心问题</Text>
                  <View className="space-y-3">
                    {plan.core_questions.map((q, i) => (
                      <View key={i} className="pl-3 border-l-2 border-stone-200">
                        <View className="mb-1">
                          <Text className="block text-sm text-stone-800">{q.child_version}</Text>
                        </View>
                        {q.why_ask && (
                          <View
                            className="flex items-center gap-1"
                            onClick={() => setExpandedIntent(expandedIntent === i ? null : i)}
                          >
                            <Text className="block text-xs text-stone-400">意图</Text>
                            {expandedIntent === i ? <ChevronUp size={12} color="#9CA3AF" /> : <ChevronDown size={12} color="#9CA3AF" />}
                          </View>
                        )}
                        {q.why_ask && expandedIntent === i && (
                          <View className="mt-1">
                            <Text className="block text-xs text-stone-400">
                              {q.why_ask}
                            </Text>
                          </View>
                        )}
                        {q.follow_up && (
                          <View className="mt-1">
                            <Text className="block text-xs text-stone-400">
                              追问：{q.follow_up}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {plan.closing_questions && plan.closing_questions.length > 0 && (
                <View className="mb-5">
                  <Text className="block text-sm font-semibold text-stone-700 mb-2">收尾问题</Text>
                  <View className="space-y-2">
                    {plan.closing_questions.map((q, i) => (
                      <View key={i} className="flex items-start gap-2">
                        <Text className="block text-sm text-stone-400 flex-shrink-0">{i + 1}.</Text>
                        <Text className="block text-sm text-stone-700">{q}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {plan.tips && typeof plan.tips === 'object' && !Array.isArray(plan.tips) && (
                <View className="mb-2">
                  <Text className="block text-sm font-semibold text-stone-700 mb-2">追问锦囊</Text>
                  <Text className="block text-xs text-stone-400 mb-3">
                    不是背出来的，是听老人说的时候现抓的
                  </Text>
                  {renderTipsCategory('人物追问', plan.tips.people)}
                  {renderTipsCategory('时间追问', plan.tips.time)}
                  {renderTipsCategory('地点追问', plan.tips.place)}
                  {renderTipsCategory('做法追问', plan.tips.practice)}
                  {renderTipsCategory('变化追问', plan.tips.change)}
                  {renderTipsCategory('方言追问', plan.tips.dialect)}
                  {plan.tips.special && plan.tips.special.length > 0 && (
                    <View className="mt-3 pt-3 border-t border-stone-100">
                      <Text className="block text-xs font-medium text-stone-600 mb-1">特殊场景</Text>
                      {renderTipsCategory('', plan.tips.special)}
                    </View>
                  )}
                </View>
              )}

              {plan.tips && Array.isArray(plan.tips) && plan.tips.length > 0 && (
                <View className="mb-2">
                  <Text className="block text-sm font-semibold text-stone-700 mb-2">追问锦囊</Text>
                  <View className="space-y-1">
                    {plan.tips.map((tip, i) => (
                      <Text key={i} className="block text-xs text-stone-600">· {tip}</Text>
                    ))}
                  </View>
                </View>
              )}
            </CardContent>
          </Card>
        </View>
      )}

      {/* 生成前对话弹窗 */}
      {showGenerateDialog && (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowGenerateDialog(false)}
        >
          <View
            className="bg-white rounded-2xl w-11/12 max-h-4/5 overflow-auto"
            style={{ padding: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Text className="block text-lg font-bold text-stone-800 mb-4">
              生成采访问题
            </Text>

            {subtopics.length > 0 && (
              <View className="mb-4">
                <Text className="block text-sm font-medium text-stone-700 mb-2">
                  针对哪个子话题？（可选）
                </Text>
                <View className="flex flex-wrap gap-2">
                  <View
                    className={`px-3 py-2 rounded-lg border cursor-pointer ${
                      !selectedSubtopicId
                        ? 'bg-amber-100 border-amber-400 text-amber-800'
                        : 'bg-white border-stone-200 text-stone-600'
                    }`}
                    onClick={() => setSelectedSubtopicId('')}
                  >
                    <Text className="block text-sm">整个话题</Text>
                  </View>
                  {subtopics.map((sub) => (
                    <View
                      key={sub.id}
                      className={`px-3 py-2 rounded-lg border cursor-pointer ${
                        selectedSubtopicId === sub.id
                          ? 'bg-amber-100 border-amber-400 text-amber-800'
                          : 'bg-white border-stone-200 text-stone-600'
                      }`}
                      onClick={() => setSelectedSubtopicId(sub.id)}
                    >
                      <Text className="block text-sm">
                        {sub.icon || '📌'} {sub.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View className="mb-4">
              <Text className="block text-sm font-medium text-stone-700 mb-2">
                有什么具体要求？（可选）
              </Text>
              <Text className="block text-xs text-stone-400 mb-2">
                比如：重点关注某个方面、问题风格要更口语化、想问某个特定的人等
              </Text>
              <View className="bg-stone-50 rounded-xl" style={{ padding: '12px' }}>
                <Textarea
                  style={{ width: '100%', minHeight: '100px', backgroundColor: 'transparent' }}
                  placeholder="告诉我你想重点问什么，或者有什么特别的要求..."
                  value={generateRequirements}
                  onInput={(e) => setGenerateRequirements(e.detail.value)}
                  maxlength={500}
                />
              </View>
            </View>

            <View style={{ display: 'flex', gap: '12px' }}>
              <View style={{ flex: 1 }}>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowGenerateDialog(false)}
                >
                  <Text>取消</Text>
                </Button>
              </View>
              <View style={{ flex: 2 }}>
                <Button
                  className="w-full bg-amber-700 hover:bg-amber-800 text-white"
                  onClick={handleConfirmGenerate}
                  disabled={generating}
                >
                  <Text>{generating ? 'AI 正在思考...' : '开始生成'}</Text>
                </Button>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default InterviewPlanPage
