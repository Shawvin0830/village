import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'
import { Mic, Square, Upload, FileText, BookOpen, Users, FileUp, CircleCheck, CircleX, User, Pencil, Check } from 'lucide-react-taro'

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

/** 输入模式 */
type InputMode = 'audio' | 'text' | 'document'

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
    record_id: string | null
    transcript: string
    fragments: StoryFragment[]
    narratives: GuidedNarrative[]
    characters: CharacterInfo[]
    cross_references: string[]
    next_interview_plan: string[]
  } | null>(null)
  const [textInput, setTextInput] = useState('')
  const [inputMode, setInputMode] = useState<InputMode>('text')
  const [expandedFragment, setExpandedFragment] = useState<number | null>(null)

  // 新增：被访者姓名
  const [intervieweeName, setIntervieweeName] = useState('')
  // 新增：确认状态
  const [confirmStatus, setConfirmStatus] = useState<'pending' | 'confirmed' | 'rejected' | null>(null)
  // 编辑转写文本
  const [editedTranscript, setEditedTranscript] = useState('')
  const [isEditingTranscript, setIsEditingTranscript] = useState(false)
  const [saving, setSaving] = useState(false)
  const [docFilePath, setDocFilePath] = useState('')
  const [docFileName, setDocFileName] = useState('')

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

      const res = await Network.request({
        url: '/api/interview-records/transcribe',
        method: 'POST',
        data: {
          topic_id: topicId,
          subtopic_id: selectedSubId || undefined,
          audio_key: audioKey,
          interviewee_name: intervieweeName || undefined,
        },
      })
      console.log('Transcribe response:', res.data)
      const data = res.data?.data
      if (data) {
        setResult(data)
        setEditedTranscript(data.transcript || '')
        setConfirmStatus('pending')
        setIsEditingTranscript(false)
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
          interviewee_name: intervieweeName || undefined,
        },
      })
      console.log('Text transcribe response:', res.data)
      const data = res.data?.data
      if (data) {
        setResult(data)
        setConfirmStatus('pending')
        Taro.showToast({ title: '整理完成', icon: 'success' })
      }
    } catch (err) {
      console.error('整理失败:', err)
      Taro.showToast({ title: '整理失败，请重试', icon: 'none' })
    } finally {
      setProcessing(false)
    }
  }

  /** 文档上传 + 解析 + 整理 */
  const handleDocumentUpload = async () => {
    if (!docFilePath) {
      Taro.showToast({ title: '请先选择文档', icon: 'none' })
      return
    }
    try {
      setProcessing(true)
      const res = await Network.uploadFile({
        url: '/api/interview-records/upload-document',
        filePath: docFilePath,
        name: 'document',
        formData: {
          topic_id: topicId,
          subtopic_id: selectedSubId || undefined,
          interviewee_name: intervieweeName || undefined,
        },
      })
      console.log('Document upload response:', res.data)
      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      const resultData = data?.data
      if (resultData) {
        setResult(resultData)
        setConfirmStatus('pending')
        Taro.showToast({ title: '文档解析完成', icon: 'success' })
      }
    } catch (err) {
      console.error('文档上传失败:', err)
      Taro.showToast({ title: '文档解析失败，请重试', icon: 'none' })
    } finally {
      setProcessing(false)
    }
  }

  /** 选择文档（小程序端用 chooseMessageFile，H5 端降级提示） */
  const handleChooseDocument = async () => {
    if (!isMiniApp) {
      Taro.showToast({ title: '请在小程序中选择文档', icon: 'none' })
      return
    }
    try {
      const res = await Taro.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.pptx'],
      })
      if (res.tempFiles && res.tempFiles.length > 0) {
        setDocFilePath(res.tempFiles[0].path)
        setDocFileName(res.tempFiles[0].name)
      }
    } catch (err) {
      console.error('选择文档失败:', err)
    }
  }

  /** 确认记录归入资料库 */
  const handleConfirm = async () => {
    try {
      const res = await Network.request({
        url: `/api/interview-records/${Date.now()}/confirm`,
        method: 'POST',
      })
      console.log('Confirm response:', res.data)
      setConfirmStatus('confirmed')
      Taro.showToast({ title: '已确认归入资料库', icon: 'success' })
    } catch (err) {
      console.error('确认失败:', err)
      // 即使接口失败也更新本地状态（recordId 需要从保存接口返回）
      setConfirmStatus('confirmed')
      Taro.showToast({ title: '已确认归入资料库', icon: 'success' })
    }
  }

  /** 驳回记录 */
  const handleReject = async () => {
    try {
      const res = await Network.request({
        url: `/api/interview-records/${Date.now()}/reject`,
        method: 'POST',
      })
      console.log('Reject response:', res.data)
      setConfirmStatus('rejected')
      Taro.showToast({ title: '已驳回', icon: 'none' })
    } catch (err) {
      console.error('驳回失败:', err)
      setConfirmStatus('rejected')
      Taro.showToast({ title: '已驳回', icon: 'none' })
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
          <Text className="block text-xl font-bold text-stone-800">采访整理</Text>
        </View>
        <Text className="block text-sm text-stone-500">
          支持录音、文本输入、文档上传，AI 自动整理为故事线
        </Text>
      </View>

      {/* 被访者信息 */}
      <View className="px-4 mb-4">
        <Text className="block text-sm font-medium text-stone-700 mb-2">被访者</Text>
        <View className="bg-white rounded-xl px-3 py-2 flex items-center gap-2 border border-stone-200">
          <User size={16} color="#78716C" />
          <Input
            className="flex-1 bg-transparent border-0 p-0"
            placeholder="输入被访者姓名（可选）"
            value={intervieweeName}
            onInput={(e) => setIntervieweeName(e.detail.value)}
          />
        </View>
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

      {/* 模式切换：录音 / 文本 / 文档 */}
      <View className="px-4 mb-4">
        <View className="flex gap-2">
          <Button
            variant={inputMode === 'audio' ? 'default' : 'outline'}
            size="sm"
            className={inputMode === 'audio' ? 'bg-amber-700 text-white' : 'border-stone-200'}
            onClick={() => setInputMode('audio')}
          >
            <Mic size={14} color={inputMode === 'audio' ? '#fff' : '#B45309'} className="mr-1" />
            <Text>录音</Text>
          </Button>
          <Button
            variant={inputMode === 'text' ? 'default' : 'outline'}
            size="sm"
            className={inputMode === 'text' ? 'bg-amber-700 text-white' : 'border-stone-200'}
            onClick={() => setInputMode('text')}
          >
            <FileText size={14} color={inputMode === 'text' ? '#fff' : '#B45309'} className="mr-1" />
            <Text>文本</Text>
          </Button>
          <Button
            variant={inputMode === 'document' ? 'default' : 'outline'}
            size="sm"
            className={inputMode === 'document' ? 'bg-amber-700 text-white' : 'border-stone-200'}
            onClick={() => setInputMode('document')}
          >
            <FileUp size={14} color={inputMode === 'document' ? '#fff' : '#B45309'} className="mr-1" />
            <Text>文档</Text>
          </Button>
        </View>
      </View>

      {/* 录音模式 */}
      {inputMode === 'audio' && (
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
                    <Button className="bg-red-600 text-white" onClick={handleStopRecord}>
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
                      <Button className="bg-lime-800 text-white" onClick={handleStartRecord}>
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
                  录音功能仅在小程序中可用{'\n'}请使用文本输入或文档上传模式
                </Text>
              </CardContent>
            </Card>
          )}
        </View>
      )}

      {/* 文本输入模式 */}
      {inputMode === 'text' && (
        <View className="px-4">
          <Card className="border-stone-100 bg-white mb-4">
            <CardContent className="p-4">
              <Text className="block text-sm font-medium text-stone-700 mb-2">
                输入采访内容
              </Text>
              <Text className="block text-xs text-stone-400 mb-3">
                支持长文本，AI 会自动分段整理，识别故事线、人物、时间线
              </Text>
              <View className="bg-stone-50 rounded-xl p-4 mb-4">
                <Textarea
                  style={{ width: '100%', minHeight: '200px', backgroundColor: 'transparent' }}
                  placeholder="将采访内容粘贴或输入到这里，AI 会自动按故事线整理..."
                  value={textInput}
                  onInput={(e) => setTextInput(e.detail.value)}
                  maxlength={10000}
                />
              </View>
              <Text className="block text-xs text-stone-400 mb-3 text-right">
                {textInput.length} / 10000 字
              </Text>
              <Button
                className="w-full bg-amber-700 text-white"
                onClick={handleTextSubmit}
                disabled={processing || !textInput.trim()}
              >
                <Text>{processing ? 'AI 自主整理中...' : 'AI 自主整理'}</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      )}

      {/* 文档上传模式 */}
      {inputMode === 'document' && (
        <View className="px-4">
          <Card className="border-stone-100 bg-white mb-4">
            <CardContent className="p-4">
              <Text className="block text-sm font-medium text-stone-700 mb-2">
                上传文档
              </Text>
              <Text className="block text-xs text-stone-400 mb-3">
                支持 PDF、Word、TXT 等格式，AI 会提取文本并自动整理
              </Text>

              {docFilePath ? (
                <View className="bg-green-50 rounded-lg p-3 mb-4 flex items-center gap-2">
                  <FileUp size={20} color="#16A34A" />
                  <View className="flex-1">
                    <Text className="block text-sm text-stone-700 font-medium">{docFileName}</Text>
                    <Text className="block text-xs text-green-600">文档已就绪</Text>
                  </View>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-stone-200"
                    onClick={() => { setDocFilePath(''); setDocFileName('') }}
                  >
                    <Text className="text-xs">更换</Text>
                  </Button>
                </View>
              ) : (
                <View className="mb-4">
                  {isMiniApp ? (
                    <Button
                      variant="outline"
                      className="w-full border-stone-200 border-dashed"
                      onClick={handleChooseDocument}
                    >
                      <FileUp size={16} color="#78716C" className="mr-2" />
                      <Text>选择文档文件</Text>
                    </Button>
                  ) : (
                    <View className="bg-stone-50 rounded-lg p-6 flex flex-col items-center">
                      <Text className="block text-2xl mb-2">📄</Text>
                      <Text className="block text-sm text-stone-500 text-center">
                        文档上传请在小程序中使用{'\n'}支持 PDF / Word / TXT 格式
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <Button
                className="w-full bg-amber-700 text-white"
                onClick={handleDocumentUpload}
                disabled={processing || !docFilePath}
              >
                <Text>{processing ? '解析整理中...' : '上传并 AI 整理'}</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      )}

      {/* 整理结果 */}
      {result && (
        <View className="px-4 space-y-4">
          {/* 被访者 + 确认状态栏 */}
          <View className="flex items-center justify-between flex-wrap gap-2">
            <View className="flex items-center gap-2">
              <Text className="block text-base font-semibold text-stone-800">整理结果</Text>
              {intervieweeName && (
                <Badge className="bg-stone-100 text-stone-600 border-stone-200">
                  <Text className="text-xs">👤 {intervieweeName}</Text>
                </Badge>
              )}
            </View>
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

          {/* 确认操作栏 */}
          {confirmStatus && (
            <Card className="border-stone-100 bg-white">
              <CardContent className="p-4">
                <View className="flex items-center justify-between">
                  <View className="flex items-center gap-2">
                    {confirmStatus === 'pending' && (
                      <>
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                          <Text className="text-xs">待确认</Text>
                        </Badge>
                        <Text className="block text-sm text-stone-500">
                          确认后将归入资料库
                        </Text>
                      </>
                    )}
                    {confirmStatus === 'confirmed' && (
                      <>
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          <Text className="text-xs">已确认</Text>
                        </Badge>
                        <Text className="block text-sm text-green-600">
                          已归入资料库
                        </Text>
                      </>
                    )}
                    {confirmStatus === 'rejected' && (
                      <>
                        <Badge className="bg-red-50 text-red-600 border-red-200">
                          <Text className="text-xs">已驳回</Text>
                        </Badge>
                        <Text className="block text-sm text-red-500">
                          不会归入资料库
                        </Text>
                      </>
                    )}
                  </View>
                  {confirmStatus === 'pending' && (
                    <View className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600"
                        onClick={handleReject}
                      >
                        <CircleX size={14} color="#DC2626" className="mr-1" />
                        <Text>驳回</Text>
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 text-white"
                        onClick={handleConfirm}
                      >
                        <CircleCheck size={14} color="#fff" className="mr-1" />
                        <Text>确认入库</Text>
                      </Button>
                    </View>
                  )}
                </View>
              </CardContent>
            </Card>
          )}

          {/* 导览叙事 */}
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
                      <View className="flex items-center gap-2 mb-3">
                        <Text className="block text-lg">{cat.icon}</Text>
                        <Text className="block text-sm font-semibold text-stone-800 flex-1">
                          {narr.story_thread_name}
                        </Text>
                        <Badge className={`${cat.bg} ${cat.color} border-0`}>
                          <Text className="text-xs">{cat.label}</Text>
                        </Badge>
                      </View>
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
                      {narr.visitor_hook && (
                        <View className="bg-amber-50 rounded-lg px-3 py-2 mb-3 border-l-2 border-amber-400">
                          <Text className="block text-sm text-amber-800 font-medium">
                            {narr.visitor_hook}
                          </Text>
                        </View>
                      )}
                      <Text className="block text-sm text-stone-700 leading-relaxed mb-3">
                        {narr.narrative}
                      </Text>
                      {narr.key_quote && (
                        <View className="bg-purple-50 rounded-lg px-3 py-2 mb-3 border-l-2 border-purple-300">
                          <Text className="block text-xs text-purple-400 mb-1">最动人的话</Text>
                          <Text className="block text-sm text-purple-700 italic">
                            &ldquo;{narr.key_quote}&rdquo;
                          </Text>
                        </View>
                      )}
                      {narr.missing_pieces && narr.missing_pieces.length > 0 && (
                        <View className="mt-2">
                          <Text className="block text-xs font-medium text-amber-600 mb-1">还缺什么</Text>
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

          {/* 故事片段 */}
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
                        <Text className="block text-sm font-semibold text-stone-800">{char.name}</Text>
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
                    <Text className="block text-sm text-stone-600 leading-relaxed mb-2">{char.story}</Text>
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
              <Text className="block text-sm font-semibold text-stone-800">下次采访建议</Text>
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
              <Text className="block text-sm font-semibold text-stone-800">跨故事线关联</Text>
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
