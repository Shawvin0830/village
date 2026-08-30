import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, RefreshCw, FileText, Sparkles } from 'lucide-react-taro'
import { Network } from '@/network'

/** 故事列表项 */
interface StoryListItem {
  id: string
  topic_id: string
  subtopic_id: string | null
  title: string
  summary: string | null
  source_material_count: number
  status: string
  topic_name: string
  subtopic_name: string | null
  created_at: string
}

/** 可生成故事的话题项 */
interface StoriableTopicItem {
  topic_id: string
  topic_name: string
  subtopic_id: string | null
  subtopic_name: string | null
  material_count: number
  has_story: boolean
  story_id: string | null
}

/** 故事详情 */
interface StoryDetail {
  id: string
  topic_id: string
  subtopic_id: string | null
  title: string
  content: string
  summary: string | null
  source_material_count: number
  status: string
  created_at: string
}

/** 按主话题分组的故事 */
interface TopicStoryGroup {
  topic_id: string
  topic_name: string
  stories: StoryListItem[]
}

export default function VillageStoriesPage() {
  const [stories, setStories] = useState<StoryListItem[]>([])
  const [storiableTopics, setStoriableTopics] = useState<StoriableTopicItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedStory, setSelectedStory] = useState<StoryDetail | null>(null)

  const fetchStories = useCallback(async () => {
    try {
      const res = await Network.request({ url: '/api/stories' })
      const data = res.data?.data
      if (Array.isArray(data)) {
        setStories(data)
      }
    } catch (err) {
      console.error('获取故事列表失败:', err)
    }
  }, [])

  const fetchStoriableTopics = useCallback(async () => {
    try {
      const res = await Network.request({ url: '/api/stories/topics' })
      const data = res.data?.data
      if (Array.isArray(data)) {
        setStoriableTopics(data)
      }
    } catch (err) {
      console.error('获取可生成话题失败:', err)
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchStories(), fetchStoriableTopics()])
    setLoading(false)
  }, [fetchStories, fetchStoriableTopics])

  useDidShow(() => {
    loadData()
  })

  // H5 端 useDidShow 可能不会在首次加载时触发，用 useEffect 兜底
  useEffect(() => {
    loadData()
  }, [loadData])

  // 按主话题分组故事
  const groupedStories: TopicStoryGroup[] = stories.reduce((acc, story) => {
    const existing = acc.find(g => g.topic_id === story.topic_id)
    if (existing) {
      existing.stories.push(story)
    } else {
      acc.push({
        topic_id: story.topic_id,
        topic_name: story.topic_name,
        stories: [story],
      })
    }
    return acc
  }, [] as TopicStoryGroup[])

  // 按主话题分组可生成话题
  const groupedTopics = storiableTopics.reduce((acc, topic) => {
    const existing = acc.find(g => g[0].topic_id === topic.topic_id)
    if (existing) {
      existing.push(topic)
    } else {
      acc.push([topic])
    }
    return acc
  }, [] as StoriableTopicItem[][])

  const handleGenerateStory = async (topicId: string, subtopicId?: string) => {
    setGenerating(true)
    try {
      const res = await Network.request({
        url: '/api/stories/generate',
        method: 'POST',
        data: { topicId, subtopicId },
      })
      console.log('生成故事响应:', res.data)
      if (res.data?.data) {
        Taro.showToast({ title: '故事生成成功', icon: 'success' })
        await loadData()
      } else {
        Taro.showToast({ title: res.data?.msg || '生成失败，该话题下没有可用素材', icon: 'none' })
      }
    } catch (err) {
      console.error('生成故事失败:', err)
      Taro.showToast({ title: '生成失败', icon: 'none' })
    } finally {
      setGenerating(false)
    }
  }

  const handleViewStory = async (storyId: string) => {
    try {
      const res = await Network.request({ url: `/api/stories/${storyId}` })
      const data = res.data?.data
      if (data) {
        setSelectedStory(data as StoryDetail)
      }
    } catch (err) {
      console.error('获取故事详情失败:', err)
    }
  }

  const handleViewMaterials = (topicId: string) => {
    Taro.switchTab({ url: '/pages/topics/index' })
    setTimeout(() => {
      Taro.navigateTo({
        url: `/pages/topic-detail/index?id=${topicId}`,
      })
    }, 300)
  }

  // 故事详情视图
  if (selectedStory) {
    return (
      <View className="min-h-screen bg-stone-50">
        <View className="bg-white px-4 pt-12 pb-4 shadow-sm">
          <View className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setSelectedStory(null)}>
              <Text>返回</Text>
            </Button>
            <Text className="block text-lg font-semibold text-stone-800">故事详情</Text>
            <View className="w-12" />
          </View>
        </View>

        <ScrollView scrollY className="h-[calc(100vh-120px)] px-4 py-4">
          <Card className="mb-4">
            <CardContent className="p-5">
              <Text className="block text-xl font-bold text-stone-800 mb-2">
                {selectedStory.title}
              </Text>
              {selectedStory.summary && (
                <Text className="block text-sm text-stone-500 mb-3">
                  {selectedStory.summary}
                </Text>
              )}
              <View className="flex items-center gap-2">
                <Badge variant="secondary">
                  <Text>{selectedStory.source_material_count} 个素材</Text>
                </Badge>
              </View>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <Text className="block text-base text-stone-700 leading-relaxed whitespace-pre-wrap">
                {selectedStory.content}
              </Text>
            </CardContent>
          </Card>
        </ScrollView>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-stone-50">
      {/* 顶部标题 */}
      <View className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <View className="flex items-center justify-between">
          <Text className="block text-xl font-bold text-stone-800">村庄故事</Text>
          <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} color={loading ? '#999' : '#666'} />
          </Button>
        </View>
        <Text className="block text-sm text-stone-500 mt-1">
          基于采访素材和文献资料，生成可读性强的村庄历史故事
        </Text>
      </View>

      <ScrollView scrollY className="h-[calc(100vh-120px)] px-4 py-4">
        {loading ? (
          <View className="flex items-center justify-center py-20">
            <Text className="block text-stone-400">加载中...</Text>
          </View>
        ) : (
          <>
            {/* 按主话题分组展示故事 */}
            {groupedStories.length > 0 && (
              <View className="mb-6">
                <Text className="block text-base font-semibold text-stone-700 mb-3">
                  已生成的故事
                </Text>
                {groupedStories.map((group) => (
                  <View key={group.topic_id} className="mb-4">
                    {/* 主话题标题 */}
                    <View className="flex items-center gap-2 mb-2">
                      <View className="w-1 h-4 bg-amber-500 rounded-full" />
                      <Text className="block text-sm font-medium text-stone-600">
                        {group.topic_name}
                      </Text>
                    </View>

                    {/* 故事列表 */}
                    {group.stories.map((story) => (
                      <Card key={story.id} className="mb-2 ml-3">
                        <CardContent className="p-4">
                          <View className="flex items-start justify-between gap-3">
                            <View className="flex-1">
                              <View className="flex items-center gap-2 mb-1">
                                <BookOpen size={16} color="#d97706" />
                                <Text className="block text-base font-semibold text-stone-800">
                                  {story.title}
                                </Text>
                              </View>
                              {story.subtopic_name && (
                                <Text className="block text-xs text-stone-500 mb-1">
                                  子话题：{story.subtopic_name}
                                </Text>
                              )}
                              {story.summary && (
                                <Text className="block text-sm text-stone-500 mb-2">
                                  {story.summary}
                                </Text>
                              )}
                              <View className="flex items-center gap-2">
                                <Badge variant="secondary">
                                  <Text>{story.source_material_count} 个素材</Text>
                                </Badge>
                              </View>
                            </View>
                          </View>
                          <View className="flex gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewStory(story.id)}
                            >
                              <Text>阅读全文</Text>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewMaterials(story.topic_id)}
                            >
                              <Text>查看素材</Text>
                            </Button>
                          </View>
                        </CardContent>
                      </Card>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {/* 可生成故事的话题列表（主话题→子话题层级） */}
            <View>
              <Text className="block text-base font-semibold text-stone-700 mb-3">
                可生成故事的话题
              </Text>
              {groupedTopics.length === 0 ? (
                <Card>
                  <CardContent className="p-8 flex flex-col items-center">
                    <FileText size={48} color="#d4d4d9" />
                    <Text className="block text-stone-400 mt-3 text-center">
                      暂无可生成故事的话题{'\n'}请先在「话题」中添加素材
                    </Text>
                  </CardContent>
                </Card>
              ) : (
                groupedTopics.map((topicGroup) => {
                  const mainTopic = topicGroup[0]
                  return (
                    <View key={mainTopic.topic_id} className="mb-4">
                      {/* 主话题标题 */}
                      <View className="flex items-center gap-2 mb-2">
                        <View className="w-1 h-4 bg-amber-500 rounded-full" />
                        <Text className="block text-sm font-medium text-stone-600">
                          {mainTopic.topic_name}
                        </Text>
                      </View>

                      {/* 主话题和子话题列表 */}
                      <View className="ml-3">
                        {topicGroup.map((item) => {
                          const displayName = item.subtopic_name || '（主话题整体）'
                          const hasMaterials = item.material_count > 0

                          return (
                            <Card key={item.subtopic_id || item.topic_id} className="mb-2">
                              <CardContent className="p-3">
                                <View className="flex items-center justify-between gap-3">
                                  <View className="flex-1">
                                    <Text className="block text-sm font-medium text-stone-700">
                                      {displayName}
                                    </Text>
                                    <View className="flex items-center gap-2 mt-1">
                                      <Badge variant="secondary">
                                        <Text>{item.material_count} 个素材</Text>
                                      </Badge>
                                      {item.has_story && (
                                        <Badge>
                                          <Text>已有故事</Text>
                                        </Badge>
                                      )}
                                    </View>
                                  </View>
                                  <Button
                                    size="sm"
                                    disabled={!hasMaterials || generating}
                                    onClick={() =>
                                      handleGenerateStory(item.topic_id, item.subtopic_id || undefined)
                                    }
                                  >
                                    <Sparkles size={14} color="#fff" />
                                    <Text className="ml-1">
                                      {item.has_story ? '重新生成' : '生成故事'}
                                    </Text>
                                  </Button>
                                </View>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </View>
                    </View>
                  )
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}
