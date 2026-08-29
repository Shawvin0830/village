import { View, Text } from "@tarojs/components";
import { useState, useCallback } from "react";
import Taro, { useLoad, useRouter } from "@tarojs/taro";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Network } from "@/network";
import {
  Check,
  FileText,
  ShieldCheck,
  Tags,
  TriangleAlert,
  UserRound,
  Users,
} from "lucide-react-taro";

interface IntervieweeOverview {
  name: string;
  age?: string | null;
  occupation?: string | null;
  role?: string | null;
  tags?: string[];
  claim_count: number;
}

interface SubtopicAuthItem {
  id: string;
  name: string;
  icon: string;
  content_summary: string;
  source_label: string;
  source_excerpt: string;
  interviewees?: IntervieweeOverview[];
  transcript_status: string;
  verify_status: string;
  pending_verify?: string[];
  risk_warnings?: string[];
  auth_level: string;
  auth_level_label: string;
  auth_level_icon: string;
  auth_method: string | null;
  auth_person: string | null;
  auth_time: string | null;
  auth_restriction: string | null;
  can_auth: boolean;
}

interface AuthListData {
  topic_id: string;
  topic_name: string;
  interviewees?: IntervieweeOverview[];
  subtopics: SubtopicAuthItem[];
  auth_levels: Array<{ value: string; label: string; icon: string }>;
}

interface AuthFormState {
  level: string;
  method: string;
  person: string;
  restriction: string;
}

const AUTH_OPTIONS = [
  { value: "archive", label: "仅存档", icon: "🔒", desc: "只给项目组保存，不展示" },
  { value: "village", label: "村内可见", icon: "🔓", desc: "可在村图书馆、村内活动中使用" },
  { value: "public", label: "可对外分享", icon: "📢", desc: "可用于展板、文章、网页或对外分享" },
];

const METHOD_OPTIONS = [
  { value: "verbal", label: "口述" },
  { value: "written", label: "书面" },
  { value: "other", label: "其他" },
];

const normalizeMethod = (method?: string | null) => {
  if (!method) return "verbal";
  if (method.includes("书面") || method === "written") return "written";
  if (method.includes("其他") || method === "other") return "other";
  return "verbal";
};

