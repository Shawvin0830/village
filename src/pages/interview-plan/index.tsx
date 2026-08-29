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
import { BookOpen, Lightbulb, RefreshCw, Plus, FileText, Trash2, FolderOpen, Search, Globe, Download, ChevronDown, ChevronUp, FileSearch, BookOpenCheck, Save, Send, MessageCircle, ShieldCheck } from 'lucide-react-taro'

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

  // 资料库状态
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(false)
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [newMaterialTitle, setNewMaterialTitle] = useState('')
  const [newMaterialContent, setNewMaterialContent] = useState('')
  const [newMaterialTags, setNewMaterialTags] = useState('')
  const [addingMaterial, setAddingMaterial] = useState(false)

  // AI 搜索状态
  const [showAISearch, setShowAISearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [savingIndex, setSavingIndex] = useState<number | null>(null)

  // 话题名称（用于搜索上下文）
  const [topicName, setTopicName] = useState('')

  // 专题研究状态
  const [showResearch, setShowResearch] = useState(false)
  const [researching, setResearching] = useState(false)
  const [researchDoc, setResearchDoc] = useState<ResearchDocument | null>(null)
  const [researchFocus, setResearchFocus] = useState('')

  // 讨论调整状态
  const [feedback, setFeedback] = useState('')
  const [refining, setRefining] = useState(false)
  const [showDiscussion, setShowDiscussion] = useState(false)

  // 加载话题名称和资料列表
  useEffect(() => {
    if (topicId) {
      loadMaterials()
      loadTopicName()
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

  const handleAddMaterial = async () => {
    if (!newMaterialTitle.trim() || !newMaterialContent.trim()) {
      Taro.showToast({ title: '请填写标题和内容', icon: 'none' })
      return
    }

    try {
      setAddingMaterial(true)
      const tags = newMaterialTags
        .split(/[,，、\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)

      const res = await Network.request({
        url: '/api/materials',
        method: 'POST',
        data: {
          topicId,
          source: 'manual',
          title: newMaterialTitle.trim(),
          content: newMaterialContent.trim(),
          tags: tags.length > 0 ? tags : null,
        },
      })
      console.log('Add material response:', res.data)

      if (res.data?.code === 200) {
        Taro.showToast({ title: '资料已添加', icon: 'success' })
        setNewMaterialTitle('')
        setNewMaterialContent('')
        setNewMaterialTags('')
        setShowAddMaterial(false)
        loadMaterials()
      }
    } catch (err) {
      console.error('添加资料失败:', err)
      Taro.showToast({ title: '添加失败，请重试', icon: 'none' })
    } finally {
      setAddingMaterial(false)
    }
  }

  const handleDeleteMaterial = async (id: string) => {
    try {
      const res = await Network.request({
        url: `/api/materials/${id}`,
        method: 'DELETE',
      })
      console.log('Delete material response:', res.data)
      if (res.data?.code === 200) {
        Taro.showToast({ title: '已删除', icon: 'success' })
        loadMaterials()
      }
    } catch (err) {
      console.error('删除资料失败:', err)
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
        setShowDiscussion(true)
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
        setFeedback('')
        Taro.showToast({ title: '已根据反馈更新', icon: 'success' })
      }
    } catch (err) {
      console.error('迭代优化失败:', err)
      Taro.showToast({ title: '更新失败，请重试', icon: 'none' })
    } finally {
      setRefining(false)
    }
  }

  const handleFinalize = async () => {
    if (!plan?.id) return
    const modal = await Taro.showModal({ title: '确认定稿', content: '定稿后将作为最终采访问题清单，确定吗？' })
    if (!modal.confirm) return
    try {
      const res = await Network.request({
        url: `/api/interview-plans/${plan.id}/finalize`,
        method: 'POST',
      })
      console.log('Finalize plan response:', res.data)
      const data = res.data?.data
      if (data) {
        setPlan(data)
        Taro.showToast({ title: '已定稿', icon: 'success' })
      }
    } catch (err) {
      console.error('定稿失败:', err)
      Taro.showToast({ title: '定稿失败，请重试', icon: 'none' })
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'manual':
        return '手动录入'
      case 'ai_search':
        return 'AI搜索'
      case 'internet':
        return '互联网'
      default:
        return source
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'manual':
        return 'bg-amber-100 text-amber-800'
      case 'ai_search':
        return 'bg-blue-100 text-blue-800'
      case 'internet':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-stone-100 text-stone-800'
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
          添加资料，AI 帮你生成采访问题清单和追问锦囊
        </Text>
      </View>

      {/* 生成按钮（未生成时显示在顶部） */}
      {!plan && !loading && (
        <View className="px-4 mb-4">
          <Card className="border-stone-100 bg-white">
            <CardContent className="p-6 flex flex-col items-center">
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
                  <Text className="text-white">{generating ? 'AI 正在思考...' : '生成采访问题'}</Text>
                </Button>
              </View>
            </CardContent>
          </Card>
        </View>
      )}

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

      {/* 资料库 */}
      <View className="px-4 mb-4">
        <Card className="border-stone-100 bg-white">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <View className="flex items-center gap-2">
                <FolderOpen size={18} color="#B45309" />
                <Text className="block text-base font-semibold text-stone-800">
                  资料库
                </Text>
                <Badge className="bg-stone-100 text-stone-600 text-xs">
                  {materials.length}
                </Badge>
              </View>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddMaterial(!showAddMaterial)}
              >
                <Plus size={14} color="#B45309" className="mr-1" />
                <Text className="text-xs">添加资料</Text>
              </Button>
            </View>

            {/* 添加资料表单 */}
            {showAddMaterial && (
              <View className="mb-4 p-3 bg-stone-50 rounded-lg space-y-3">
                <View>
                  <Text className="block text-xs text-stone-500 mb-1">标题</Text>
                  <View className="bg-white rounded-lg px-3 py-2">
                    <Input
                      className="w-full bg-transparent"
                      placeholder="如：村志摘录、张爷爷的采访笔记..."
                      value={newMaterialTitle}
                      onInput={(e) => setNewMaterialTitle(e.detail.value)}
                    />
                  </View>
                </View>
                <View>
                  <Text className="block text-xs text-stone-500 mb-1">内容</Text>
                  <View className="bg-white rounded-lg p-3">
                    <Textarea
                      style={{ width: '100%', minHeight: '120px', backgroundColor: 'transparent' }}
                      placeholder="粘贴或输入你查到的资料内容..."
                      value={newMaterialContent}
                      onInput={(e) => setNewMaterialContent(e.detail.value)}
                    />
                  </View>
                </View>
                <View>
                  <Text className="block text-xs text-stone-500 mb-1">
                    标签（可选，用逗号分隔）
                  </Text>
                  <View className="bg-white rounded-lg px-3 py-2">
                    <Input
                      className="w-full bg-transparent"
                      placeholder="如：历史,建筑,木雕"
                      value={newMaterialTags}
                      onInput={(e) => setNewMaterialTags(e.detail.value)}
                    />
                  </View>
                </View>
                <View className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddMaterial(false)
                      setNewMaterialTitle('')
                      setNewMaterialContent('')
                      setNewMaterialTags('')
                    }}
                  >
                    <Text className="text-xs">取消</Text>
                  </Button>
                  <Button
                    className="bg-amber-700 hover:bg-amber-800 text-white flex-1"
                    size="sm"
                    onClick={handleAddMaterial}
                    disabled={addingMaterial}
                  >
                    <Text className="text-xs">{addingMaterial ? '添加中...' : '确认添加'}</Text>
                  </Button>
                </View>
              </View>
            )}

            {/* 资料列表 */}
            {materialsLoading ? (
              <View className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </View>
            ) : materials.length === 0 ? (
              <View className="py-4 text-center">
                <Text className="block text-2xl mb-2">📂</Text>
                <Text className="block text-sm text-stone-500">
                  还没有资料，点击上方「添加资料」录入你查到的信息
                </Text>
                <Text className="block text-xs text-stone-400 mt-1">
                  AI 生成策划时会参考这些资料
                </Text>
              </View>
            ) : (
              <View className="space-y-2">
                {materials.map((m) => (
                  <View
                    key={m.id}
                    className="p-3 bg-stone-50 rounded-lg"
                  >
                    <View className="flex items-start justify-between mb-1">
                      <View className="flex items-center gap-2 flex-1">
                        <FileText size={14} color="#78716C" />
                        <Text className="block text-sm font-medium text-stone-800 flex-1">
                          {m.title}
                        </Text>
                      </View>
                      <View className="flex items-center gap-1">
                        <Badge className={`text-xs ${getSourceColor(m.source)}`}>
                          {getSourceLabel(m.source)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMaterial(m.id)}
                        >
                          <Trash2 size={14} color="#9CA3AF" />
                        </Button>
                      </View>
                    </View>
                    <Text className="block text-xs text-stone-500 line-clamp-2 ml-5">
                      {m.content}
                    </Text>
                    {m.tags && Array.isArray(m.tags) && m.tags.length > 0 && (
                      <View className="flex flex-wrap gap-1 mt-2 ml-5">
                        {m.tags.map((tag, i) => (
                          <Badge key={i} className="bg-stone-200 text-stone-600 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* AI 搜索 */}
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
                {/* 搜索输入 */}
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
                    {/* 搜索摘要 */}
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
                            {/* 标题行 */}
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

                            {/* 一句话摘要 */}
                            {m.structuredData.summary && (
                              <Text className="block text-xs text-stone-500 mt-2 ml-5 italic">
                                {m.structuredData.summary}
                              </Text>
                            )}

                            {/* 展开详情 */}
                            {expandedCard === i && (
                              <View className="mt-3 ml-5 space-y-2">
                                {/* 正文 */}
                                <Text className="block text-xs text-stone-600 leading-relaxed">
                                  {m.content}
                                </Text>

                                {/* 关键事实 */}
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

                                {/* 标签 */}
                                {m.tags.length > 0 && (
                                  <View className="flex flex-wrap gap-1">
                                    {m.tags.map((tag, ti) => (
                                      <Badge key={ti} className="bg-stone-200 text-stone-600 text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </View>
                                )}

                                {/* 相关链接 */}
                                {m.url && (
                                  <Text className="block text-xs text-blue-600">
                                    来源: {m.url}
                                  </Text>
                                )}
                              </View>
                            )}

                            {/* 保存按钮 */}
                            <View className="mt-2 ml-5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-lime-300 text-lime-800"
                                onClick={() => handleSaveMaterial(m, i)}
                                disabled={savingIndex === i}
                              >
                                <Download size={12} color="#4D7C0F" className="mr-1" />
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
          </CardContent>
        </Card>
      </View>

      {/* 专题研究 */}
      <View className="px-4 mb-4">
        <Card className="border-stone-100 bg-white">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <View className="flex items-center gap-2">
                <FileSearch size={18} color="#B45309" />
                <Text className="block text-base font-semibold text-stone-800">
                  AI 专题研究
                </Text>
              </View>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResearch(!showResearch)}
              >
                <Text className="text-xs">{showResearch ? '收起' : '开始'}</Text>
              </Button>
            </View>

            {showResearch && (
              <View className="space-y-3">
                <Text className="block text-xs text-stone-500">
                  AI 会从多个维度搜索网络权威资料，整理成一篇可读的专题研究文档
                </Text>

                {/* 关注方向（可选） */}
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

                {/* 研究进行中 */}
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

                {/* 研究文档展示 */}
                {researchDoc && !researching && (
                  <View className="space-y-3">
                    {/* 文档标题 */}
                    <View className="flex items-center gap-2">
                      <BookOpenCheck size={16} color="#166534" />
                      <Text className="block text-sm font-semibold text-stone-800 flex-1">
                        {researchDoc.title}
                      </Text>
                    </View>

                    {/* 文档正文 */}
                    <View className="p-3 bg-stone-50 rounded-lg">
                      <Text className="block text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                        {researchDoc.content}
                      </Text>
                    </View>

                    {/* 操作按钮 */}
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
          </CardContent>
        </Card>
      </View>

      {/* 策划结果 */}
      {plan && (
        <View className="px-4 space-y-4">
          {/* 定稿标识 */}
          {plan.status === 'final' && (
            <View className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
              <ShieldCheck size={18} color="#166534" />
              <Text className="block text-sm font-medium text-green-800">已定稿</Text>
              <Text className="block text-xs text-green-600 flex-1">此策划已确认为最终版本</Text>
            </View>
          )}

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

          {/* 选用维度 */}
          {plan.selected_dimensions && plan.selected_dimensions.length > 0 && (
            <Card className="border-stone-100 bg-white">
              <CardContent className="p-4">
                <Text className="block text-base font-semibold text-stone-800 mb-3">
                  🎯 选用维度
                </Text>
                <Text className="block text-xs text-stone-400 mb-3">
                  从10个采访镜头中选了这些，像调镜头一样远近高低各不同
                </Text>
                <View className="flex flex-wrap gap-2">
                  {plan.selected_dimensions.map((dim, i) => (
                    <Badge key={i} className="bg-amber-50 text-amber-800 border-amber-200">
                      {dim}
                    </Badge>
                  ))}
                </View>
              </CardContent>
            </Card>
          )}

          {/* 热身问题 */}
          {plan.warmup_questions && plan.warmup_questions.length > 0 && (
            <Card className="border-stone-100 bg-white">
              <CardContent className="p-4">
                <Text className="block text-base font-semibold text-stone-800 mb-2">
                  ☕ 热身问题
                </Text>
                <Text className="block text-xs text-stone-400 mb-3">
                  让老人放松，知道「我随便聊聊就行」
                </Text>
                <View className="space-y-2">
                  {plan.warmup_questions.map((q, i) => (
                    <View key={i} className="flex items-start gap-2">
                      <Text className="block text-sm font-medium text-stone-500 mt-1 flex-shrink-0">
                        W{i + 1}.
                      </Text>
                      <Text className="block text-sm text-stone-700">{q}</Text>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          )}

          {/* 核心问题（按维度分组） */}
          {plan.core_questions && plan.core_questions.length > 0 && (
            <View className="space-y-3">
              <Text className="block text-base font-semibold text-stone-800 px-1">
                📝 核心问题
              </Text>
              {plan.core_questions.map((q, i) => (
                <Card key={i} className="border-stone-100 bg-white">
                  <CardContent className="p-4">
                    {/* 维度标签 */}
                    <View className="flex items-center gap-2 mb-3">
                      <Badge className="bg-amber-50 text-amber-800 border-amber-200">
                        {q.dimension}
                      </Badge>
                      <Text className="block text-xs text-stone-400">Q{i + 1}</Text>
                    </View>

                    {/* 大人版 */}
                    <View className="mb-3">
                      <Text className="block text-xs font-medium text-amber-700 mb-1">
                        🧑 大人备用版
                      </Text>
                      <Text className="block text-sm text-stone-700">{q.adult_version}</Text>
                    </View>

                    {/* 小孩版 */}
                    <View className="mb-3 p-3 bg-lime-50 rounded-lg">
                      <Text className="block text-xs font-medium text-lime-800 mb-1">
                        👧 小孩执行版
                      </Text>
                      <Text className="block text-sm text-stone-700">{q.child_version}</Text>
                    </View>

                    {/* 为什么问 */}
                    <View className="mb-2">
                      <Text className="block text-xs font-medium text-stone-500 mb-1">
                        为什么问这个
                      </Text>
                      <Text className="block text-xs text-stone-600 italic">{q.why_ask}</Text>
                    </View>

                    {/* 追问方向 */}
                    <View>
                      <Text className="block text-xs font-medium text-stone-500 mb-1">
                        追问方向
                      </Text>
                      <Text className="block text-xs text-stone-600">{q.follow_up}</Text>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          )}

          {/* 收尾问题 */}
          {plan.closing_questions && plan.closing_questions.length > 0 && (
            <Card className="border-stone-100 bg-white">
              <CardContent className="p-4">
                <Text className="block text-base font-semibold text-stone-800 mb-2">
                  🌅 收尾问题
                </Text>
                <Text className="block text-xs text-stone-400 mb-3">
                  意义 + 传承 + 寄语
                </Text>
                <View className="space-y-2">
                  {plan.closing_questions.map((q, i) => (
                    <View key={i} className="flex items-start gap-2">
                      <Text className="block text-sm font-medium text-stone-500 mt-1 flex-shrink-0">
                        {i + 1}.
                      </Text>
                      <Text className="block text-sm text-stone-700">{q}</Text>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          )}

          {/* 追问锦囊（分类展示） */}
          {plan.tips && typeof plan.tips === 'object' && !Array.isArray(plan.tips) && (
            <Card className="border-amber-100 bg-amber-50">
              <CardContent className="p-4">
                <View className="flex items-center gap-2 mb-3">
                  <Lightbulb size={18} color="#B45309" />
                  <Text className="block text-base font-semibold text-stone-800">
                    追问锦囊
                  </Text>
                </View>
                <Text className="block text-xs text-stone-500 mb-4">
                  不是背出来的，是听老人说的时候现抓的
                </Text>

                {/* 6类常规追问 */}
                {renderTipsCategory('👤 人物追问', plan.tips.people)}
                {renderTipsCategory('⏰ 时间追问', plan.tips.time)}
                {renderTipsCategory('📍 地点追问', plan.tips.place)}
                {renderTipsCategory('🔧 做法追问', plan.tips.practice)}
                {renderTipsCategory('🔄 变化追问', plan.tips.change)}
                {renderTipsCategory('🗣️ 方言追问', plan.tips.dialect)}

                {/* 3种特殊场景 */}
                {plan.tips.special && plan.tips.special.length > 0 && (
                  <View className="mt-4 pt-4 border-t border-amber-200">
                    <Text className="block text-sm font-semibold text-stone-800 mb-2">
                      ⚡ 特殊场景
                    </Text>
                    <View className="space-y-2">
                      {plan.tips.special.map((tip, i) => (
                        <View key={i} className="flex items-start gap-2">
                          <Text className="text-sm">💡</Text>
                          <Text className="block text-sm text-stone-700">{tip}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </CardContent>
            </Card>
          )}

          {/* 兼容旧版 tips 格式（数组） */}
          {plan.tips && Array.isArray(plan.tips) && plan.tips.length > 0 && (
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

          {/* 讨论调整区域 */}
          {plan.status !== 'final' && (
            <Card className="border-stone-200 bg-white">
              <CardContent className="p-4">
                <View className="flex items-center justify-between mb-3">
                  <View className="flex items-center gap-2">
                    <MessageCircle size={18} color="#B45309" />
                    <Text className="block text-base font-semibold text-stone-800">
                      讨论调整
                    </Text>
                  </View>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDiscussion(!showDiscussion)}
                  >
                    <Text className="text-xs">{showDiscussion ? '收起' : '展开'}</Text>
                  </Button>
                </View>

                {showDiscussion && (
                  <View className="space-y-3">
                    <Text className="block text-xs text-stone-500">
                      告诉 AI 你想怎么改，比如「孩子版问题太学术了」、「再加一个关于XX的问题」
                    </Text>
                    <View className="bg-stone-50 rounded-lg p-3">
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
                        <Text className="text-xs">{generating ? '重新生成中...' : '全部重来'}</Text>
                      </Button>
                    </View>
                  </View>
                )}
              </CardContent>
            </Card>
          )}

          {/* 确认定稿 */}
          {plan.status !== 'final' && (
            <View className="pt-2 pb-4">
              <Button
                className="w-full bg-green-800 hover:bg-green-900 text-white"
                onClick={handleFinalize}
              >
                <ShieldCheck size={16} color="#fff" className="mr-2" />
                <Text>确认定稿</Text>
              </Button>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

export default InterviewPlanPage
