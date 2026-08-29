import { View, Text, type ITouchEvent } from '@tarojs/components'
import { useState, useCallback } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Network } from '@/network'
import { getStoredOperatorIdentity, roleCanDelete, roleCanEdit, type OperatorRole } from '@/identity'
import { Plus, ChevronRight, Search, FileText, BookOpen, Trash2 } from 'lucide-react-taro'

interface Topic {
  id: string
  name: string
  description: string | null
  status: string
  subtopic_count: number
  interview_count?: number
  reference_count?: number
  created_by_name?: string | null
  updated_by_name?: string | null
  created_at: string
}

type SourceFilter = 'all' | 'interviews' | 'references'

const TopicsPage = () => {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [operatorRole, setOperatorRole] = useState<OperatorRole>(getStoredOperatorIdentity().role)

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/topics' })
      console.log('Topics response:', res.data)
      const data = res.data?.data
      if (data) {
        setTopics(data)
      }
    } catch (err) {
      console.error('获取话题列表失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    setOperatorRole(getStoredOperatorIdentity().role)
    fetchTopics()
  })

  const handleCreate = async () => {
    if (!newName.trim()) {
      Taro.showToast({ title: '请输入话题名称', icon: 'none' })
      return
    }
    try {
      setCreating(true)
      const res = await Network.request({
        url: '/api/topics',
        method: 'POST',
        data: { name: newName.trim(), description: newDesc.trim() || undefined },
      })
      console.log('Create topic response:', res.data)
      if (res.data?.data) {
        Taro.showToast({ title: '创建成功', icon: 'success' })
        setShowCreate(false)
        setNewName('')
        setNewDesc('')
        fetchTopics()
      }
    } catch (err) {
      console.error('创建话题失败:', err)
      Taro.showToast({ title: '创建失败', icon: 'none' })
    } finally {
      setCreating(false)
    }
  }

  const goToDetail = (topicId: string) => {
    Taro.navigateTo({ url: `/pages/topic-detail/index?id=${topicId}` })
  }

  const openCreateDialog = () => {
    if (!roleCanEdit(operatorRole)) {
      Taro.showToast({ title: '当前身份只能查看', icon: 'none' })
      return
    }
    setShowCreate(true)
  }

  const handleDeleteTopic = async (
    topic: Topic,
    event?: ITouchEvent,
  ) => {
    event?.stopPropagation?.()
    const modal = await Taro.showModal({
      title: '确认删除话题',
      content: `删除「${topic.name}」后，这个话题下的子话题、采访材料和文献关联也会一起删除。确定删除吗？`,
      confirmText: '删除',
      confirmColor: '#DC2626',
    })
    if (!modal.confirm) return

    try {
      setDeletingId(topic.id)
      await Network.request({
        url: `/api/topics/${topic.id}`,
        method: 'DELETE',
      })
      Taro.showToast({ title: '已删除', icon: 'success' })
      fetchTopics()
    } catch (err) {
      console.error('删除话题失败:', err)
      Taro.showToast({ title: '删除失败', icon: 'none' })
    } finally {
      setDeletingId(null)
    }
  }

  const filteredTopics = topics.filter((topic) => {
    const keyword = query.trim()
    const text = `${topic.name} ${topic.description || ''}`
    const matchesQuery = !keyword || text.includes(keyword)
    const matchesSource =
      sourceFilter === 'all' ||
      (sourceFilter === 'interviews' && (topic.interview_count || 0) > 0) ||
      (sourceFilter === 'references' && (topic.reference_count || 0) > 0)
    return matchesQuery && matchesSource
  })

  return (
    <View className="min-h-screen bg-stone-50 pb-20">
      {/* 头部 */}
      <View className="px-4 pt-6 pb-4 flex items-center justify-between">
        <View>
          <Text className="block text-xl font-bold text-stone-800">话题管理</Text>
          <Text className="block text-sm text-stone-500">管理你的村庄记忆话题</Text>
        </View>
        <Button
          size="sm"
          className="bg-amber-700 hover:bg-amber-800 text-white"
          onClick={openCreateDialog}
        >
          <Plus size={16} color="#B45309" className="mr-1" />
          <Text>新建</Text>
        </Button>
      </View>

      {/* 搜索与材料入口 */}
      <View className="px-4 mb-4">
        <Card className="border-stone-100 bg-white">
          <CardContent className="p-3">
            <View className="flex items-center mb-3">
              <Search size={16} color="#78716C" className="mr-2" />
              <Input
                value={query}
                placeholder="搜索话题名称或描述"
                onInput={(e) => setQuery(String(e.detail.value || ''))}
              />
            </View>
            <View className="grid grid-cols-2 gap-2">
              <Button
                variant={sourceFilter === 'interviews' ? 'default' : 'outline'}
                className={sourceFilter === 'interviews' ? 'bg-amber-700 text-white' : 'bg-white'}
                onClick={() => setSourceFilter(sourceFilter === 'interviews' ? 'all' : 'interviews')}
              >
                <FileText size={16} color={sourceFilter === 'interviews' ? '#FFFFFF' : '#B45309'} className="mr-1" />
                <Text>历史采访</Text>
              </Button>
              <Button
                variant={sourceFilter === 'references' ? 'default' : 'outline'}
                className={sourceFilter === 'references' ? 'bg-amber-700 text-white' : 'bg-white'}
                onClick={() => setSourceFilter(sourceFilter === 'references' ? 'all' : 'references')}
              >
                <BookOpen size={16} color={sourceFilter === 'references' ? '#FFFFFF' : '#B45309'} className="mr-1" />
                <Text>外部文献</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 话题列表 */}
      <View className="px-4">
        {loading ? (
          <View className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </View>
        ) : topics.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Text className="block text-4xl mb-4">📝</Text>
            <Text className="block text-base text-stone-500 mb-2 text-center">还没有话题</Text>
            <Text className="block text-sm text-stone-400 mb-6 text-center">
              点击上方新建按钮，开始记录村庄记忆
            </Text>
            <Button
              className="bg-amber-700 text-white"
              onClick={openCreateDialog}
            >
              <Plus size={16} color="#B45309" className="mr-1" />
              <Text>创建第一个话题</Text>
            </Button>
          </View>
        ) : (
          <View className="space-y-3">
            {filteredTopics.length === 0 && (
              <Card className="border-stone-100 bg-white">
                <CardContent className="p-6">
                  <Text className="block text-sm text-stone-500 text-center">
                    没有找到匹配的话题
                  </Text>
                </CardContent>
              </Card>
            )}
            {filteredTopics.map((topic) => (
              <Card
                key={topic.id}
                className="border-stone-100 shadow-sm"
                onClick={() => goToDetail(topic.id)}
              >
                <CardContent className="p-4">
                  <View className="flex items-center justify-between">
                    <View className="flex-1">
                      <Text className="block text-base font-semibold text-stone-800 mb-1">
                        {topic.name}
                      </Text>
                      {topic.description && (
                        <Text className="block text-sm text-stone-500 mb-2 line-clamp-2">
                          {topic.description}
                        </Text>
                      )}
                      <Text className="block text-xs text-stone-400 mb-2">
                        创建者：{topic.created_by_name || '待补充'}
                        {topic.updated_by_name ? ` / 最近编辑：${topic.updated_by_name}` : ''}
                      </Text>
                      <View className="flex items-center gap-2">
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                          <Text className="text-xs">{topic.subtopic_count} 个子话题</Text>
                        </Badge>
                        <Badge className="bg-green-50 text-green-700 border-green-100">
                          <Text className="text-xs">{topic.interview_count || 0} 条采访</Text>
                        </Badge>
                        <Badge className="bg-blue-50 text-blue-700 border-blue-100">
                          <Text className="text-xs">{topic.reference_count || 0} 篇文献</Text>
                        </Badge>
                        <Text className="block text-xs text-stone-400">
                          {new Date(topic.created_at).toLocaleDateString('zh-CN')}
                        </Text>
                      </View>
                    </View>
                    <View className="flex items-center ml-2">
                      {roleCanDelete(operatorRole) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-stone-400 mr-1"
                          disabled={deletingId === topic.id}
                          onClick={(event) => handleDeleteTopic(topic, event)}
                        >
                          <Trash2 size={16} color="#DC2626" />
                        </Button>
                      )}
                      <ChevronRight size={20} color="#A8A29E" />
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* 创建话题弹窗 */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              <Text>新建话题</Text>
            </DialogTitle>
            <DialogDescription>
              <Text>创建一个新的村庄记忆话题</Text>
            </DialogDescription>
          </DialogHeader>
          <View className="space-y-4 mt-4">
            <View>
              <Text className="block text-sm font-medium text-stone-700 mb-2">话题名称</Text>
              <View className="bg-stone-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="如：潮汕宗祠建筑设计"
                  value={newName}
                  onInput={(e) => setNewName(e.detail.value)}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm font-medium text-stone-700 mb-2">话题描述（可选）</Text>
              <View className="bg-stone-50 rounded-xl p-4">
                <Textarea
                  style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }}
                  placeholder="简单描述这个话题..."
                  value={newDesc}
                  onInput={(e) => setNewDesc(e.detail.value)}
                  maxlength={200}
                />
              </View>
            </View>
            <View className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-stone-200"
                onClick={() => setShowCreate(false)}
              >
                <Text>取消</Text>
              </Button>
              <Button
                className="flex-1 bg-amber-700 hover:bg-amber-800 text-white"
                onClick={handleCreate}
                disabled={creating}
              >
                <Text>{creating ? '创建中...' : '创建'}</Text>
              </Button>
            </View>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default TopicsPage