const AuthorizationPage = () => {
  const router = useRouter();
  const topicId = router.params.topicId || "";

  const [authData, setAuthData] = useState<AuthListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, AuthFormState>>({});

  const fetchAuthList = useCallback(async () => {
    if (!topicId) return;
    try {
      setLoading(true);
      const res = await Network.request({
        url: `/api/topics/${topicId}/auth-list`,
      });
      const data = res.data?.data;
      if (data) {
        setAuthData(data);
      }
    } catch (err) {
      console.error("获取授权列表失败:", err);
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useLoad(() => {
    fetchAuthList();
  });

  const getForm = (sub: SubtopicAuthItem): AuthFormState => {
    return (
      formState[sub.id] || {
        level: sub.auth_level !== "not_set" ? sub.auth_level : "village",
        method: normalizeMethod(sub.auth_method),
        person: sub.auth_person || sub.interviewees?.[0]?.name || "",
        restriction: sub.auth_restriction || "",
      }
    );
  };

  const updateForm = (subId: string, patch: Partial<AuthFormState>) => {
    const sub = authData?.subtopics.find((item) => item.id === subId);
    if (!sub) return;
    setFormState((current) => ({
      ...current,
      [subId]: {
        ...getForm(sub),
        ...patch,
      },
    }));
  };

  const handleSetAuth = async (sub: SubtopicAuthItem) => {
    const form = getForm(sub);
    if (!form.person.trim()) {
      Taro.showToast({ title: "请填写授权人", icon: "none" });
      return;
    }

    try {
      setSaving(sub.id);
      const res = await Network.request({
        url: `/api/topics/${topicId}/subtopics/${sub.id}/auth`,
        method: "POST",
        data: {
          auth_level: form.level,
          auth_method: form.method,
          auth_person: form.person.trim(),
          restriction: form.restriction.trim(),
        },
      });
      if (res.data?.data) {
        Taro.showToast({ title: "授权已保存", icon: "success" });
        setExpandedSub(res.data.data.next_subtopic_id || null);
        fetchAuthList();
      }
    } catch (err) {
      console.error("设置授权失败:", err);
      Taro.showToast({ title: "保存失败，请重试", icon: "none" });
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
  const interviewees = authData.interviewees || [];
  const authedCount = subs.filter((s) => s.auth_level !== "not_set").length;
  const totalCount = subs.length;

  return (
    <View className="min-h-screen bg-background pb-8">
      <View className="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-4 pt-8 pb-5">
        <View className="flex items-center mb-2">
          <ShieldCheck size={24} color="#ffffff" className="mr-2" />
          <Text className="block text-xl font-bold text-white">授权管理</Text>
        </View>
        <Text className="block text-amber-100 text-sm mb-3">
          {authData.topic_name}
        </Text>
        <View className="flex items-center justify-between">
          <Text className="block text-amber-100 text-xs">
            已确认 {authedCount}/{totalCount} 个子话题
          </Text>
          <Text className="block text-amber-100 text-xs">老人以后可以修改授权</Text>
        </View>
      </View>

      <View className="px-4 -mt-3">
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="p-3">
            <Text className="block text-xs text-amber-800 leading-relaxed">
              请先让老人知道每段内容讲了什么，再逐段确认使用范围。授权状态和事实核实状态分开：可公开不代表已核实。
            </Text>
          </CardContent>
        </Card>

        {interviewees.length > 0 && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <View className="flex items-center mb-3">
                <Users size={18} color="#92400E" className="mr-2" />
                <Text className="block text-base font-semibold text-foreground">
                  受访人概览
                </Text>
              </View>
              <View className="space-y-3">
                {interviewees.map((person) => (
                  <View key={person.name} className="bg-stone-50 rounded-lg p-3">
                    <View className="flex items-center justify-between mb-1">
                      <View className="flex items-center">
                        <UserRound size={16} color="#57534E" className="mr-1" />
                        <Text className="text-sm font-semibold text-foreground">
                          {person.name}
                        </Text>
                      </View>
                      <Text className="text-xs text-amber-700">
                        贡献 {person.claim_count} 条信息点
                      </Text>
                    </View>
                    <Text className="block text-xs text-muted-foreground mb-2">
                      {(person.age || "年龄待补充") +
                        " / " +
                        (person.occupation || person.role || "身份待补充")}
                    </Text>
                    <View className="flex flex-wrap gap-1">
                      {((person.tags || []).length > 0 ? person.tags || [] : ["待补充标签"]).map(
                        (tag) => (
                          <Badge key={`${person.name}-${tag}`} variant="outline">
                            <Text className="text-xs">{tag}</Text>
                          </Badge>
                        ),
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        )}

        {subs.map((sub) => {
          const isExpanded = expandedSub === sub.id;
          const currentAuth = AUTH_OPTIONS.find((o) => o.value === sub.auth_level);
          const form = getForm(sub);
          const pendingVerify = sub.pending_verify || [];
          const riskWarnings = sub.risk_warnings || [];
          const isPublicPending =
            form.level === "public" && sub.verify_status === "pending";

          return (
            <Card key={sub.id} className="mb-3">
              <CardContent className="p-4">
                <View
                  className="flex items-center justify-between mb-2"
                  onClick={() => toggleExpand(sub.id)}
                >
                  <View className="flex items-center flex-1">
                    <Text className="block text-xl mr-2">{sub.icon}</Text>
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

                <View className="bg-stone-50 rounded-lg p-3 mb-3">
                  <Text className="block text-xs text-muted-foreground mb-1">
                    这段内容讲了：
                  </Text>
                  <Text className="block text-sm text-foreground leading-relaxed">
                    {sub.content_summary}
                  </Text>
                </View>

                <View className="bg-white rounded-lg border border-stone-100 p-3 mb-3">
                  <View className="flex items-center mb-1">
                    <FileText size={14} color="#78716C" className="mr-1" />
                    <Text className="text-xs text-muted-foreground">
                      信息来源：{sub.source_label}
                    </Text>
                  </View>
                  <Text className="block text-xs text-stone-600 leading-relaxed">
                    {sub.source_excerpt || "暂无采访整理文档摘录"}
                  </Text>
                </View>

                {pendingVerify.length > 0 && (
                  <View className="flex flex-wrap gap-1 mb-3">
                    {pendingVerify.map((flag, i) => (
                      <View
                        key={i}
                        className="flex items-center bg-amber-100 rounded-full px-2 py-1"
                      >
                        <TriangleAlert size={12} color="#B45309" className="mr-1" />
                        <Text className="text-xs text-amber-800">
                          {flag.replace("⚠️ 待核实：", "")}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {riskWarnings.length > 0 && (
                  <View className="bg-orange-50 rounded-lg p-3 mb-3">
                    <View className="flex items-center mb-1">
                      <Tags size={14} color="#C2410C" className="mr-1" />
                      <Text className="text-xs font-medium text-orange-800">
                        授权前提醒
                      </Text>
                    </View>
                    {riskWarnings.map((warning) => (
                      <Text
                        key={warning}
                        className="block text-xs text-orange-800 leading-relaxed"
                      >
                        - {warning}
                      </Text>
                    ))}
                  </View>
                )}

                {sub.can_auth ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mb-2 w-full justify-center text-amber-700"
                      onClick={() => toggleExpand(sub.id)}
                    >
                      <Text className="text-sm text-amber-700">
                        {isExpanded ? "收起" : currentAuth ? "修改授权" : "设置授权"}
                      </Text>
                    </Button>

                    {isExpanded && (
                      <View className="space-y-3 mt-2">
                        <View>
                          <Text className="block text-xs font-medium text-stone-700 mb-2">
                            授权级别
                          </Text>
                          <View className="space-y-2">
                            {AUTH_OPTIONS.map((option) => {
                              const isSelected = form.level === option.value;
                              return (
                                <Button
                                  key={option.value}
                                  variant={isSelected ? "default" : "outline"}
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() =>
                                    updateForm(sub.id, { level: option.value })
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
                                    {isSelected && <Check size={16} color="#B45309" />}
                                  </View>
                                </Button>
                              );
                            })}
                          </View>
                        </View>

                        {isPublicPending && (
                          <View className="bg-red-50 rounded-lg p-3">
                            <Text className="block text-xs text-red-700 leading-relaxed">
                              这段可以获得公开授权，但仍有待核实信息。公开时不能写成已核实事实。
                            </Text>
                          </View>
                        )}

                        <View>
                          <Text className="block text-xs font-medium text-stone-700 mb-2">
                            授权方式
                          </Text>
                          <View className="flex gap-2">
                            {METHOD_OPTIONS.map((option) => (
                              <Button
                                key={option.value}
                                variant={form.method === option.value ? "default" : "outline"}
                                size="sm"
                                className="flex-1"
                                onClick={() =>
                                  updateForm(sub.id, { method: option.value })
                                }
                              >
                                <Text>{option.label}</Text>
                              </Button>
                            ))}
                          </View>
                        </View>

                        <View>
                          <Text className="block text-xs font-medium text-stone-700 mb-2">
                            授权人
                          </Text>
                          <Input
                            value={form.person}
                            placeholder="例如：陈爷爷"
                            onInput={(event) =>
                              updateForm(sub.id, {
                                person: String(event.detail.value || ""),
                              })
                            }
                          />
                        </View>

                        <View>
                          <Text className="block text-xs font-medium text-stone-700 mb-2">
                            特殊要求
                          </Text>
                          <Textarea
                            value={form.restriction}
                            placeholder="例如：可以公开，但不要写家人的真实姓名。"
                            className="h-24"
                            onInput={(event) =>
                              updateForm(sub.id, {
                                restriction: String(event.detail.value || ""),
                              })
                            }
                          />
                        </View>

                        <Button
                          className="w-full bg-amber-700 text-white"
                          disabled={saving === sub.id}
                          onClick={() => handleSetAuth(sub)}
                        >
                          <Text>{saving === sub.id ? "保存中..." : "保存授权"}</Text>
                        </Button>

                        {sub.auth_time && (
                          <>
                            <Separator className="my-2" />
                            <View className="bg-green-50 rounded-lg p-2">
                              <Text className="block text-xs text-green-800">
                                上次授权：{sub.auth_level_icon} {sub.auth_level_label}
                                {sub.auth_method ? ` | ${sub.auth_method}` : ""}
                              </Text>
                              {sub.auth_restriction && (
                                <Text className="block text-xs text-green-700 mt-1">
                                  特殊要求：{sub.auth_restriction}
                                </Text>
                              )}
                              <Text className="block text-xs text-green-600 mt-1">
                                老人以后可以修改授权
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    )}
                  </>
                ) : (
                  <View className="bg-stone-100 rounded-lg p-3">
                    <Text className="block text-xs text-muted-foreground text-center">
                      该子话题还没有整理好的采访内容，采访内容整理完成后可设置授权
                    </Text>
                  </View>
                )}
              </CardContent>
            </Card>
          );
        })}

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
                    <Text className="text-sm mr-1">{sub.icon}</Text>
                    <Text className="text-xs text-foreground mr-1">{sub.name}</Text>
                    <Text className="text-xs">{sub.auth_level_icon}</Text>
                  </View>
                ))}
              </View>
              {authedCount === totalCount && totalCount > 0 && (
                <View className="mt-3 bg-green-100 rounded-lg p-2">
                  <Text className="block text-xs text-green-800 text-center">
                    全部授权确认完毕，可以进入对应的存档或展示范围。
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
