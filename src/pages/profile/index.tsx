import { View, Text } from '@tarojs/components'
import { useState, useCallback } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Network } from '@/network'
import {
  DISPLAY_NAME_KEY,
  OPERATOR_ROLE_LABEL_KEY,
  PROJECT_CODE_KEY,
  generateOperatorToken,
  getStoredOperatorIdentity,
  saveStoredOperatorIdentity,
} from '@/identity'
import { BookOpen, History, ShieldCheck, UserRound } from 'lucide-react-taro'

interface OperatorInfo {
  id: string
  project_id: string
  display_name: string
  role: 'admin' | 'editor' | 'viewer'
  role_label: string
  operator_token: string
  note?: string | null
}

interface ActivityLog {
  id: string
  operator_name: string
  action_type: string
  target_type: string
  target_name?: string | null
  summary: string
  created_at: string
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-amber-100 text-amber-800',
  editor: 'bg-green-100 text-green-800',
  viewer: 'bg-stone-100 text-stone-700',
}

const formatDateTime = (value?: string) => {
  if (!value) return '时间未知'
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ProfilePage = () => {
  const stored = getStoredOperatorIdentity()
  const [operator, setOperator] = useState<OperatorInfo | null>(null)
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState(stored.displayName)
  const [projectCode, setProjectCode] = useState(stored.projectCode || 'village-memory')
  const [roleCode, setRoleCode] = useState('')
  const [note, setNote] = useState('')

  const loadMe = useCallback(async () => {
    const identity = getStoredOperatorIdentity()
    if (!identity.token) return
    try {
      setLoading(true)
      const res = await Network.request({ url: '/api/operators/me' })
      const data = res.data?.data
      if (data) {
        setOperator(data)
        setDisplayName(data.display_name || identity.displayName)
        setProjectCode(data.project_id || identity.projectCode || 'village-memory')
        setNote(data.note || '')
        saveStoredOperatorIdentity({
          token: data.operator_token || identity.token,
          projectCode: data.project_id || identity.projectCode,
          displayName: data.display_name || identity.displayName,
          role: data.role,
          roleLabel: data.role_label,
        })
      }
      await loadLogs()
    } catch (err) {
      console.error('读取当前身份失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadLogs = async () => {
    try {
      const res = await Network.request({ url: '/api/activity-logs' })
      const data = res.data?.data
      if (data) setLogs(data)
    } catch (err) {
      console.error('读取操作记录失败:', err)
    }
  }

  useDidShow(() => {
    loadMe()
  })

  const handleSaveIdentity = async () => {
    if (!displayName.trim()) {
      Taro.showToast({ title: '请填写名字', icon: 'none' })
      return
    }
    if (!projectCode.trim()) {
      Taro.showToast({ title: '请填写项目码', icon: 'none' })
      return
    }
    if (!roleCode.trim()) {
      Taro.showToast({ title: '请填写角色码', icon: 'none' })
      return
    }

    const current = getStoredOperatorIdentity()
    const token = current.token || generateOperatorToken()

    try {
      setSaving(true)
      const res = await Network.request({
        url: '/api/operators/identify',
        method: 'POST',
        data: {
          display_name: displayName.trim(),
          project_code: projectCode.trim(),
          role_code: roleCode.trim(),
          operator_token: token,
          note: note.trim() || undefined,
        },
      })
      const data = res.data?.data
      if (data) {
        saveStoredOperatorIdentity({
          token: data.operator_token,
          projectCode: data.project_id,
          displayName: data.display_name,
          role: data.role,
          roleLabel: data.role_label,
        })
        Taro.setStorageSync(DISPLAY_NAME_KEY, data.display_name)
        Taro.setStorageSync(PROJECT_CODE_KEY, data.project_id)
        Taro.setStorageSync(OPERATOR_ROLE_LABEL_KEY, data.role_label)
        setOperator(data)
        setRoleCode('')
        Taro.showToast({ title: '身份已保存', icon: 'success' })
        await loadLogs()
      }
    } catch (err) {
      console.error('保存身份失败:', err)
      Taro.showToast({ title: '角色码不正确或保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const roleColor = operator ? ROLE_COLORS[operator.role] || ROLE_COLORS.viewer : ROLE_COLORS.viewer

  return (
    <View className="min-h-screen bg-stone-50 pb-20">
      <View className="px-4 pt-6 pb-4">
        <Text className="block text-xl font-bold text-stone-800">我的身份</Text>
        <Text className="block text-sm text-stone-500 mt-1">
          用名字和角色码加入项目，不需要账号注册
        </Text>
      </View>

      <View className="px-4 mb-4">
        <Card className="border-stone-100 bg-white">
          <CardContent className="p-4">
            {loading ? (
              <>
                <Skeleton className="h-8 w-40 mb-3" />
                <Skeleton className="h-5 w-60" />
              </>
            ) : operator ? (
              <View className="flex items-center justify-between">
                <View className="flex items-center flex-1">
                  <View className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mr-3">
                    <UserRound size={24} color="#92400E" />
                  </View>
                  <View className="flex-1">
                    <Text className="block text-base font-semibold text-stone-800">
                      {operator.display_name}
                    </Text>
                    <Text className="block text-xs text-stone-500 mt-1">
                      项目：{operator.project_id}
                    </Text>
                  </View>
                </View>
                <Badge className={roleColor}>
                  <Text className="text-xs">{operator.role_label}</Text>
                </Badge>
              </View>
            ) : (
              <View className="flex items-center">
                <View className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mr-3">
                  <ShieldCheck size={24} color="#78716C" />
                </View>
                <View className="flex-1">
                  <Text className="block text-base font-semibold text-stone-800">
                    还没有设置身份
                  </Text>
                  <Text className="block text-xs text-stone-500 mt-1">
                    设置后才能新增、编辑或删除内容
                  </Text>
                </View>
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      <View className="px-4 mb-4">
        <Card className="border-stone-100 bg-white">
          <CardContent className="p-4">
            <View className="flex items-center mb-4">
              <ShieldCheck size={18} color="#92400E" className="mr-2" />
              <Text className="block text-base font-semibold text-stone-800">
                设置我的名字
              </Text>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="block text-xs font-medium text-stone-700 mb-2">姓名/昵称</Text>
                <Input
                  value={displayName}
                  placeholder="例如：木兰、志愿者小陈"
                  onInput={(event) => setDisplayName(String(event.detail.value || ''))}
                />
              </View>

              <View>
                <Text className="block text-xs font-medium text-stone-700 mb-2">项目码</Text>
                <Input
                  value={projectCode}
                  placeholder="例如：village-memory"
                  onInput={(event) => setProjectCode(String(event.detail.value || ''))}
                />
              </View>

              <View>
                <Text className="block text-xs font-medium text-stone-700 mb-2">角色码</Text>
                <Input
                  value={roleCode}
                  password
                  placeholder="输入管理员、协作者或只读角色码"
                  onInput={(event) => setRoleCode(String(event.detail.value || ''))}
                />
                <Text className="block text-xs text-stone-400 mt-1">
                  角色码由项目负责人发放，用来区分管理员、协作者和只读。
                </Text>
              </View>

              <View>
                <Text className="block text-xs font-medium text-stone-700 mb-2">备注（可选）</Text>
                <Textarea
                  value={note}
                  placeholder="例如：学校、村庄、团队身份"
                  className="h-20"
                  onInput={(event) => setNote(String(event.detail.value || ''))}
                />
              </View>

              <Button
                className="w-full bg-amber-700 text-white"
                disabled={saving}
                onClick={handleSaveIdentity}
              >
                <Text>{saving ? '保存中...' : operator ? '更新身份' : '保存身份'}</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      </View>

      <View className="px-4 mb-4">
        <Card className="border-stone-100 bg-white">
          <CardContent className="p-4">
            <View className="flex items-center mb-3">
              <History size={18} color="#57534E" className="mr-2" />
              <Text className="block text-base font-semibold text-stone-800">
                最近操作
              </Text>
            </View>

            {operator ? (
              logs.length > 0 ? (
                <View>
                  {logs.map((log) => (
                    <View key={log.id} className="py-3 border-b border-stone-100 last:border-0">
                      <Text className="block text-sm text-stone-800">{log.summary}</Text>
                      <Text className="block text-xs text-stone-400 mt-1">
                        {formatDateTime(log.created_at)} / {log.target_name || log.target_type}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="block text-sm text-stone-500 text-center py-4">
                  还没有操作记录
                </Text>
              )
            ) : (
              <Text className="block text-sm text-stone-500 text-center py-4">
                设置身份后可以查看最近操作
              </Text>
            )}
          </CardContent>
        </Card>
      </View>

      <View className="px-4">
        <Card className="border-amber-100 bg-amber-50">
          <CardContent className="p-4">
            <View className="flex items-center mb-2">
              <BookOpen size={16} color="#92400E" className="mr-2" />
              <Text className="block text-sm font-medium text-stone-800">
                关于身份
              </Text>
            </View>
            <Text className="block text-xs text-stone-600 leading-relaxed">
              这里的身份只用于村庄记忆项目内署名和基础权限，不绑定手机号、邮箱或密码。换设备时可以重新设置名字和角色码。
            </Text>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}

export default ProfilePage
