import { View, Text } from '@tarojs/components'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BookOpen, Info, Heart } from 'lucide-react-taro'

const ProfilePage = () => {
  return (
    <View className="min-h-screen bg-stone-50 pb-20">
      {/* 头部 */}
      <View className="px-4 pt-6 pb-4">
        <Text className="block text-xl font-bold text-stone-800">我的</Text>
      </View>

      {/* 用户信息卡片 */}
      <View className="px-4 mb-4">
        <Card className="border-stone-100 bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <View className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
              <BookOpen size={28} color="#B45309" />
            </View>
            <View>
              <Text className="block text-base font-semibold text-stone-800">村庄记忆</Text>
              <Text className="block text-sm text-stone-500">记录村庄文化，传承集体记忆</Text>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 功能列表 */}
      <View className="px-4 mb-4">
        <Card className="border-stone-100 bg-white">
          <CardContent className="p-0">
            <View className="px-4 py-3 flex items-center gap-3">
              <Info size={20} color="#78716C" />
              <Text className="block text-sm text-stone-700 flex-1">关于村庄记忆</Text>
            </View>
            <Separator className="bg-stone-100" />
            <View className="px-4 py-3 flex items-center gap-3">
              <Heart size={20} color="#78716C" />
              <Text className="block text-sm text-stone-700 flex-1">使用帮助</Text>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 说明 */}
      <View className="px-4">
        <Card className="border-amber-100 bg-amber-50">
          <CardContent className="p-4">
            <Text className="block text-sm font-medium text-stone-800 mb-2">
              关于这个小程序
            </Text>
            <Text className="block text-xs text-stone-500 leading-relaxed">
              村庄记忆是一个帮助乡村图书馆记录村庄文化和老人记忆的AI助手。
              通过采访策划、录音转写、授权管理等工具，帮助孩子和大人们一起记录珍贵的村庄记忆。
            </Text>
            <Text className="block text-xs text-stone-400 mt-3">
              V1.0 | 话题：潮汕宗祠建筑设计
            </Text>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}

export default ProfilePage
