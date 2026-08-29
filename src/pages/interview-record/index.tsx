import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Network } from '@/network'
import { Mic, Square, Upload, FileText, BookOpen, Users } from 'lucide-react-taro'

/** 故事片段 */
interface StoryFragment {
  story_thread_id: string | null
  story_thread_name: string
  category: string
  icon: string
  dialect_original: string
  mandarin_text: string
  summary: string
  flags: string[]
  time_range?: string
}

/** 导览叙事 */
interface GuidedNarrative {
  story_thread_name: string
  category: string
  narrative: string
  key_quote: string
  visitor_hook: string
  completeness: number
  missing_pieces: string[]
}

/** 人物档案 */
interface CharacterInfo {
  name: string
  aliases: string[]
  tags: string[]
  story: string
  key_quotes: string[]
  related_story_threads: string[]
  mention_count: number
  verify_flags: string[]
}

/** 分类元信息 */
const CATEGORY_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  building_history: { label: '建筑史', icon: '🏛️', color: 'text-blue-600', bg: 'bg-blue-50' },
  craft_culture:    { label: '工艺文化', icon: '🪵', color: 'text-amber-600', bg: 'bg-amber-50' },
  iconography:      { label: '图像寓意', icon: '🎨', color: 'text-purple-600', bg: 'bg-purple-50' },
  biography:        { label: '人物传记', icon: '👤', color: 'text-green-600', bg: 'bg-green-50' },
  folk_custom:      { label: '民俗风情', icon: '🏮', color: 'text-pink-600', bg: 'bg-pink-50' },
  village_change:   { label: '村落变迁', icon: '🏘️', color: 'text-cyan-600', bg: 'bg-cyan-50' },
}

