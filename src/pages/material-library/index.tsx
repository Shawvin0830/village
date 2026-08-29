import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useCallback, useRef } from 'react'
import { useLoad, useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Network } from '@/network'
import { Search, BookOpen, X, Sparkles, FolderOpen, ChevronLeft } from 'lucide-react-taro'

interface TopicItem {
  topicId: string
  topicName: string
  topicDescription: string | null
  materialCount: number
}

interface Material {
  id: string
  title: string
  content: string
  source: string
  topic_id: string
  tags: string[] | null
  url: string | null
  created_at: string
}

const SOURCE_LABEL: Record<string, string> = {
  manual: '手动录入',
  ai_search: 'AI 搜索',
  web: '网络采集',
  interview: '历史采访',
}

const MaterialLibraryPage = () => {
  const [activeTab, setActiveTab] = useState('interview')

  // 第一级：话题列表
  const [topics, setTopics] = useState<TopicItem[]>([])
  const [topicsLoading, setTopicsLoading] = useState(true)

  // 第一级：搜索
  const [topSearchQuery, setTopSearchQuery] = useState('')
  const [topSearching, setTopSearching] = useState(false)
  const [isTopSearchMode, setIsTopSearchMode] = useState(false)

  // 第二级：资料列表
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(false)

  // 第二级：搜索
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)

  const topSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchTopics = useCallback(async (source?: string) => {
    try {
      setTopicsLoading(true)
      const s = source || activeTab
      const res = await Network.request({
        url: `/api/materials/topics?source=${s}`,
      })
      const data = res.data?.data
      if (Array.isArray(data)) {
        setTopics(data)
      }
    } catch (err) {
      console.error('获取话题列表失败:', err)
    } finally {
      setTopicsLoading(false)
    }
  }, [activeTab])

  const fetchMaterials = useCallback(async (topicId: string) => {
    try {
      setMaterialsLoading(true)
      const res = await Network.request({
        url: `/api/materials/topic/${topicId}`,
      })
      const data = res.data?.data
      if (Array.isArray(data)) {
        const filtered = activeTab === 'interview'
          ? data.filter((m: Material) => m.source === 'interview')
          : data.filter((m: Material) => m.source !== 'interview')
        setMaterials(filtered)
      }
    } catch (err) {
      console.error('获取资料列表失败:', err)
    } finally {
      setMaterialsLoading(false)
    }
  }, [activeTab])

  useLoad(() => {
    fetchTopics('interview')
  })

  useDidShow(() => {
    if (!selectedTopic) {
      fetchTopics()
    }
  })

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setTopSearchQuery('')
    setIsTopSearchMode(false)
    setSelectedTopic(null)
    fetchTopics(tab)
  }

  /** 首页全局搜索（按话题/关键词/被采访者） */
  const handleTopSearch = useCallback(
    (query: string) => {
      setTopSearchQuery(query)
      if (topSearchTimer.current) clearTimeout(topSearchTimer.current)

      if (!query.trim()) {
        setIsTopSearchMode(false)
        fetchTopics()
        return
      }

      topSearchTimer.current = setTimeout(async () => {
        try {
          setTopSearching(true)
          setIsTopSearchMode(true)
          const res = await Network.request({
            url: `/api/materials/library-search?q=${encodeURIComponent(query.trim())}&source=${activeTab}`,
          })
          const data = res.data?.data
          if (Array.isArray(data)) {
            setTopics(data)
          }
        } catch (err) {
          console.error('搜索失败:', err)
        } finally {
          setTopSearching(false)
        }
      }, 500)
    },
    [activeTab, fetchTopics],
  )

  const handleClearTopSearch = () => {
    setTopSearchQuery('')
    setIsTopSearchMode(false)
    fetchTopics()
  }

  const handleTopicClick = (topic: TopicItem) => {
    setSelectedTopic(topic)
    setSearchQuery('')
    fetchMaterials(topic.topicId)
  }

  const handleBack = () => {
    setSelectedTopic(null)
    setSearchQuery('')
    setMaterials([])
  }

  /** 搜索资料（在话题内） */
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      if (searchTimer.current) clearTimeout(searchTimer.current)

      if (!query.trim()) {
        if (selectedTopic) {
          fetchMaterials(selectedTopic.topicId)
        }
        return
      }

      searchTimer.current = setTimeout(async () => {
        if (!selectedTopic) return
        try {
          setSearching(true)
          const searchRes = await Network.request({
            url: `/api/materials/topic/${selectedTopic.topicId}/search?q=${encodeURIComponent(query.trim())}`,
          })
          const results = searchRes.data?.data
          if (Array.isArray(results)) {
            const filtered = activeTab === 'interview'
              ? results.filter((m: Material) => m.source === 'interview')
              : results.filter((m: Material) => m.source !== 'interview')
            setMaterials(filtered)
          }
        } catch (err) {
          console.error('搜索失败:', err)
        } finally {
          setSearching(false)
        }
      }, 500)
    },
    [selectedTopic, activeTab, fetchMaterials],
  )

  const handleClearSearch = () => {
    setSearchQuery('')
    if (selectedTopic) {
      fetchMaterials(selectedTopic.topicId)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  // 第二级：资料详情页
  if (selectedTopic) {
    return (
      <View className="min-h-screen bg-stone-50">
        {/* 顶部导航栏 */}
        <View className="bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3">
          <Button size="sm" variant="ghost" className="p-1 h-auto" onClick={handleBack}>
            <ChevronLeft size={20} color="#78716C" />
          </Button>
          <Text className="block text-base font-semibold text-stone-800 flex-1">
            {selectedTopic.topicName}
          </Text>
          <Badge className="bg-amber-50 text-amber-700">
            <Text className="text-xs">{selectedTopic.materialCount} 条资料</Text>
          </Badge>
        </View>

        {/* 搜索栏 */}
        <View className="px-4 pt-4 pb-2">
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '8px 12px',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: searchQuery ? '#B45309' : '#E7E5E4',
            }}
          >
            <Search size={18} color="#78716C" />
            <View style={{ flex: 1, marginLeft: '8px' }}>
              <Input
                className="w-full bg-transparent"
                placeholder="搜索资料..."
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
        </View>

        {/* 搜索状态 */}
        {searching && (
          <View className="px-4 py-2">
            <View className="flex items-center gap-2">
              <Sparkles size={14} color="#B45309" />
              <Text className="text-xs text-amber-700">检索中...</Text>
            </View>
          </View>
        )}

        {/* 资料列表 */}
        <View className="px-4">
          {materialsLoading ? (
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
                  {searchQuery ? '没有找到相关资料' : '该话题下暂无资料'}
                </Text>
              </CardContent>
            </Card>
          ) : (
            <ScrollView scrollY className="mt-2" style={{ height: 'calc(100vh - 200px)' }}>
              <View className="space-y-3 pb-6">
                {materials.map((item) => (
                  <Card key={item.id} className="border-stone-100 shadow-sm bg-white">
                    <CardContent className="p-4">
                      <Text className="block text-sm font-semibold text-stone-800 mb-2">
                        {item.title}
                      </Text>
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
      </View>
    )
  }

  // 第一级：话题列表页（带搜索）
  return (
    <View className="min-h-screen bg-stone-50">
      {/* 顶部搜索栏 */}
      <View className="px-4 pt-4 pb-2">
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '8px 12px',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: topSearchQuery ? '#B45309' : '#E7E5E4',
          }}
        >
          <Search size={18} color="#78716C" />
          <View style={{ flex: 1, marginLeft: '8px' }}>
            <Input
              className="w-full bg-transparent"
              placeholder="搜索话题、关键词、被采访者..."
              value={topSearchQuery}
              onInput={(e) => handleTopSearch(e.detail.value)}
              confirmType="search"
            />
          </View>
          {topSearchQuery && (
            <Button size="sm" variant="ghost" className="p-1 h-auto" onClick={handleClearTopSearch}>
              <X size={16} color="#78716C" />
            </Button>
          )}
        </View>
      </View>

      {/* Tab 切换 */}
      <View className="px-4 pb-2">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="bg-stone-100">
            <TabsTrigger value="interview">
              <Text className="text-xs">历史采访</Text>
            </TabsTrigger>
            <TabsTrigger value="external">
              <Text className="text-xs">外部文献资料</Text>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="interview" />
          <TabsContent value="external" />
        </Tabs>
      </View>

      {/* 搜索状态 */}
      {topSearching && (
        <View className="px-4 py-2">
          <View className="flex items-center gap-2">
            <Sparkles size={14} color="#B45309" />
            <Text className="text-xs text-amber-700">搜索中...</Text>
          </View>
        </View>
      )}

      {/* 搜索结果提示 */}
      {isTopSearchMode && !topSearching && (
        <View className="px-4 py-2">
          <Text className="block text-xs text-stone-500">
            找到 {topics.length} 个相关话题
          </Text>
        </View>
      )}

      {/* 话题列表 */}
      <View className="px-4">
        {topicsLoading ? (
          <View className="space-y-3 mt-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </View>
        ) : topics.length === 0 ? (
          <Card className="border-stone-100 bg-white mt-4">
            <CardContent className="p-8 flex flex-col items-center">
              <BookOpen size={40} color="#D6D3D1" />
              <Text className="block text-sm text-stone-500 text-center mt-4">
                {isTopSearchMode
                  ? '没有找到相关内容\n换个关键词试试'
                  : activeTab === 'interview'
                    ? '还没有历史采访资料\n采访录音转写后会沉淀到这里'
                    : '还没有外部文献资料\n可通过话题中的 AI 搜索获取'}
              </Text>
            </CardContent>
          </Card>
        ) : (
          <ScrollView scrollY className="mt-2" style={{ height: 'calc(100vh - 220px)' }}>
            <View className="space-y-3 pb-6">
              {topics.map((topic) => (
                <Card
                  key={topic.topicId}
                  className="border-stone-100 shadow-sm bg-white active:bg-stone-50"
                  onClick={() => handleTopicClick(topic)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <View className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                      <FolderOpen size={20} color="#B45309" />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="block text-sm font-semibold text-stone-800 truncate">
                        {topic.topicName}
                      </Text>
                      {topic.topicDescription && (
                        <Text className="block text-xs text-stone-500 truncate mt-1">
                          {topic.topicDescription}
                        </Text>
                      )}
                    </View>
                    <Badge className="bg-amber-50 text-amber-700 flex-shrink-0">
                      <Text className="text-xs">{topic.materialCount} 条</Text>
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  )
}

export default MaterialLibraryPage
