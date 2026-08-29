import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Network } from '@/network'
import { getStoredOperatorIdentity, roleCanDelete, roleCanEdit, type OperatorRole } from '@/identity'
import { BookOpen, Lightbulb, RefreshCw, Plus, FileText, Trash2, FolderOpen } from 'lucide-react-taro'

interface InterviewPlan {
  id: string
  context_summary: string | null
  adult_questions: string[] | null
  child_questions: string[] | null
  tips: string[] | null
}

interface Material {
  id: string
  source: string
  title: string
  content: string
  tags: string[] | null
  url: string | null
  created_by_name?: string | null
  updated_by_name?: string | null
  created_at: string
}

const InterviewPlanPage = () => {
  const router = useRouter()
  const topicId = router.params.topicId || ''

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
  const [operatorRole, setOperatorRole] = useState<OperatorRole>(getStoredOperatorIdentity().role)

  // 加载资料列表
  useEffect(() => {
    if (topicId) {
      loadMaterials()
    }
  }, [topicId])

  useDidShow(() => {
    setOperatorRole(getStoredOperatorIdentity().role)
  })

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
    if (!roleCanEdit(operatorRole)) {
      Taro.showToast({ title: '当前身份只能查看', icon: 'none' })
      return
    }
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
    if (!roleCanDelete(operatorRole)) {
      Taro.showToast({ title: '只有管理员可以删除资料', icon: 'none' })
      return
    }
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

  const handleGenerate = async () => {
    if (!topicId) return
    if (!roleCanEdit(operatorRole)) {
      Taro.showToast({ title: '当前身份只能查看', icon: 'none' })
      return
    }
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
              {roleCanEdit(operatorRole) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddMaterial(!showAddMaterial)}
                >
                  <Plus size={14} color="#B45309" className="mr-1" />
                  <Text className="text-xs">添加资料</Text>
                </Button>
              )}
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
                        {roleCanDelete(operatorRole) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMaterial(m.id)}
                          >
                            <Trash2 size={14} color="#9CA3AF" />
                          </Button>
                        )}
                      </View>
                    </View>
                    <Text className="block text-xs text-stone-400 mb-1 ml-5">
                      添加者：{m.created_by_name || '待补充'}
                      {m.updated_by_name ? ` / 最近编辑：${m.updated_by_name}` : ''}
                    </Text>
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
                AI 会根据话题背景和资料库，生成大人版和孩子版的采访问题
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
            <Text className="block text-sm text-stone-500 mb-6">正在分析话题背景和资料，生成问题清单</Text>
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
              className="w-full border-stone-200"
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
