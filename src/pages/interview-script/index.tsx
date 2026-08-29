import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Network } from '@/network'
import { ClipboardList, ChevronDown, ChevronUp, ArrowLeft, Pencil, Trash2 } from 'lucide-react-taro'

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

  const [scripts, setScripts] = useState<InterviewScript[]>([])
  const [selectedScript, setSelectedScript] = useState<InterviewScript | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set())
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editQuestions, setEditQuestions] = useState<Array<{ question: string; intent?: string; follow_up?: string[] }>>([])

  useEffect(() => {
    if (topicId) {
      loadScripts()
    }
  }, [topicId])

  const loadScripts = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/interview-scripts/topic/${topicId}`,
        method: 'GET'
      })
      console.log('Load scripts response:', res.data)
      if (res.data?.code === 200 && res.data?.data) {
        const scriptList = res.data.data as InterviewScript[]
        setScripts(scriptList)
        // Auto-select the latest script
        if (scriptList.length > 0 && !selectedScript) {
          setSelectedScript(scriptList[0])
        }
      }
    } catch (error) {
      console.error('Load scripts error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Always show detail view with version switcher if multiple versions
  const currentScript = selectedScript || (scripts.length > 0 ? scripts[0] : null)

  const toggleQuestion = (index: number) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedQuestions(newExpanded)
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}月${day}日 ${hours}:${minutes}`
  }

  const startEdit = () => {
    if (currentScript) {
      setEditTitle(currentScript.title || '')
      setEditQuestions(currentScript.selected_questions || [])
      setEditing(true)
    }
  }

  const saveEdit = async () => {
    if (!currentScript) return
    try {
      const res = await Network.request({
        url: `/api/interview-scripts/${currentScript.id}`,
        method: 'PUT',
        data: {
          title: editTitle,
          selected_questions: editQuestions
        }
      })
      if (res.data?.code === 200) {
        Taro.showToast({ title: '保存成功', icon: 'success' })
        setEditing(false)
        loadScripts()
      }
    } catch (error) {
      console.error('Save error:', error)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }

  const deleteScript = async (id: string) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？'
    })
    if (!res.confirm) return

    try {
      const deleteRes = await Network.request({
        url: `/api/interview-scripts/${id}`,
        method: 'DELETE'
      })
      if (deleteRes.data?.code === 200) {
        Taro.showToast({ title: '删除成功', icon: 'success' })
        if (selectedScript?.id === id) {
          setSelectedScript(null)
        }
        loadScripts()
      }
    } catch (error) {
      console.error('Delete error:', error)
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  const updateQuestion = (index: number, field: string, value: string) => {
    const newQuestions = [...editQuestions]
    newQuestions[index] = { ...newQuestions[index], [field]: value }
    setEditQuestions(newQuestions)
  }

  const addQuestion = () => {
    setEditQuestions([...editQuestions, { question: '', intent: '', follow_up: [] }])
  }

  const removeQuestion = (index: number) => {
    setEditQuestions(editQuestions.filter((_, i) => i !== index))
  }

  const goBack = () => {
    Taro.navigateBack()
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-stone-50 p-4">
        <View className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </View>
      </View>
    )
  }

  // Show detail view - with version switcher at top if multiple versions
  if (currentScript) {
    return (
      <View className="min-h-screen bg-stone-50 pb-8">
        {/* Header */}
        <View className="bg-white border-b border-stone-200 sticky top-0 z-10">
          <View className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <View className="flex items-center gap-2" onClick={goBack}>
              <ArrowLeft size={20} color="#78716c" />
              <Text className="text-sm text-stone-600">返回</Text>
            </View>
            <View className="flex items-center gap-2">
              {!editing ? (
                <Button variant="ghost" size="sm" onClick={startEdit}>
                  <Pencil size={16} className="mr-1" color="#78716c" />
                  <Text className="text-xs text-stone-600">编辑</Text>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                    <Text className="text-xs text-stone-600">取消</Text>
                  </Button>
                  <Button size="sm" onClick={saveEdit}>
                    <Text className="text-xs text-white">保存</Text>
                  </Button>
                </>
              )}
            </View>
          </View>
        </View>

        <View className="max-w-2xl mx-auto p-4">
          {/* Title */}
          {!editing ? (
            <View className="mb-4">
              <Text className="block text-lg font-semibold text-stone-800">
                {currentScript.title || '采访稿'}
              </Text>
              <Text className="block text-xs text-stone-400 mt-1">
                {formatDateTime(currentScript.created_at)}
              </Text>
              {/* Version switcher */}
              {scripts.length > 1 && (
                <View className="flex flex-wrap gap-2 mt-3">
                  {scripts.map((script, index) => (
                    <View
                      key={script.id}
                      className={`px-3 py-1 rounded-full text-xs cursor-pointer ${
                        script.id === currentScript.id
                          ? 'bg-stone-800 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                      onClick={() => setSelectedScript(script)}
                    >
                      {index === 0 ? '最新' : `v${scripts.length - index}`}
                      <Text className="ml-1 text-xs opacity-70">
                        {new Date(script.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View className="mb-4">
              <Input
                value={editTitle}
                onInput={(e) => setEditTitle(e.detail.value)}
                placeholder="采访稿标题"
                className="text-lg font-semibold"
              />
            </View>
          )}

          {/* Questions */}
          {!editing ? (
            <Card className="border-stone-200 shadow-sm">
              <CardContent className="p-4">
                <Text className="block text-sm font-medium text-stone-700 mb-3">
                  核心问题 ({currentScript.selected_questions.length})
                </Text>
                <View className="space-y-3">
                  {currentScript.selected_questions.map((q, idx) => (
                    <View key={idx} className="border-b border-stone-100 last:border-0 pb-3 last:pb-0">
                      <View 
                        className="flex items-start gap-2"
                        onClick={() => toggleQuestion(idx)}
                      >
                        <Text className="text-sm text-stone-800 flex-1">
                          {idx + 1}. {q.question}
                        </Text>
                        {(q.intent || (q.follow_up && q.follow_up.length > 0)) && (
                          expandedQuestions.has(idx) ? (
                            <ChevronUp size={16} color="#a8a29e" />
                          ) : (
                            <ChevronDown size={16} color="#a8a29e" />
                          )
                        )}
                      </View>
                      {expandedQuestions.has(idx) && (
                        <View className="mt-2 pl-6 space-y-2">
                          {q.intent && (
                            <View className="bg-stone-50 rounded-lg p-2">
                              <Text className="block text-xs text-stone-500">
                                <Text className="text-stone-600 font-medium">意图：</Text>
                                {q.intent}
                              </Text>
                            </View>
                          )}
                          {q.follow_up && q.follow_up.length > 0 && (
                            <View className="bg-stone-50 rounded-lg p-2">
                              <Text className="block text-xs text-stone-600 font-medium mb-1">追问：</Text>
                              {q.follow_up.map((f, fIdx) => (
                                <Text key={fIdx} className="block text-xs text-stone-500">
                                  • {f}
                                </Text>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-stone-200 shadow-sm">
              <CardContent className="p-4">
                <View className="flex items-center justify-between mb-3">
                  <Text className="text-sm font-medium text-stone-700">
                    核心问题 ({editQuestions.length})
                  </Text>
                  <Button variant="ghost" size="sm" onClick={addQuestion}>
                    <Text className="text-xs text-stone-600">+ 添加</Text>
                  </Button>
                </View>
                <View className="space-y-3">
                  {editQuestions.map((q, idx) => (
                    <View key={idx} className="border border-stone-200 rounded-lg p-3">
                      <View className="flex items-start gap-2 mb-2">
                        <Text className="text-sm text-stone-600 mt-1">{idx + 1}.</Text>
                        <Textarea
                          value={q.question}
                          onInput={(e) => updateQuestion(idx, 'question', e.detail.value)}
                          placeholder="输入问题"
                          className="flex-1 text-sm"
                          style={{ minHeight: '60px' }}
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeQuestion(idx)}>
                          <Trash2 size={14} color="#ef4444" />
                        </Button>
                      </View>
                      <Input
                        value={q.intent || ''}
                        onInput={(e) => updateQuestion(idx, 'intent', e.detail.value)}
                        placeholder="意图（可选）"
                        className="text-xs"
                      />
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          )}
        </View>
      </View>
    )
  }

  // List view - show all scripts
  return (
    <View className="min-h-screen bg-stone-50 pb-8">
      {/* Header */}
      <View className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <View className="max-w-2xl mx-auto px-4 py-3">
          <Text className="block text-base font-semibold text-stone-800">采访稿</Text>
        </View>
      </View>

      <View className="max-w-2xl mx-auto p-4">
        {scripts.length === 0 ? (
          <Card className="border-stone-200 shadow-sm">
            <CardContent className="p-8 text-center">
              <View className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                <ClipboardList size={24} color="#a8a29e" />
              </View>
              <Text className="block text-sm text-stone-600 mb-1">暂无采访稿</Text>
              <Text className="block text-xs text-stone-400">
                在采访策划页选择问题后，采访稿会自动生成
              </Text>
            </CardContent>
          </Card>
        ) : (
          <View className="space-y-3">
            {scripts.map((script, index) => (
              <Card 
                key={script.id} 
                className="border-stone-200 shadow-sm"
                onClick={() => setSelectedScript(script)}
              >
                <CardContent className="p-4">
                  <View className="flex items-start justify-between">
                    <View className="flex-1">
                      <View className="flex items-center gap-2 mb-1">
                        <Text className="text-sm font-medium text-stone-800">
                          {script.title || '采访稿'}
                        </Text>
                        {index === 0 && (
                          <Badge variant="default" className="text-xs">最新</Badge>
                        )}
                      </View>
                      <View className="flex items-center gap-3">
                        <Text className="text-xs text-stone-400">
                          {formatDateTime(script.created_at)}
                        </Text>
                        <Text className="text-xs text-stone-400">
                          {script.selected_questions.length} 个问题
                        </Text>
                      </View>
                    </View>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteScript(script.id)
                      }}
                    >
                      <Trash2 size={14} color="#ef4444" />
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