const InterviewRecordPage = () => {
  const router = useRouter()
  const topicId = router.params.topicId || ''

  const envType = Taro.getEnv()
  const isMiniApp = envType === Taro.ENV_TYPE.WEAPP || envType === Taro.ENV_TYPE.TT

  const [recorderManager, setRecorderManager] = useState<Taro.RecorderManager | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioPath, setAudioPath] = useState('')
  const [subtopics, setSubtopics] = useState<Array<{ id: string; name: string; icon: string }>>([])
  const [selectedSubId, setSelectedSubId] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{
    transcript: string
    fragments: StoryFragment[]
    narratives: GuidedNarrative[]
    characters: CharacterInfo[]
    cross_references: string[]
    next_interview_plan: string[]
  } | null>(null)
  const [textInput, setTextInput] = useState('')
  const [useTextMode, setUseTextMode] = useState(false)
  const [expandedFragment, setExpandedFragment] = useState<number | null>(null)

  useEffect(() => {
    if (isMiniApp) {
      const manager = Taro.getRecorderManager()
      manager.onStart(() => {
        console.log('录音开始')
        setIsRecording(true)
      })
      manager.onStop((res) => {
        console.log('录音结束', res.tempFilePath)
        setAudioPath(res.tempFilePath)
        setIsRecording(false)
      })
      manager.onError((err) => {
        console.error('录音错误:', err)
        Taro.showToast({ title: '录音失败', icon: 'none' })
        setIsRecording(false)
      })
      setRecorderManager(manager)
    }

    // 获取子话题列表
    if (topicId) {
      Network.request({ url: `/api/topics/${topicId}/subtopics` }).then((res) => {
        console.log('Subtopics:', res.data)
        const data = res.data?.data
        if (data) {
          setSubtopics(data)
          if (data.length > 0) {
            setSelectedSubId(data[0].id)
          }
        }
      }).catch(console.error)
    }
  }, [isMiniApp, topicId])

  const handleStartRecord = () => {
    if (!isMiniApp) {
      Taro.showToast({ title: 'H5端暂不支持录音', icon: 'none' })
      return
    }
    recorderManager?.start({
      format: 'wav',
      sampleRate: 16000,
      numberOfChannels: 1,
    })
  }

  const handleStopRecord = () => {
    recorderManager?.stop()
  }

  const handleUploadAndProcess = async () => {
    if (!audioPath) {
      Taro.showToast({ title: '请先录音', icon: 'none' })
      return
    }
    try {
      setProcessing(true)
      // 上传音频文件
      const uploadRes = await Network.uploadFile({
        url: '/api/interview-records/upload-audio',
        filePath: audioPath,
        name: 'audio',
      })
      console.log('Upload audio response:', uploadRes.data)
      const uploadData = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data
      const audioKey = uploadData?.data?.audio_key
      if (!audioKey) {
        throw new Error('上传失败')
      }

      // 调用ASR + AI分析
      const res = await Network.request({
        url: '/api/interview-records/transcribe',
        method: 'POST',
        data: {
          topic_id: topicId,
          subtopic_id: selectedSubId || undefined,
          audio_key: audioKey,
        },
      })
      console.log('Transcribe response:', res.data)
      const data = res.data?.data
      if (data) {
        setResult(data)
        Taro.showToast({ title: '转写完成', icon: 'success' })
      }
    } catch (err) {
      console.error('转写失败:', err)
      Taro.showToast({ title: '转写失败，请重试', icon: 'none' })
    } finally {
      setProcessing(false)
    }
  }

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      Taro.showToast({ title: '请输入采访内容', icon: 'none' })
      return
    }
    try {
      setProcessing(true)
      const res = await Network.request({
        url: '/api/interview-records/transcribe-text',
        method: 'POST',
        data: {
          topic_id: topicId,
          subtopic_id: selectedSubId || undefined,
          text: textInput.trim(),
        },
      })
      console.log('Text transcribe response:', res.data)
      const data = res.data?.data
      if (data) {
        setResult(data)
        Taro.showToast({ title: '整理完成', icon: 'success' })
      }
    } catch (err) {
      console.error('整理失败:', err)
      Taro.showToast({ title: '整理失败，请重试', icon: 'none' })
    } finally {
      setProcessing(false)
    }
  }

  const getCompletenessColor = (v: number) => {
    if (v >= 80) return 'text-green-600'
    if (v >= 60) return 'text-blue-600'
    if (v >= 30) return 'text-amber-600'
    return 'text-red-500'
  }

  const getCompletenessLabel = (v: number) => {
    if (v >= 80) return '丰满'
    if (v >= 60) return '可用'
    if (v >= 30) return '骨架'
    return '碎片'
  }

  const getCompletenessBarColor = (v: number) => {
    if (v >= 80) return 'bg-green-500'
    if (v >= 60) return 'bg-blue-500'
    if (v >= 30) return 'bg-amber-500'
    return 'bg-red-400'
  }

  return (
    <View className="min-h-screen bg-stone-50 pb-8">
      {/* 头部 */}
      <View className="px-4 pt-6 pb-4">
        <View className="flex items-center gap-2 mb-2">
          <Mic size={24} color="#4D7C0F" />
          <Text className="block text-xl font-bold text-stone-800">录音转写</Text>
        </View>
        <Text className="block text-sm text-stone-500">
          录音后 AI 自动整理为故事线、导览叙事、人物档案
        </Text>
      </View>

      {/* 选择子话题 */}
      {subtopics.length > 0 && (
        <View className="px-4 mb-4">
          <Text className="block text-sm font-medium text-stone-700 mb-2">关联子话题（可选）</Text>
          <Select value={selectedSubId} onValueChange={setSelectedSubId}>
            <SelectTrigger className="bg-white border-stone-200">
              <SelectValue placeholder="选择子话题" />
            </SelectTrigger>
            <SelectContent>
              {subtopics.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  <Text>{sub.icon} {sub.name}</Text>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </View>
      )}

      {/* 模式切换 */}
      <View className="px-4 mb-4">
        <View className="flex gap-2">
          <Button
            variant={!useTextMode ? 'default' : 'outline'}
            size="sm"
            className={!useTextMode ? 'bg-amber-700 text-white' : 'border-stone-200'}
            onClick={() => setUseTextMode(false)}
          >
            <Mic size={14} color="#B45309" className="mr-1" />
            <Text>录音转写</Text>
          </Button>
          <Button
            variant={useTextMode ? 'default' : 'outline'}
            size="sm"
            className={useTextMode ? 'bg-amber-700 text-white' : 'border-stone-200'}
            onClick={() => setUseTextMode(true)}
          >
            <FileText size={14} color="#B45309" className="mr-1" />
            <Text>文本输入</Text>
          </Button>
        </View>
      </View>

      {!useTextMode ? (
        /* 录音模式 */
        <View className="px-4">
          {isMiniApp ? (
            <Card className="border-stone-100 bg-white mb-4">
              <CardContent className="p-6 flex flex-col items-center">
                {isRecording ? (
                  <>
                    <View className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                      <Square size={32} color="#DC2626" />
                    </View>
                    <Text className="block text-base text-red-600 font-medium mb-4">录音中...</Text>
                    <Button
                      className="bg-red-600 text-white"
                      onClick={handleStopRecord}
                    >
                      <Text>停止录音</Text>
                    </Button>
                  </>
                ) : (
                  <>
                    <View className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                      <Mic size={32} color="#4D7C0F" />
                    </View>
                    <Text className="block text-base text-stone-700 mb-4">
                      {audioPath ? '录音完成' : '点击开始录音'}
                    </Text>
                    <View className="flex gap-3">
                      <Button
                        className="bg-lime-800 text-white"
                        onClick={handleStartRecord}
                      >
                        <Text>{audioPath ? '重新录音' : '开始录音'}</Text>
                      </Button>
                      {audioPath && (
                        <Button
                          className="bg-amber-700 text-white"
                          onClick={handleUploadAndProcess}
                          disabled={processing}
                        >
                          <Upload size={16} color="#B45309" className="mr-1" />
                          <Text>{processing ? '处理中...' : '上传转写'}</Text>
                        </Button>
                      )}
                    </View>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-stone-100 bg-white mb-4">
              <CardContent className="p-6 flex flex-col items-center">
                <Text className="block text-3xl mb-3">🎙️</Text>
                <Text className="block text-sm text-stone-500 text-center mb-4">
                  录音功能仅在小程序中可用{'\n'}请使用文本输入模式或打开小程序
                </Text>
                <Button
                  variant="outline"
                  className="border-stone-200"
                  onClick={() => setUseTextMode(true)}
                >
                  <Text>切换到文本输入</Text>
                </Button>
              </CardContent>
            </Card>
          )}
        </View>
      ) : (
        /* 文本输入模式 */
        <View className="px-4">
          <Card className="border-stone-100 bg-white mb-4">
            <CardContent className="p-4">
              <Text className="block text-sm font-medium text-stone-700 mb-2">
                输入采访内容
              </Text>
              <View className="bg-stone-50 rounded-xl p-4 mb-4">
                <Textarea
                  style={{ width: '100%', minHeight: '150px', backgroundColor: 'transparent' }}
                  placeholder="将采访内容粘贴或输入到这里，AI 会帮你按故事线分段整理..."
                  value={textInput}
                  onInput={(e) => setTextInput(e.detail.value)}
                  maxlength={5000}
                />
              </View>
              <Button
                className="w-full bg-amber-700 text-white"
                onClick={handleTextSubmit}
                disabled={processing || !textInput.trim()}
              >
                <Text>{processing ? 'AI 整理中...' : 'AI 整理'}</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      )}

      {/* 整理结果 */}
      {result && (
        <View className="px-4 space-y-4">
          {/* 统计概览 */}
          <View className="flex items-center gap-4 flex-wrap">
            <Text className="block text-base font-semibold text-stone-800">整理结果</Text>
            <View className="flex gap-2 flex-wrap">
              {result.narratives?.length > 0 && (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                  <Text className="text-xs">{result.narratives.length} 条故事线</Text>
                </Badge>
              )}
              {result.fragments?.length > 0 && (
                <Badge className="bg-stone-100 text-stone-600 border-stone-200">
                  <Text className="text-xs">{result.fragments.length} 个片段</Text>
                </Badge>
              )}
              {result.characters?.length > 0 && (
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  <Text className="text-xs">{result.characters.length} 位人物</Text>
                </Badge>
              )}
            </View>
          </View>

          {/* 导览叙事（v3 核心新增） */}
          {result.narratives && result.narratives.length > 0 && (
            <View className="space-y-3">
              <View className="flex items-center gap-2">
                <BookOpen size={18} color="#B45309" />
                <Text className="block text-sm font-semibold text-stone-800">导览故事</Text>
              </View>
              {result.narratives.map((narr, i) => {
                const cat = CATEGORY_META[narr.category] || { label: narr.category, icon: '📖', color: 'text-stone-600', bg: 'bg-stone-50' }
                return (
                  <Card key={`narr-${i}`} className="border-stone-100 bg-white">
                    <CardContent className="p-4">
                      {/* 标题行 */}
                      <View className="flex items-center gap-2 mb-3">
                        <Text className="block text-lg">{cat.icon}</Text>
                        <Text className="block text-sm font-semibold text-stone-800 flex-1">
                          {narr.story_thread_name}
                        </Text>
                        <Badge className={`${cat.bg} ${cat.color} border-0`}>
                          <Text className="text-xs">{cat.label}</Text>
                        </Badge>
                      </View>

                      {/* 完整度 */}
                      <View className="flex items-center gap-2 mb-3">
                        <View className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                          <View
                            className={`h-full rounded-full ${getCompletenessBarColor(narr.completeness)}`}
                            style={{ width: `${narr.completeness}%` }}
                          />
                        </View>
                        <Text className={`block text-xs font-semibold ${getCompletenessColor(narr.completeness)}`}>
                          {getCompletenessLabel(narr.completeness)} {narr.completeness}%
                        </Text>
                      </View>

                      {/* 游客引子 */}
                      {narr.visitor_hook && (
                        <View className="bg-amber-50 rounded-lg px-3 py-2 mb-3 border-l-2 border-amber-400">
                          <Text className="block text-sm text-amber-800 font-medium">
                            {narr.visitor_hook}
                          </Text>
                        </View>
                      )}

                      {/* 导览叙事正文 */}
                      <Text className="block text-sm text-stone-700 leading-relaxed mb-3">
                        {narr.narrative}
                      </Text>

                      {/* 关键引言 */}
                      {narr.key_quote && (
                        <View className="bg-purple-50 rounded-lg px-3 py-2 mb-3 border-l-2 border-purple-300">
                          <Text className="block text-xs text-purple-400 mb-1">最动人的话</Text>
                          <Text className="block text-sm text-purple-700 italic">
                            &ldquo;{narr.key_quote}&rdquo;
                          </Text>
                        </View>
                      )}

                      {/* 缺失信息 */}
                      {narr.missing_pieces && narr.missing_pieces.length > 0 && (
                        <View className="mt-2">
                          <Text className="block text-xs font-medium text-amber-600 mb-1">
                            还缺什么
                          </Text>
                          <View className="flex flex-wrap gap-1">
                            {narr.missing_pieces.map((piece, j) => (
                              <Badge key={j} className="bg-amber-50 text-amber-600 border-amber-200">
                                <Text className="text-xs">{piece}</Text>
                              </Badge>
                            ))}
                          </View>
                        </View>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </View>
          )}

          {/* 故事片段（原始素材） */}
          {result.fragments && result.fragments.length > 0 && (
            <View className="space-y-3">
              <Text className="block text-sm font-semibold text-stone-800">
                采访原文（点击展开方言/普通话对照）
              </Text>
              {result.fragments.map((frag, i) => {
                const cat = CATEGORY_META[frag.category] || { label: frag.category, icon: '📝', color: 'text-stone-600', bg: 'bg-stone-50' }
                const isExpanded = expandedFragment === i
                return (
                  <Card
                    key={`frag-${i}`}
                    className="border-stone-100 bg-white"
                    onClick={() => setExpandedFragment(isExpanded ? null : i)}
                  >
                    <CardContent className="p-4">
                      <View className="flex items-center gap-2 mb-2">
                        <Text className="block text-base">{frag.icon || cat.icon}</Text>
                        <Text className="block text-sm font-semibold text-stone-800 flex-1">
                          {frag.story_thread_name}
                        </Text>
                        <Badge className={`${cat.bg} ${cat.color} border-0`}>
                          <Text className="text-xs">{cat.label}</Text>
                        </Badge>
                      </View>
                      <View className="pl-3 border-l-2 border-amber-400 mb-2">
                        <Text className="block text-sm text-amber-700 font-medium">
                          {frag.summary}
                        </Text>
                      </View>
                      {frag.flags && frag.flags.length > 0 && (
                        <View className="flex flex-wrap gap-1">
                          {frag.flags.map((flag, j) => (
                            <Badge
                              key={j}
                              className={`text-xs ${
                                flag.includes('待核实')
                                  ? 'bg-red-50 text-red-600 border-red-200'
                                  : flag.includes('新发现')
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-blue-50 text-blue-600 border-blue-200'
                              }`}
                            >
                              <Text className="text-xs">{flag}</Text>
                            </Badge>
                          ))}
                        </View>
                      )}

                      {/* 展开详情 */}
                      {isExpanded && (
                        <View className="mt-3 space-y-2">
                          {frag.dialect_original && (
                            <View className="bg-purple-50 rounded-lg p-3">
                              <Text className="block text-xs text-purple-400 mb-1">方言原文</Text>
                              <Text className="block text-sm text-stone-700 italic">
                                {frag.dialect_original}
                              </Text>
                            </View>
                          )}
                          {frag.mandarin_text && (
                            <View className="bg-blue-50 rounded-lg p-3">
                              <Text className="block text-xs text-blue-400 mb-1">普通话转写</Text>
                              <Text className="block text-sm text-stone-600">
                                {frag.mandarin_text}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </View>
          )}

          {/* 人物档案 */}
          {result.characters && result.characters.length > 0 && (
            <View className="space-y-3">
              <View className="flex items-center gap-2">
                <Users size={18} color="#4D7C0F" />
                <Text className="block text-sm font-semibold text-stone-800">人物档案</Text>
              </View>
              {result.characters.map((char, i) => (
                <Card key={`char-${i}`} className="border-stone-100 bg-white">
                  <CardContent className="p-4">
                    <View className="flex items-center gap-3 mb-2">
                      <View className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center">
                        <Text className="block text-white font-bold text-base">
                          {char.name.charAt(0)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="block text-sm font-semibold text-stone-800">
                          {char.name}
                        </Text>
                        {char.aliases && char.aliases.length > 0 && (
                          <Text className="block text-xs text-stone-400">
                            又称：{char.aliases.join('、')}
                          </Text>
                        )}
                      </View>
                      <Badge className="bg-stone-100 text-stone-500 border-stone-200">
                        <Text className="text-xs">提及 {char.mention_count} 次</Text>
                      </Badge>
                    </View>
                    {char.tags && char.tags.length > 0 && (
                      <View className="flex flex-wrap gap-1 mb-2">
                        {char.tags.map((tag, j) => (
                          <Badge key={j} className="bg-amber-50 text-amber-700 border-amber-200">
                            <Text className="text-xs">{tag}</Text>
                          </Badge>
                        ))}
                      </View>
                    )}
                    <Text className="block text-sm text-stone-600 leading-relaxed mb-2">
                      {char.story}
                    </Text>
                    {char.key_quotes && char.key_quotes.length > 0 && (
                      <View className="bg-purple-50 rounded-lg px-3 py-2 border-l-2 border-purple-300">
                        {char.key_quotes.map((q, j) => (
                          <Text key={j} className="block text-sm text-purple-700 italic mb-1">
                            &ldquo;{q}&rdquo;
                          </Text>
                        ))}
                      </View>
                    )}
                    {char.related_story_threads && char.related_story_threads.length > 0 && (
                      <View className="flex flex-wrap gap-1 mt-2">
                        {char.related_story_threads.map((thread, j) => (
                          <Badge key={j} className="bg-blue-50 text-blue-600 border-blue-200">
                            <Text className="text-xs">📖 {thread}</Text>
                          </Badge>
                        ))}
                      </View>
                    )}
                    {char.verify_flags && char.verify_flags.length > 0 && (
                      <Text className="block text-xs text-amber-500 mt-2">
                        ⚠️ {char.verify_flags.join(' · ')}
                      </Text>
                    )}
                  </CardContent>
                </Card>
              ))}
            </View>
          )}

          {/* 下次采访建议 */}
          {result.next_interview_plan && result.next_interview_plan.length > 0 && (
            <View className="space-y-2">
              <Text className="block text-sm font-semibold text-stone-800">
                下次采访建议
              </Text>
              {result.next_interview_plan.map((plan, i) => (
                <View key={i} className="bg-amber-50 rounded-lg px-4 py-3 border-l-2 border-amber-400">
                  <Text className="block text-sm text-stone-700">{plan}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 跨故事线关联 */}
          {result.cross_references && result.cross_references.length > 0 && (
            <View className="space-y-2">
              <Text className="block text-sm font-semibold text-stone-800">
                跨故事线关联
              </Text>
              {result.cross_references.map((ref, i) => (
                <View key={i} className="bg-blue-50 rounded-lg px-4 py-3 border-l-2 border-blue-300">
                  <Text className="block text-sm text-stone-700">{ref}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

export default InterviewRecordPage
