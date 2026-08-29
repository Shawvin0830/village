import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Network } from '@/network'
import { ClipboardList, ChevronDown, ChevronUp, RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react-taro'

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
  const [currentScript, setCurrentScript] = useState<InterviewScript | null>(null)
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
        if (scriptList.length > 0) {
          setCurrentScript(scriptList[0])
          setEditTitle(scriptList[0].title || '')
          setEditQuestions(scriptList[0].selected_questions || [])
        }
      }
    } catch (error) {
      console.error('Load scripts error:', error)
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
      console.log('Save edit response:', res.data)
      if (res.data?.code === 200) {
        const updated = { ...currentScript, title: editTitle, selected_questions: editQuestions, updated_at: new Date().toISOString() }
        setCurrentScript(updated)
        setScripts(scripts.map(s => s.id === updated.id ? updated : s))
        setEditing(false)
        Taro.showToast({ title: '保存成功', icon: 'success' })
      }
    } catch (error) {
      console.error('Save edit error:', error)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }

  const deleteScript = async (id: string) => {
    try {
      const res = await Network.request({
        url: `/api/interview-scripts/${id}`,
        method: 'DELETE'
      })
      if (res.data?.code === 200) {
        setScripts(scripts.filter(s => s.id !== id))
        if (currentScript?.id === id) {
          setCurrentScript(null)
        }
        Taro.showToast({ title: '删除成功', icon: 'success' })
      }
    } catch (error) {
      console.error('Delete script error:', error)
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  const selectScript = (script: InterviewScript) => {
    setCurrentScript(script)
    setEditTitle(script.title || '')
    setEditQuestions(script.selected_questions || [])
    setEditing(false)
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

  if (scripts.length === 0) {
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

  const selectedQuestions = currentScript?.selected_questions || []
  const warmupQuestions = currentScript?.warmup_questions || []
  const closingQuestions = currentScript?.closing_questions || []

  return (
    <View className="min-h-screen bg-stone-50 pb-8">
      <ScrollView scrollY className="h-full">
        <View className="px-4 py-4">
          {/* 采访稿列表 */}
          {scripts.length > 1 && (
            <Card className="border-stone-200 bg-white shadow-sm mb-4">
              <CardContent className="p-4">
                <Text className="block text-sm font-semibold text-stone-800 mb-3">
                  历史版本 ({scripts.length})
                </Text>
                <View className="flex flex-col gap-2">
                  {scripts.map((s, index) => (
                    <View
                      key={s.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        currentScript?.id === s.id ? 'border-amber-500 bg-amber-50' : 'border-stone-200 bg-stone-50'
                      }`}
                      onClick={() => selectScript(s)}
                    >
                      <View className="flex-1">
                        <Text className="block text-sm font-medium text-stone-800">
                          {s.title || `采访稿 #${scripts.length - index}`}
                        </Text>
                        <Text className="block text-xs text-stone-500">
                          {formatDate(s.created_at)} · {(s.selected_questions || []).length} 个问题
                        </Text>
                      </View>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteScript(s.id)
                        }}
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </Button>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          )}

          {/* 当前采访稿 */}
          {currentScript && !editing && (
            <>
              {/* 采访稿信息 */}
              <Card className="border-amber-200 bg-amber-50 shadow-sm mb-4">
                <CardContent className="p-4">
                  <View className="flex items-center gap-3 mb-3">
                    <View className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <ClipboardList size={20} color="#B45309" />
                    </View>
                    <View className="flex-1">
                      <Text className="block text-base font-semibold text-stone-800">
                        {currentScript.title || '采访稿'}
                      </Text>
                      <Text className="block text-xs text-stone-500">
                        创建于 {formatDate(currentScript.created_at)}
                      </Text>
                    </View>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startEdit}
                    >
                      <Pencil size={16} color="#78716c" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadScripts}
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
                          <Text className="flex-1 text-sm text-stone-800">
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
                          <View className="mt-2 ml-6 pl-3 border-l-2 border-stone-200">
                            {q.intent && (
                              <View className="mb-2">
                                <Text className="block text-xs font-medium text-stone-600 mb-1">意图</Text>
                                <Text className="block text-xs text-stone-500">{q.intent}</Text>
                              </View>
                            )}
                            {q.follow_up && q.follow_up.length > 0 && (
                              <View>
                                <Text className="block text-xs font-medium text-stone-600 mb-1">追问</Text>
                                {q.follow_up.map((f, fi) => (
                                  <Text key={fi} className="block text-xs text-stone-500 mb-1">
                                    • {f}
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
            </>
          )}

          {/* 编辑模式 */}
          {currentScript && editing && (
            <Card className="border-amber-200 bg-white shadow-sm mb-4">
              <CardContent className="p-4">
                <Text className="block text-sm font-semibold text-stone-800 mb-3">
                  编辑采访稿
                </Text>
                <View className="mb-4">
                  <Text className="block text-xs text-stone-600 mb-1">标题</Text>
                  <Input
                    value={editTitle}
                    onInput={(e) => setEditTitle(e.detail.value)}
                    placeholder="采访稿标题"
                    className="w-full"
                  />
                </View>
                <View className="mb-4">
                  <Text className="block text-xs text-stone-600 mb-2">核心问题</Text>
                  {editQuestions.map((q, index) => (
                    <View key={index} className="mb-3 p-3 bg-stone-50 rounded-lg">
                      <View className="flex items-start gap-2 mb-2">
                        <Text className="text-xs text-stone-500 mt-1">{index + 1}.</Text>
                        <Textarea
                          value={q.question}
                          onInput={(e) => {
                            const newQuestions = [...editQuestions]
                            newQuestions[index] = { ...newQuestions[index], question: e.detail.value }
                            setEditQuestions(newQuestions)
                          }}
                          placeholder="问题内容"
                          className="flex-1 min-h-16"
                        />
                      </View>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={() => {
                          const newQuestions = editQuestions.filter((_, i) => i !== index)
                          setEditQuestions(newQuestions)
                        }}
                      >
                        <Text className="text-xs text-red-500">删除</Text>
                      </Button>
                    </View>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={() => {
                      setEditQuestions([...editQuestions, { question: '', intent: '', follow_up: [] }])
                    }}
                  >
                    <Plus size={14} color="#78716c" />
                    <Text className="text-xs text-stone-600 ml-1">添加问题</Text>
                  </Button>
                </View>
                <View className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-stone-300 text-stone-700"
                    onClick={() => setEditing(false)}
                  >
                    <Text className="text-sm">取消</Text>
                  </Button>
                  <Button
                    className="flex-1 bg-amber-700 text-white"
                    onClick={saveEdit}
                  >
                    <Text className="text-sm">保存</Text>
                  </Button>
                </View>
              </CardContent>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
