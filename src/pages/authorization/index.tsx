import { View, Text } from "@tarojs/components";
import { useState, useCallback } from "react";
import Taro, { useLoad, useRouter } from "@tarojs/taro";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Network } from "@/network";
import { ShieldCheck, Check, TriangleAlert } from "lucide-react-taro";

interface SubtopicAuthItem {
  id: string;
  name: string;
  icon: string;
  content_summary: string;
  transcript_status: string;
  pending_verify: string[];
  auth_level: string;
  auth_level_label: string;
  auth_level_icon: string;
  auth_method: string | null;
  auth_person: string | null;
  auth_time: string | null;
  can_auth: boolean;
}

interface AuthListData {
  topic_id: string;
  topic_name: string;
  subtopics: SubtopicAuthItem[];
  auth_levels: Array<{ value: string; label: string; icon: string }>;
}

const AUTH_OPTIONS = [
  { value: "archive", label: "仅存档", icon: "🔒", desc: "只有项目组能看" },
  { value: "village", label: "村内可见", icon: "🔓", desc: "村里的人能看" },
  { value: "public", label: "可对外分享", icon: "📢", desc: "经本人同意可以公开" },
];

const AuthorizationPage = () => {
  const router = useRouter();
  const topicId = router.params.topicId || "";

  const [authData, setAuthData] = useState<AuthListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  const fetchAuthList = useCallback(async () => {
    if (!topicId) return;
    try {
      setLoading(true);
      const res = await Network.request({
        url: `/api/topics/${topicId}/auth-list`,
      });
      console.log("Auth list:", res.data);
      const data = res.data?.data;
      if (data) {
        setAuthData(data);
      }
    } catch (err) {
      console.error("获取授权列表失败:", err);
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useLoad(() => {
    fetchAuthList();
  });

  const handleSetAuth = async (subId: string, level: string) => {
    try {
      setSaving(subId);
      const res = await Network.request({
        url: `/api/topics/${topicId}/subtopics/${subId}/auth`,
        method: "POST",
        data: {
          auth_level: level,
          auth_method: "口述同意",
          auth_person: "",
        },
      });
      console.log("Set auth:", res.data);
      if (res.data?.data) {
        Taro.showToast({ title: "授权已更新", icon: "success" });
        fetchAuthList();
      }
    } catch (err) {
      console.error("设置授权失败:", err);
      Taro.showToast({ title: "设置失败", icon: "none" });
    } finally {
      setSaving(null);
    }
  };

  const toggleExpand = (subId: string) => {
    setExpandedSub(expandedSub === subId ? null : subId);
  };

  if (loading) {
    return (
      <View className="min-h-screen bg-background p-4">
        <View className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </View>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="mb-3">
            <CardContent className="p-4">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </View>
    );
  }

  if (!authData) {
    return (
      <View className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Text className="block text-muted-foreground text-center">
          加载失败，请返回重试
        </Text>
      </View>
    );
  }

  const subs = authData.subtopics;
  const authedCount = subs.filter(
    (s) => s.auth_level !== "not_set",
  ).length;
  const totalCount = subs.length;

  return (
    <View className="min-h-screen bg-background pb-8">
      {/* Header */}
      <View className="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-4 pt-8 pb-5">
        <View className="flex items-center mb-2">
          <ShieldCheck size={24} color="#ffffff" className="mr-2" />
          <Text className="block text-xl font-bold text-white">
            授权确认
          </Text>
        </View>
        <Text className="block text-amber-100 text-sm mb-3">
          {authData.topic_name}
        </Text>
        <View className="flex items-center justify-between">
          <Text className="block text-amber-100 text-xs">
            已确认 {authedCount}/{totalCount} 个子话题
          </Text>
          <Text className="block text-amber-100 text-xs">
            老人随时可以改主意
          </Text>
        </View>
      </View>

      <View className="px-4 -mt-3">
        {/* 提示卡片 */}
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="p-3">
            <Text className="block text-xs text-amber-800 leading-relaxed">
              请告诉老人每段内容讲了什么，然后让他选择授权级别。每个子话题可以单独设置，不需要全部一样。
            </Text>
          </CardContent>
        </Card>

        {/* 子话题列表 */}
        {subs.map((sub) => {
          const isExpanded = expandedSub === sub.id;
          const currentAuth = AUTH_OPTIONS.find(
            (o) => o.value === sub.auth_level,
          );

          return (
            <Card key={sub.id} className="mb-3">
              <CardContent className="p-4">
                {/* 标题行 */}
                <View
                  className="flex items-center justify-between mb-2"
                  onClick={() => toggleExpand(sub.id)}
                >
                  <View className="flex items-center flex-1">
                    <Text className="block text-xl mr-2">
                      {sub.icon}
                    </Text>
                    <Text className="block text-base font-semibold text-foreground flex-1">
                      {sub.name}
                    </Text>
                  </View>
                  <Badge
                    variant={
                      sub.auth_level === "public"
                        ? "default"
                        : sub.auth_level === "village"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    <Text className="text-xs">
                      {sub.auth_level_icon} {sub.auth_level_label}
                    </Text>
                  </Badge>
                </View>

                {/* 内容摘要 */}
                <View className="bg-stone-50 rounded-lg p-3 mb-3">
                  <Text className="block text-xs text-muted-foreground mb-1">
                    这段内容讲了：
                  </Text>
                  <Text className="block text-sm text-foreground leading-relaxed">
                    {sub.content_summary}
                  </Text>
                </View>

                {/* 待核实项 */}
                {sub.pending_verify.length > 0 && (
                  <View className="flex flex-wrap gap-1 mb-3">
                    {sub.pending_verify.map((flag, i) => (
                      <View
                        key={i}
                        className="flex items-center bg-amber-100 rounded-full px-2 py-1"
                      >
                        <TriangleAlert
                          size={12}
                          color="#B45309"
                          className="mr-1"
                        />
                        <Text className="text-xs text-amber-800">
                          {flag.replace("⚠️ 待核实：", "")}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* 展开/收起授权选项 */}
                {sub.can_auth && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mb-2 w-full justify-center text-amber-700"
                      onClick={() => toggleExpand(sub.id)}
                    >
                      <Text className="text-sm text-amber-700">
                        {isExpanded
                          ? "收起"
                          : currentAuth
                            ? "修改授权"
                            : "设置授权"}
                      </Text>
                    </Button>

                    {isExpanded && (
                      <View className="space-y-2 mt-2">
                        {AUTH_OPTIONS.map((option) => {
                          const isSelected =
                            sub.auth_level === option.value;
                          const isSavingThis =
                            saving === sub.id;

                          return (
                            <Button
                              key={option.value}
                              variant={
                                isSelected ? "default" : "outline"
                              }
                              size="sm"
                              className="w-full justify-start"
                              disabled={isSavingThis}
                              onClick={() =>
                                handleSetAuth(sub.id, option.value)
                              }
                            >
                              <View className="flex items-center w-full">
                                <Text className="text-lg mr-2">
                                  {option.icon}
                                </Text>
                                <View className="flex-1">
                                  <Text className="block text-sm font-medium text-foreground">
                                    {option.label}
                                  </Text>
                                  <Text className="block text-xs text-muted-foreground">
                                    {option.desc}
                                  </Text>
                                </View>
                                {isSelected && (
                                  <Check
                                    size={16}
                                    color="#B45309"
                                  />
                                )}
                              </View>
                            </Button>
                          );
                        })}

                        {/* 授权记录 */}
                        {sub.auth_time && (
                          <>
                            <Separator className="my-2" />
                            <View className="bg-green-50 rounded-lg p-2">
                              <Text className="block text-xs text-green-800">
                                ✅ 上次授权：
                                {currentAuth?.icon}{" "}
                                {currentAuth?.label}
                                {sub.auth_method
                                  ? ` | ${sub.auth_method}`
                                  : ""}
                              </Text>
                              <Text className="block text-xs text-green-600 mt-1">
                                ⚠️ 以后可以改主意
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    )}
                  </>
                )}

                {/* 未转录提示 */}
                {!sub.can_auth && (
                  <View className="bg-stone-100 rounded-lg p-3">
                    <Text className="block text-xs text-muted-foreground text-center">
                      该子话题还没有采访记录，转录完成后可设置授权
                    </Text>
                  </View>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* 底部总览 */}
        {totalCount > 0 && (
          <Card className="mt-4 border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <Text className="block text-sm font-semibold text-amber-900 mb-2">
                授权总览
              </Text>
              <View className="flex flex-wrap gap-2">
                {subs.map((sub) => (
                  <View
                    key={sub.id}
                    className="flex items-center bg-white rounded-full px-3 py-1"
                  >
                    <Text className="text-sm mr-1">
                      {sub.icon}
                    </Text>
                    <Text className="text-xs text-foreground mr-1">
                      {sub.name}
                    </Text>
                    <Text className="text-xs">
                      {sub.auth_level_icon}
                    </Text>
                  </View>
                ))}
              </View>
              {authedCount === totalCount && totalCount > 0 && (
                <View className="mt-3 bg-green-100 rounded-lg p-2">
                  <Text className="block text-xs text-green-800 text-center">
                    🎉 全部确认完毕！
                  </Text>
                </View>
              )}
            </CardContent>
          </Card>
        )}
      </View>
    </View>
  );
};

export default AuthorizationPage;
