import { View, Text } from '@tarojs/components'
import { useState, useCallback } from 'react'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Network } from '@/network'
import { Plus, Pencil, Trash2, UserRound, ArrowLeft, Quote } from 'lucide-react-taro'

interface QuoteItem {
  id: string
  quote: string
  summary: string
  full_interview: string
  created_at: string | null
  interviewee: {
    id: string
    name: string
    age?: string | null
    occupation?: string | null
    role?: string | null
  }
}

interface FormState {
  intervieweeName: string
  age: string
  occupation: string
  role: string
  quote: string
  fullInterview: string
}

const EMPTY_FORM: FormState = {
  intervieweeName: '',
  age: '',
  occupation: '',
  role: '',
  quote: '',
  fullInterview: '',
}

const InterviewManagePage = () => {
  const router = useRouter()
  const topicId = router.params.topicId || ''
  const subtopicId = router.params.subtopicId || ''
  const subName = decodeURIComponent(router.params.subName || '')

  const [quotes, setQuotes] = useState<QuoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const fetchQuotes = useCallback(async () => {
    if (!topicId || !subtopicId) return
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/topics/${topicId}/subtopics/${subtopicId}/quotes`,
      })
      console.log('Fetch quotes:', res.data)
      const data = res.data?.data
      if (Array.isArray(data)) {
        setQuotes(data)
      }
    } catch (err) {
      console.error('获取采访记录失败:', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [topicId, subtopicId])

  useLoad(() => {
    fetchQuotes()
  })

  const openAddForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEditForm = (item: QuoteItem) => {
    setEditingId(item.id)
    setForm({
      intervieweeName: item.interviewee.name || '',
      age: item.interviewee.age || '',
      occupation: item.interviewee.occupation || '',
      role: item.interviewee.role || '',
      quote: item.quote || '',
      fullInterview: item.full_interview || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.intervieweeName.trim()) {
      Taro.showToast({ title: '请输入受访人姓名', icon: 'none' })
      return
    }
    if (!form.fullInterview.trim()) {
      Taro.showToast({ title: '请输入采访内容', icon: 'none' })
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        interviewee_name: form.intervieweeName.trim(),
        age: form.age.trim() || null,
        occupation: form.occupation.trim() || null,
        role: form.role.trim() || null,
        quote: form.quote.trim() || null,
        full_interview: form.fullInterview.trim(),
      }

      if (editingId) {
        const res = await Network.request({
          url: `/api/topics/${topicId}/subtopics/${subtopicId}/quotes/${editingId}`,
          method: 'PUT',
          data: payload,
        })
        console.log('Update quote:', res.data)
        if (res.data?.code === 200) {
          Taro.showToast({ title: '更新成功', icon: 'success' })
        }
      } else {
        const res = await Network.request({
          url: `/api/topics/${topicId}/subtopics/${subtopicId}/quotes`,
          method: 'POST',
          data: payload,
        })
        console.log('Create quote:', res.data)
        if (res.data?.code === 200) {
          Taro.showToast({ title: '添加成功', icon: 'success' })
        }
      }
      setShowForm(false)
      setForm(EMPTY_FORM)
      setEditingId(null)
      fetchQuotes()
    } catch (err) {
      console.error('提交失败:', err)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (quoteId: string) => {
    const modal = await Taro.showModal({ title: '确认删除', content: '删除后无法恢复，确定要删除吗？' })
    if (!modal.confirm) return
    try {
      const res = await Network.request({
        url: `/api/topics/${topicId}/subtopics/${subtopicId}/quotes/${quoteId}`,
        method: 'DELETE',
      })
      console.log('Delete quote:', res.data)
      if (res.data?.code === 200) {
        Taro.showToast({ title: '已删除', icon: 'success' })
        fetchQuotes()
      }
    } catch (err) {
      console.error('删除失败:', err)
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  const compactDate = (value?: string | null) => {
    if (!value) return '时间待补充'
    return new Date(value).toLocaleDateString('zh-CN')
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-stone-50 px-4 pt-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-24 w-full mb-3" />
        <Skeleton className="h-24 w-full mb-3" />
        <Skeleton className="h-20 w-full" />
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-stone-50 pb-8">
      {/* 顶部标题 */}
      <View className="px-4 pt-6 pb-3">
        <Button size="sm" variant="ghost" className="mb-2" onClick={() => Taro.navigateBack()}>
          <ArrowLeft size={16} color="#57534E" className="mr-1" />
          <Text>返回</Text>
        </Button>
        <View className="flex items-center justify-between">
          <View className="flex-1">
            <View className="flex items-center mb-1">
              <Pencil size={20} color="#B45309" className="mr-2" />
              <Text className="block text-xl font-bold text-stone-800">采访记录</Text>
            </View>
            <Text className="block text-sm text-stone-500">{subName}</Text>
          </View>
          <Button size="sm" className="bg-amber-700 text-white" onClick={openAddForm}>
            <Plus size={16} color="#ffffff" className="mr-1" />
            <Text>新增</Text>
          </Button>
        </View>
      </View>

      {/* 列表 */}
      <View className="px-4">
        {quotes.length === 0 ? (
          <Card className="border-stone-100 bg-white">
            <CardContent className="p-8 flex flex-col items-center">
              <Text className="block text-3xl mb-3">📝</Text>
              <Text className="block text-sm text-stone-500 text-center mb-4">
                还没有采访记录，点击上方&ldquo;新增&rdquo;开始录入
              </Text>
              <Button variant="outline" className="border-amber-200 text-amber-700" onClick={openAddForm}>
                <Plus size={16} color="#B45309" className="mr-1" />
                <Text>添加第一条记录</Text>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <View className="space-y-3">
            {quotes.map((item) => (
              <Card key={item.id} className="border-stone-100 bg-white shadow-sm">
                <CardContent className="p-4">
                  {/* 受访人信息 */}
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
                    <View className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-stone-500"
                        onClick={() => openEditForm(item)}
                      >
                        <Pencil size={16} color="#78716C" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-stone-400"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 size={16} color="#B45309" />
                      </Button>
                    </View>
                  </View>

                  {/* 采访摘录 */}
                  {item.quote && item.quote !== '暂无摘录' && (
                    <View className="mb-3">
                      <View className="flex items-center mb-1">
                        <Quote size={14} color="#B45309" className="mr-1" />
                        <Text className="text-xs text-stone-500">摘录</Text>
                      </View>
                      <View className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                        <Text className="block text-sm text-amber-900 leading-relaxed">
                          {"\u201C"}{item.quote}{"\u201D"}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* 完整采访 */}
                  <View>
                    <Text className="block text-xs text-stone-500 mb-1">完整内容</Text>
                    <Text className="block text-sm text-stone-600 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                      {item.full_interview}
                    </Text>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* 新增/编辑弹窗 */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-white max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <Text>{editingId ? '编辑采访记录' : '新增采访记录'}</Text>
            </DialogTitle>
            <DialogDescription>
              <Text>{editingId ? '修改采访记录信息' : '录入一条新的采访记录'}</Text>
            </DialogDescription>
          </DialogHeader>

          <View className="space-y-4 mt-4">
            {/* 受访人姓名 */}
            <View>
              <Text className="block text-sm font-medium text-stone-700 mb-2">受访人姓名 *</Text>
              <View className="bg-stone-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="如：张大爷"
                  value={form.intervieweeName}
                  onInput={(e) => setForm({ ...form, intervieweeName: e.detail.value })}
                />
              </View>
            </View>

            {/* 年龄 + 职业 */}
            <View className="flex gap-3">
              <View className="flex-1">
                <Text className="block text-sm font-medium text-stone-700 mb-2">年龄</Text>
                <View className="bg-stone-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="如：75"
                    value={form.age}
                    onInput={(e) => setForm({ ...form, age: e.detail.value })}
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="block text-sm font-medium text-stone-700 mb-2">职业</Text>
                <View className="bg-stone-50 rounded-xl px-4 py-3">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="如：木匠"
                    value={form.occupation}
                    onInput={(e) => setForm({ ...form, occupation: e.detail.value })}
                  />
                </View>
              </View>
            </View>

            {/* 身份/角色 */}
            <View>
              <Text className="block text-sm font-medium text-stone-700 mb-2">身份/角色</Text>
              <View className="bg-stone-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="如：村中老艺人、非遗传承人"
                  value={form.role}
                  onInput={(e) => setForm({ ...form, role: e.detail.value })}
                />
              </View>
            </View>

            {/* 采访摘录 */}
            <View>
              <Text className="block text-sm font-medium text-stone-700 mb-2">采访摘录</Text>
              <View className="bg-stone-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="一句话概括核心内容（可选）"
                  value={form.quote}
                  onInput={(e) => setForm({ ...form, quote: e.detail.value })}
                />
              </View>
            </View>

            {/* 完整采访内容 */}
            <View>
              <Text className="block text-sm font-medium text-stone-700 mb-2">完整采访内容 *</Text>
              <View className="bg-stone-50 rounded-2xl p-4">
                <Textarea
                  style={{ width: '100%', minHeight: '120px', backgroundColor: 'transparent' }}
                  placeholder="粘贴或输入完整的采访整理文本..."
                  maxlength={5000}
                  value={form.fullInterview}
                  onInput={(e) =>
                    setForm({
                      ...form,
                      fullInterview: (e.detail as { value: string }).value,
                    })
                  }
                />
              </View>
            </View>

            {/* 操作按钮 */}
            <View className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-stone-200"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
              >
                <Text>取消</Text>
              </Button>
              <Button
                className="flex-1 bg-amber-700 text-white"
                onClick={handleSubmit}
                disabled={submitting}
              >
                <Text>{submitting ? '提交中...' : editingId ? '保存修改' : '添加记录'}</Text>
              </Button>
            </View>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default InterviewManagePage
