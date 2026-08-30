import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useCallback, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Network } from '@/network'
import { BookOpen, FolderOpen, RefreshCw, ChevronDown, ChevronUp, Sparkles } from 'lucide-react-taro'

interface StoryItem {
  id: string
  topic_id: string
  title: string
  content: string
  summary: string | null
  source_material_count: number
  status: string
  topic_name: string
  created_at: string
}

interface StoriableTopic {
  id: string
  name: string
  description: string | null
  materialCount: number
  hasStory: boolean
}

const VillageStoriesPage = () => {
  const [stories, setStories] = useState<StoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [generatingTopicId, setGeneratingTopicId] = useState<string | null>(null)
  const [showTopicPicker, setShowTopicPicker] = useState(false)
  const [storiableTopics, setStoriableTopics] = useState<StoriableTopic[]>([])
  const [topicsLoading, setTopicsLoading] = useState(false)

  const fetchStories = useCallback(async () => {
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/stories' })
      console.log('Stories response:', res.data)
      const data = res.data?.data
      if (Array.isArray(data)) {
        setStories(data)
      }
    } catch (err) {
      console.error('获取故事列表失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    fetchStories()
  })

  // H5 端 useDidShow 可能不会在首次加载时触发，用 useEffect 兜底
  useEffect(() => {
    fetchStories()
  }, [fetchStories])

  const fetchStoriableTopics = useCallback(async () => {
    try {
      setTopicsLoading(true)
      const res = await Network.request({ url: '/api/stories/topics' })
      console.log('Storiable topics response:', res.data)
      const data = res.data?.data
      if (Array.isArray(data)) {
        setStoriableTopics(data)
      }
    } catch (err) {
      console.error('获取可生成话题失败:', err)
    } finally {
      setTopicsLoading(false)
    }
  }, [])

  const handleGenerateStory = async (topicId: string) => {
    try {
      setGeneratingTopicId(topicId)
      const res = await Network.request({
        url: '/api/stories/generate',
        method: 'POST',
        data: { topicId },
      })
      console.log('Generate story response:', res.data)
      if (res.data?.data) {
        Taro.showToast({ title: '故事生成成功', icon: 'success' })
        setShowTopicPicker(false)
        fetchStories()
      } else {
        Taro.showToast({ title: res.data?.msg || '生成失败', icon: 'none' })
      }
    } catch (err) {
      console.error('生成故事失败:', err)
      Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
    } finally {
      setGeneratingTopicId(null)
    }
  }

  const handleToggleExpand = (storyId: string) => {
    setExpandedId(expandedId === storyId ? null : storyId)
  }

  const handleGoToTopic = (topicId: string) => {
    Taro.switchTab({ url: '/pages/topics/index' })
    // 延迟跳转到话题详情，让 switchTab 先完成
    setTimeout(() => {
      Taro.navigateTo({ url: `/pages/topic-detail/index?id=${topicId}` })
    }, 300)
  }

  const handleOpenTopicPicker = () => {
    setShowTopicPicker(true)
    fetchStoriableTopics()
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  }

  // 故事详情页（展开状态）
  const expandedStory = expandedId ? stories.find((s) => s.id === expandedId) : null

  if (expandedStory) {
    return (
      <View className="min-h-screen bg-stone-50">
        {/* 顶部导航 */}
        <View className="bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            className="p-1 h-auto"
            onClick={() => setExpandedId(null)}
          >
            <ChevronUp size={20} color="#78716C" />
          </Button>
          <Text className="block text-base font-semibold text-stone-800 flex-1 truncate">
            {expandedStory.title}
          </Text>
        </View>

        {/* 故事正文 */}
        <ScrollView scrollY className="flex-1" style={{ height: 'calc(100vh - 120px)' }}>
          <View className="px-4 py-6">
            {/* 标题区 */}
            <Text className="block text-xl font-bold text-stone-800 mb-2">
              {expandedStory.title}
            </Text>
            <View className="flex items-center gap-2 mb-6">
              <Badge className="bg-amber-50 text-amber-700">
                <Text className="text-xs">{expandedStory.topic_name}</Text>
              </Badge>
              <Text className="text-xs text-stone-400">
                {formatDate(expandedStory.created_at)}
              </Text>
              <Badge className="bg-stone-100 text-stone-500">
                <Text className="text-xs">{expandedStory.source_material_count} 条素材</Text>
              </Badge>
            </View>

            {/* 正文内容 */}
            <View className="bg-white rounded-xl p-5 border border-stone-100 shadow-sm">
              {expandedStory.content.split('\n').map((paragraph, idx) => (
                paragraph.trim() ? (
                  <Text
                    key={idx}
                    className="block text-sm text-stone-700 leading-relaxed mb-4"
                  >
                    {paragraph}
                  </Text>
                ) : null
              ))}
            </View>

            {/* 底部操作 */}
            <View className="mt-6 flex gap-3">
              <Button
                className="flex-1 bg-amber-700 hover:bg-amber-800 text-white"
                onClick={() => handleGoToTopic(expandedStory.topic_id)}
              >
                <FolderOpen size={16} color="#FFFFFF" className="mr-2" />
                <Text>查看基础素材</Text>
              </Button>
              <Button
                variant="outline"
                className="border-stone-200 text-stone-600"
                onClick={() => {
                  setExpandedId(null)
                  handleGenerateStory(expandedStory.topic_id)
                }}
              >
                <RefreshCw size={16} color="#78716C" className="mr-2" />
                <Text>重新生成</Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-stone-50">
      {/* 头部 */}
      <View className="px-4 pt-6 pb-4 flex items-center justify-between">
        <View>
          <Text className="block text-xl font-bold text-stone-800">村庄故事</Text>
          <Text className="block text-sm text-stone-500">基于采访与文献整理的村庄记忆</Text>
        </View>
        <Button
          size="sm"
          className="bg-amber-700 hover:bg-amber-800 text-white"
          onClick={handleOpenTopicPicker}
        >
          <Sparkles size={16} color="#FFFFFF" className="mr-1" />
          <Text>生成故事</Text>
        </Button>
      </View>

      {/* 话题选择弹窗 */}
      {showTopicPicker && (
        <View className="px-4 mb-4">
          <Card className="border-stone-200 bg-white">
            <CardContent className="p-4">
              <View className="flex items-center justify-between mb-3">
                <Text className="block text-sm font-semibold text-stone-800">选择话题生成故事</Text>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-stone-400 p-1 h-auto"
                  onClick={() => setShowTopicPicker(false)}
                >
                  <ChevronUp size={18} color="#78716C" />
                </Button>
              </View>
              {topicsLoading ? (
                <View className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </View>
              ) : storiableTopics.length === 0 ? (
                <View className="py-6 flex flex-col items-center">
                  <BookOpen size={32} color="#D6D3D1" />
                  <Text className="block text-sm text-stone-500 text-center mt-3">
                    暂无可生成故事的话题{'\n'}请先在「话题」中添加素材
                  </Text>
                </View>
              ) : (
                <ScrollView scrollY style={{ maxHeight: '400px' }}>
                  <View className="space-y-2">
                    {storiableTopics.map((topic) => (
                      <Card
                        key={topic.id}
                        className={`border-stone-100 bg-white active:bg-stone-50 ${topic.hasStory ? 'opacity-70' : ''}`}
                        onClick={() => {
                          if (generatingTopicId) return
                          handleGenerateStory(topic.id)
                        }}
                      >
                        <CardContent className="p-3 flex items-center gap-3">
                          <View className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                            <FolderOpen size={18} color="#B45309" />
                          </View>
                          <View className="flex-1 min-w-0">
                            <Text className="block text-sm font-medium text-stone-800 truncate">
                              {topic.name}
                            </Text>
                            <Text className="block text-xs text-stone-400 mt-1">
                              {topic.materialCount} 条素材
                              {topic.hasStory ? ' · 已有故事（将重新生成）' : ''}
                            </Text>
                          </View>
                          {generatingTopicId === topic.id ? (
                            <Badge className="bg-amber-100 text-amber-700">
                              <Text className="text-xs">生成中...</Text>
                            </Badge>
                          ) : (
                            <Button size="sm" variant="ghost" className="text-amber-700 p-1 h-auto">
                              <Sparkles size={16} color="#B45309" />
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </View>
                </ScrollView>
              )}
            </CardContent>
          </Card>
        </View>
      )}

      {/* 故事列表 */}
      <View className="px-4">
        {loading ? (
          <View className="space-y-3 mt-2">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </View>
        ) : stories.length === 0 ? (
          <Card className="border-stone-100 bg-white mt-4">
            <CardContent className="p-8 flex flex-col items-center">
              <BookOpen size={40} color="#D6D3D1" />
              <Text className="block text-sm text-stone-500 text-center mt-4">
                还没有村庄故事{'\n'}点击上方「生成故事」开始创作
              </Text>
            </CardContent>
          </Card>
        ) : (
          <ScrollView scrollY className="mt-2" style={{ height: 'calc(100vh - 200px)' }}>
            <View className="space-y-3 pb-6">
              {stories.map((story) => (
                <Card
                  key={story.id}
                  className="border-stone-100 shadow-sm bg-white"
                >
                  <CardContent className="p-4">
                    {/* 标题区 */}
                    <View className="flex items-start justify-between mb-2">
                      <Text className="block text-base font-semibold text-stone-800 flex-1 mr-2">
                        {story.title}
                      </Text>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="p-1 h-auto flex-shrink-0"
                        onClick={() => handleToggleExpand(story.id)}
                      >
                        <ChevronDown size={18} color="#78716C" />
                      </Button>
                    </View>

                    {/* 摘要 */}
                    {story.summary && (
                      <Text className="block text-sm text-stone-500 mb-3 line-clamp-2">
                        {story.summary}
                      </Text>
                    )}

                    {/* 元信息 */}
                    <View className="flex items-center gap-2 mb-3">
                      <Badge className="bg-amber-50 text-amber-700">
                        <Text className="text-xs">{story.topic_name}</Text>
                      </Badge>
                      <Badge className="bg-stone-100 text-stone-500">
                        <Text className="text-xs">{story.source_material_count} 条素材</Text>
                      </Badge>
                      <Text className="text-xs text-stone-400">
                        {formatDate(story.created_at)}
                      </Text>
                    </View>

                    {/* 操作按钮 */}
                    <View className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-amber-700 hover:bg-amber-800 text-white"
                        onClick={() => handleToggleExpand(story.id)}
                      >
                        <BookOpen size={14} color="#FFFFFF" className="mr-1" />
                        <Text className="text-xs">阅读全文</Text>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-stone-200 text-stone-600"
                        onClick={() => handleGoToTopic(story.topic_id)}
                      >
                        <FolderOpen size={14} color="#78716C" className="mr-1" />
                        <Text className="text-xs">查看素材</Text>
                      </Button>
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

export default VillageStoriesPage
