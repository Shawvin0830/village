import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Network } from '@/network'
import { Mic, Square, Upload, FileText } from 'lucide-react-taro'

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
    segments: Array<{
      subtopic_name: string
      dialect_original: string
      mandarin_text: string
      flags: string[]
    }>
  } | null>(null)
  const [textInput, setTextInput] = useState('')
  const [useTextMode, setUseTextMode] = useState(false)

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
        console.error('录音错误', err)
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

  return (
    <View className="min-h-screen bg-stone-50 pb-8">
      {/* 头部 */}
      <View className="px-4 pt-6 pb-4">
        <View className="flex items-center gap-2 mb-2">
          <Mic size={24} color="#4D7C0F" />
          <Text className="block text-xl font-bold text-stone-800">录音转写</Text>
        </View>
        <Text className="block text-sm text-stone-500">
          录音后 AI 自动转写并按子话题分段整理
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
                  placeholder="将采访内容粘贴或输入到这里，AI 会帮你按子话题分段整理..."
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

      {/* 转写结果 */}
      {result && (
        <View className="px-4 space-y-4">
          <Text className="block text-base font-semibold text-stone-800">整理结果</Text>

          {/* 原始转写 */}
          {result.transcript && (
            <Card className="border-stone-100 bg-white">
              <CardContent className="p-4">
                <Text className="block text-sm font-medium text-stone-700 mb-2">原始转写</Text>
                <Text className="block text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
                  {result.transcript}
                </Text>
              </CardContent>
            </Card>
          )}

          {/* 分段结果 */}
          {result.segments && result.segments.map((seg, i) => (
            <Card key={i} className="border-stone-100 bg-white">
              <CardContent className="p-4">
                <Text className="block text-sm font-semibold text-stone-800 mb-2">
                  📝 {seg.subtopic_name}
                </Text>
                {seg.dialect_original && (
                  <View className="bg-amber-50 rounded-lg p-3 mb-2">
                    <Text className="block text-xs text-amber-700 mb-1">方言原话</Text>
                    <Text className="block text-sm text-stone-700 italic">
                      {seg.dialect_original}
                    </Text>
                  </View>
                )}
                {seg.mandarin_text && (
                  <View className="mb-2">
                    <Text className="block text-xs text-stone-400 mb-1">普通话转写</Text>
                    <Text className="block text-sm text-stone-600">{seg.mandarin_text}</Text>
                  </View>
                )}
                {seg.flags && seg.flags.length > 0 && (
                  <View className="flex flex-wrap gap-1 mt-2">
                    {seg.flags.map((flag, j) => (
                      <Badge
                        key={j}
                        className={`text-xs ${
                          flag.includes('待核实')
                            ? 'bg-red-50 text-red-600'
                            : flag.includes('新发现')
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-green-50 text-green-700'
                        }`}
                      >
                        <Text className="text-xs">{flag}</Text>
                      </Badge>
                    ))}
                  </View>
                )}
              </CardContent>
            </Card>
          ))}
        </View>
      )}
    </View>
  )
}

export default InterviewRecordPage
