import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useCallback, useRef, useMemo } from 'react'
import { useLoad, useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Network } from '@/network'
import { Search, BookOpen, X, Sparkles, FolderOpen } from 'lucide-react-taro'

interface Material {
  id: string
  title: string
  content: string
  source: string
  topic_id: string
  tags: string[] | null
  url: string | null
  created_at: string
  topic?: { id: string; name: string } | null
}

interface TopicGroup {
  topicId: string
  topicName: string
  materials: Material[]
}

const SOURCE_LABEL: Record<string, string> = {
  manual: '手动录入',
  ai_search: 'AI 搜索',
  web: '网络采集',
  interview: '历史采访',
}

const MaterialLibraryPage = () => {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [activeTab, setActiveTab] = useState('interview')

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchMaterials = useCallback(async (source?: string) => {
    try {
      setLoading(true)
      const s = source || activeTab === 'interview' ? 'interview' : 'external'
      const res = await Network.request({
        url: `/api/materials?source=${s}`,
      })
      const data = res.data?.data
      if (Array.isArray(data)) {
        setMaterials(data)
      }
    } catch (err) {
      console.error('获取资料列表失败:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useLoad(() => {
    fetchMaterials('interview')
  })

  useDidShow(() => {
    fetchMaterials()
  })

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSearchQuery('')
    fetchMaterials(tab)
  }

  /** 搜索（防抖） */
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      if (searchTimer.current) clearTimeout(searchTimer.current)

      if (!query.trim()) {
        fetchMaterials()
        return
      }

      searchTimer.current = setTimeout(async () => {
        try {
          setSearching(true)
          const source = activeTab === 'interview' ? 'interview' : 'external'
          const searchRes = await Network.request({
            url: `/api/materials/search?q=${encodeURIComponent(query.trim())}&source=${source}`,
          })
          const results = searchRes.data?.data
          if (Array.isArray(results)) {
            setMaterials(results)
          }
        } catch (err) {
          console.error('搜索失败:', err)
        } finally {
          setSearching(false)
        }
      }, 500)
    },
    [activeTab, fetchMaterials],
  )

  const handleClearSearch = () => {
    setSearchQuery('')
    fetchMaterials()
  }

  /** 按话题分组 */
  const groupedData = useMemo((): TopicGroup[] => {
    const map = new Map<string, TopicGroup>()
    for (const m of materials) {
      const topicId = m.topic_id
      const topicName = m.topic?.name || '未分类话题'
      if (!map.has(topicId)) {
        map.set(topicId, { topicId, topicName, materials: [] })
      }
      map.get(topicId)!.materials.push(m)
    }
    return Array.from(map.values())
  }, [materials])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const renderMaterialCard = (item: Material) => (
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
  )

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
            borderColor: searchQuery ? '#B45309' : '#E7E5E4',
          }}
        >
          <Search size={18} color="#78716C" />
          <View style={{ flex: 1, marginLeft: '8px' }}>
            <Input
              className="w-full bg-transparent"
              placeholder={activeTab === 'interview' ? '搜索历史采访资料...' : '搜索外部文献资料...'}
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

      {/* 搜索状态提示 */}
      {searching && (
        <View className="px-4 py-2">
          <View className="flex items-center gap-2">
            <Sparkles size={14} color="#B45309" />
            <Text className="text-xs text-amber-700">检索中...</Text>
          </View>
        </View>
      )}

      {/* 搜索结果提示 */}
      {searchQuery && !searching && (
        <View className="px-4 py-2">
          <Text className="block text-xs text-stone-500">
            找到 {materials.length} 条相关资料
          </Text>
        </View>
      )}

      {/* 分话题资料列表 */}
      <View className="px-4">
        {loading ? (
          <View className="space-y-3 mt-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </View>
        ) : groupedData.length === 0 ? (
          <Card className="border-stone-100 bg-white mt-4">
            <CardContent className="p-8 flex flex-col items-center">
              <BookOpen size={40} color="#D6D3D1" />
              <Text className="block text-sm text-stone-500 text-center mt-4">
                {searchQuery
                  ? '没有找到相关资料\n换个关键词试试'
                  : activeTab === 'interview'
                    ? '还没有历史采访资料\n采访录音转写后会沉淀到这里'
                    : '还没有外部文献资料\n可通过话题中的 AI 搜索获取'}
              </Text>
            </CardContent>
          </Card>
        ) : (
          <ScrollView scrollY className="mt-2" style={{ height: 'calc(100vh - 240px)' }}>
            <View className="space-y-4 pb-6">
              {groupedData.map((group) => (
                <View key={group.topicId}>
                  {/* 话题标题 */}
                  <View className="flex items-center gap-2 mb-2">
                    <FolderOpen size={16} color="#B45309" />
                    <Text className="block text-sm font-semibold text-stone-800">
                      {group.topicName}
                    </Text>
                    <Badge className="bg-amber-50 text-amber-700">
                      <Text className="text-xs">{group.materials.length}</Text>
                    </Badge>
                  </View>
                  {/* 话题下的资料列表 */}
                  <View className="space-y-2">
                    {group.materials.map((item) => renderMaterialCard(item))}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  )
}

export default MaterialLibraryPage
