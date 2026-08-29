import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useCallback, useRef } from 'react'
import Taro, { useLoad, useRouter, useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Network } from '@/network'
import { Search, Plus, BookOpen, X, Sparkles } from 'lucide-react-taro'

interface Material {
  id: string
  title: string
  content: string
  source: string
  tags: string[] | null
  url: string | null
  created_at: string
  score?: number
}

const SOURCE_LABEL: Record<string, string> = {
  manual: '手动录入',
  ai_search: 'AI 搜索',
  web: '网络采集',
  interview: '历史采访沉淀',
}

const MaterialLibraryPage = () => {
  const router = useRouter()
  const topicId = router.params.topicId || ''
  const topicName = router.params.topicName || ''
  const isGlobalMode = !topicId

  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [adding, setAdding] = useState(false)

  // 新增资料表单
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newTags, setNewTags] = useState('')

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true)
      const url = topicId
        ? `/api/materials/topic/${topicId}`
        : '/api/materials'
      const res = await Network.request({ url })
      const data = res.data?.data
      if (Array.isArray(data)) {
        setMaterials(data)
      }
    } catch (err) {
      console.error('获取资料列表失败:', err)
    } finally {
      setLoading(false)
    }
  }, [topicId])

  useLoad(() => {
    fetchMaterials()
  })

  useDidShow(() => {
    if (!isGlobalMode) return
    fetchMaterials()
  })

  /** 搜索（防抖） */
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      if (searchTimer.current) clearTimeout(searchTimer.current)

      if (!query.trim()) {
        setIsSearchMode(false)
        fetchMaterials()
        return
      }

      searchTimer.current = setTimeout(async () => {
        try {
          setSearching(true)
          setIsSearchMode(true)

          if (topicId) {
            // 话题内语义搜索
            const searchRes = await Network.request({
              url: `/api/materials/topic/${topicId}/search?q=${encodeURIComponent(query.trim())}`,
            })
            const results = searchRes.data?.data
            if (Array.isArray(results)) {
              setMaterials(results)
            }
          } else {
            // 全局关键词搜索
            const searchRes = await Network.request({
              url: `/api/materials/search?q=${encodeURIComponent(query.trim())}`,
            })
            const results = searchRes.data?.data
            if (Array.isArray(results)) {
              setMaterials(results)
            }
          }
        } catch (err) {
          console.error('搜索失败:', err)
        } finally {
          setSearching(false)
        }
      }, 500)
    },
    [topicId, fetchMaterials],
  )

  const handleClearSearch = () => {
    setSearchQuery('')
    setIsSearchMode(false)
    fetchMaterials()
  }

  const handleAddMaterial = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Taro.showToast({ title: '请填写标题和内容', icon: 'none' })
      return
    }
    if (!topicId) {
      Taro.showToast({ title: '请先选择话题后再添加资料', icon: 'none' })
      return
    }
    try {
      setAdding(true)
      const tags = newTags
        .split(/[,，、\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)
      const res = await Network.request({
        url: '/api/materials',
        method: 'POST',
        data: {
          topicId,
          title: newTitle.trim(),
          content: newContent.trim(),
          source: 'manual',
          tags: tags.length > 0 ? tags : undefined,
        },
      })
      if (res.data?.data) {
        Taro.showToast({ title: '添加成功', icon: 'success' })
        setShowAddDialog(false)
        setNewTitle('')
        setNewContent('')
        setNewTags('')
        fetchMaterials()
      }
    } catch (err) {
      console.error('添加资料失败:', err)
      Taro.showToast({ title: '添加失败', icon: 'none' })
    } finally {
      setAdding(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <View className="min-h-screen bg-stone-50 pb-8">
      {/* 顶部搜索栏 */}
      <View className="px-4 pt-4 pb-2">
        <View style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
          <View
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '8px 12px',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: isSearchMode ? '#B45309' : '#E7E5E4',
            }}
          >
            <Search size={18} color="#78716C" />
            <View style={{ flex: 1, marginLeft: '8px' }}>
              <Input
                className="w-full bg-transparent"
                placeholder={isGlobalMode ? '搜索资料库...' : '搜索资料... 支持自然语言'}
                value={searchQuery}
                onInput={(e) => handleSearch(e.detail.value)}
                confirmType="search"
              />
            </View>
            {searchQuery && (
              <Button size="sm" variant="ghost" className="p-1 h-auto" onClick={handleClearSearch}>
                <X size={16} color="#78716C" />
              </Button>
            )}
          </View>
          {topicId && (
            <Button
              className="h-10 w-10 p-0 bg-amber-700"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus size={20} color="#ffffff" />
            </Button>
          )}
        </View>
      </View>

      {/* 搜索状态提示 */}
      {searching && (
        <View className="px-4 py-2">
          <View className="flex items-center gap-2">
            <Sparkles size={14} color="#B45309" />
            <Text className="text-xs text-amber-700">
              {isGlobalMode ? '关键词检索中...' : 'AI 语义检索中...'}
            </Text>
          </View>
        </View>
      )}

      {/* 搜索结果提示 */}
      {isSearchMode && !searching && (
        <View className="px-4 py-2">
          <Text className="block text-xs text-stone-500">
            找到 {materials.length} 条相关资料
          </Text>
        </View>
      )}

      {/* 资料列表 */}
      <View className="px-4">
        {loading ? (
          <View className="space-y-3 mt-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </View>
        ) : materials.length === 0 ? (
          <Card className="border-stone-100 bg-white mt-4">
            <CardContent className="p-8 flex flex-col items-center">
              <BookOpen size={40} color="#D6D3D1" />
              <Text className="block text-sm text-stone-500 text-center mt-4">
                {isSearchMode
                  ? '没有找到相关资料\n换个关键词试试'
                  : isGlobalMode
                    ? '资料库还没有内容\n在话题中采访后会沉淀相关资料'
                    : '还没有资料\n点击右下角 + 添加第一条'}
              </Text>
            </CardContent>
          </Card>
        ) : (
          <ScrollView scrollY className="mt-2" style={{ height: 'calc(100vh - 200px)' }}>
            <View className="space-y-3 pb-4">
              {materials.map((item) => (
                <Card key={item.id} className="border-stone-100 shadow-sm bg-white">
                  <CardContent className="p-4">
                    <View className="flex items-start justify-between mb-2">
                      <Text className="block text-sm font-semibold text-stone-800 flex-1">
                        {item.title}
                      </Text>
                      {item.score !== undefined && (
                        <Badge className="ml-2 bg-amber-50 text-amber-700 flex-shrink-0">
                          <Text className="text-xs">
                            {Math.round(item.score * 100)}%
                          </Text>
                        </Badge>
                      )}
                    </View>
                    <Text className="block text-xs text-stone-500 line-clamp-3 mb-3">
                      {item.content}
                    </Text>
                    <View className="flex items-center justify-between">
                      <View className="flex flex-wrap gap-1">
                        {item.tags && Array.isArray(item.tags) && item.tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} className="bg-stone-100 text-stone-600">
                            <Text className="text-xs">{tag}</Text>
                          </Badge>
                        ))}
                        <Badge className="bg-stone-50 text-stone-400">
                          <Text className="text-xs">{SOURCE_LABEL[item.source] || item.source}</Text>
                        </Badge>
                      </View>
                      <Text className="text-xs text-stone-400 flex-shrink-0">
                        {formatDate(item.created_at)}
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* 新增资料弹窗（仅话题模式下可用） */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              <Text>添加资料</Text>
            </DialogTitle>
            <DialogDescription>
              <Text>为「{decodeURIComponent(topicName || '话题')}」添加一条新资料</Text>
            </DialogDescription>
          </DialogHeader>
          <View className="space-y-4 mt-4">
            <View>
              <Text className="block text-sm font-medium text-stone-700 mb-2">标题</Text>
              <View className="bg-stone-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="资料标题"
                  value={newTitle}
                  onInput={(e) => setNewTitle(e.detail.value)}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm font-medium text-stone-700 mb-2">内容</Text>
              <View className="bg-stone-50 rounded-2xl p-4">
                <Textarea
                  style={{ width: '100%', minHeight: '120px', backgroundColor: 'transparent' }}
                  placeholder="资料内容..."
                  maxlength={2000}
                  value={newContent}
                  onInput={(e) => setNewContent(e.detail.value)}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm font-medium text-stone-700 mb-2">标签</Text>
              <View className="bg-stone-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="用逗号分隔，如：祭祀, 民俗, 传统"
                  value={newTags}
                  onInput={(e) => setNewTags(e.detail.value)}
                />
              </View>
            </View>
            <View className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-stone-200"
                onClick={() => setShowAddDialog(false)}
              >
                <Text>取消</Text>
              </Button>
              <Button
                className="flex-1 bg-amber-700"
                disabled={adding}
                onClick={handleAddMaterial}
              >
                <Text className="text-white">{adding ? '添加中...' : '添加'}</Text>
              </Button>
            </View>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default MaterialLibraryPage
