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
  CircleAlert,
  Clock,
  FileText,
  RotateCcw,
  ShieldCheck,
  Tags,
  UserRound,
} from "lucide-react-taro";

interface TopicAffiliation {
  primary: string;
  secondary: string;
}

interface TaxonomyGroup {
  code: string;
  primary: string;
  secondary: string[];
}

interface IntervieweeCard {
  id: string;
  name: string;
  age?: string | null;
  occupation?: string | null;
  role?: string | null;
  auth_status: string;
  auth_status_label: string;
  auth_method?: string | null;
  auth_method_label?: string;
  auth_note?: string | null;
  topic_affiliations: TopicAffiliation[];
  suggested_affiliations?: TopicAffiliation[];
  source_count: number;
  source_summary?: string;
  confirmed_at?: string | null;
  is_temporary?: boolean;
}

interface AuthListData {
  topic_id: string;
  topic_name: string;
  stats: {
    total: number;
    pending: number;
    agreed: number;
    declined: number;
    revisit: number;
    withdrawn: number;
    tagged: number;
  };
  interviewees: IntervieweeCard[];
  taxonomy: TaxonomyGroup[];
  reminder: string;
}

interface IntervieweeForm {
  name: string;
  authStatus: string;
  authMethod: string;
  authNote: string;
  affiliations: TopicAffiliation[];
}

const DEFAULT_TAXONOMY: TaxonomyGroup[] = [
  { code: "01", primary: "建筑与空间", secondary: ["宗祠", "庙宇", "老宅", "桥梁", "水井", "古道", "学校", "集市", "公共空间"] },
  { code: "02", primary: "地理与地标", secondary: ["山川", "水系", "田地", "道路", "村落边界", "老地名", "自然地标"] },
  { code: "03", primary: "宗族与家族", secondary: ["姓氏来源", "宗祠文化", "族谱", "迁徙", "家族关系", "祖先故事"] },
  { code: "04", primary: "民俗与节庆", secondary: ["春节", "清明", "端午", "中秋", "婚俗", "丧葬", "祭祀", "成年礼", "地方节庆"] },
  { code: "05", primary: "信仰与仪式", secondary: ["神祇", "祭祖", "庙会", "禁忌", "祈福", "仪式空间", "民间信仰"] },
  { code: "06", primary: "生产与生计", secondary: ["农耕", "渔业", "手工业", "商贸", "传统职业", "工具", "集市"] },
  { code: "07", primary: "饮食与物产", secondary: ["家常菜", "节庆食品", "地方特产", "制作技艺", "食材", "宴席"] },
  { code: "08", primary: "日常生活", secondary: ["衣着", "住房", "出行", "用水", "照明", "购物", "娱乐", "家庭生活"] },
  { code: "09", primary: "儿童与教育", secondary: ["学校", "读书", "游戏", "童谣", "劳动", "成长", "家庭教育"] },
  { code: "10", primary: "人物与人生", secondary: ["村中老人", "手艺人", "教师", "干部", "商人", "普通家庭", "特殊人物"] },
  { code: "11", primary: "村庄事件", secondary: ["建村", "灾害", "修路", "建桥", "建校", "集体活动", "社会变迁"] },
  { code: "12", primary: "语言与口述文化", secondary: ["方言词", "俗语", "谚语", "童谣", "歌谣", "称谓", "地名读音"] },
  { code: "13", primary: "手艺与物质文化", secondary: ["木工", "石雕", "编织", "农具", "服饰", "器物", "建筑技艺"] },
  { code: "14", primary: "故事与传说", secondary: ["地方传说", "人物轶事", "地名故事", "神话", "怪谈", "家族故事"] },
  { code: "15", primary: "村庄变迁", secondary: ["人口", "迁徙", "产业", "建筑", "交通", "环境", "生活方式"] },
  { code: "16", primary: "社区关系", secondary: ["邻里互助", "宗族关系", "公共事务", "集体劳动", "女性角色"] },
];

const AUTH_STATUS_OPTIONS = [
  { value: "pending", label: "待确认", color: "bg-stone-100 text-stone-600", icon: Clock },
  { value: "agreed", label: "已同意", color: "bg-green-50 text-green-700", icon: ShieldCheck },
  { value: "declined", label: "不同意", color: "bg-red-50 text-red-600", icon: CircleAlert },
  { value: "revisit", label: "需回访确认", color: "bg-amber-50 text-amber-700", icon: RotateCcw },
  { value: "withdrawn", label: "已撤回", color: "bg-stone-100 text-stone-500", icon: CircleAlert },
];

const AUTH_METHOD_OPTIONS = [
  { value: "verbal", label: "口述确认" },
  { value: "written", label: "书面确认" },
  { value: "family_proxy", label: "家属代确认" },
  { value: "other", label: "其他方式" },
];

const statusInfo = (status: string) =>
  AUTH_STATUS_OPTIONS.find((item) => item.value === status) || AUTH_STATUS_OPTIONS[0];

const methodLabel = (method?: string | null) =>
  AUTH_METHOD_OPTIONS.find((item) => item.value === method)?.label || "待补充";

const affiliationKey = (item: TopicAffiliation) => `${item.primary}::${item.secondary}`;

const hasAffiliation = (items: TopicAffiliation[], target: TopicAffiliation) =>
  items.some((item) => affiliationKey(item) === affiliationKey(target));

const toggleAffiliation = (items: TopicAffiliation[], target: TopicAffiliation) =>
  hasAffiliation(items, target)
    ? items.filter((item) => affiliationKey(item) !== affiliationKey(target))
    : [...items, target];

const affiliationText = (items: TopicAffiliation[]) => {
  if (items.length === 0) return "待标注";
  return items.map((item) => item.secondary).join("、");
};

const AuthorizationPage = () => {
  const router = useRouter();
  const topicId = router.params.topicId || "";

  const [authData, setAuthData] = useState<AuthListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, IntervieweeForm>>({});

  const fetchAuthList = useCallback(async () => {
    if (!topicId) return;
    try {
      setLoading(true);
      const res = await Network.request({
        url: `/api/topics/${topicId}/auth-list`,
      });
      const data = res.data?.data;
      if (data) setAuthData(data);
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

  const getForm = (person: IntervieweeCard): IntervieweeForm => {
    return (
      formState[person.id] || {
        name: person.name || "",
        authStatus: person.auth_status || "pending",
        authMethod: person.auth_method || "verbal",
        authNote: person.auth_note || "",
        affiliations:
          person.topic_affiliations?.length > 0
            ? person.topic_affiliations
            : person.suggested_affiliations || [],
      }
    );
  };

  const updateForm = (personId: string, patch: Partial<IntervieweeForm>) => {
    const person = authData?.interviewees.find((item) => item.id === personId);
    if (!person) return;
    setFormState((current) => ({
      ...current,
      [personId]: {
        ...getForm(person),
        ...patch,
      },
    }));
  };

  const handleSave = async (person: IntervieweeCard) => {
    const form = getForm(person);
    if (!form.name.trim()) {
      Taro.showToast({ title: "请填写受访人姓名", icon: "none" });
      return;
    }

    try {
      setSaving(person.id);
      const res = await Network.request({
        url: `/api/topics/${topicId}/interviewees/${person.id}/authorization`,
        method: "POST",
        data: {
          name: form.name.trim(),
          auth_status: form.authStatus,
          auth_method: form.authMethod,
          auth_note: form.authNote.trim(),
          topic_affiliations: form.affiliations,
        },
      });

      if (res.data?.data) {
        Taro.showToast({ title: "已保存", icon: "success" });
        setExpandedPerson(res.data.data.next_interviewee_id || null);
        fetchAuthList();
      }
    } catch (err) {
      console.error("保存授权状态失败:", err);
      Taro.showToast({ title: "保存失败，请重试", icon: "none" });
    } finally {
      setSaving(null);
    }
  };

  const renderStatusPicker = (person: IntervieweeCard) => {
    const form = getForm(person);
    return (
      <View className="grid grid-cols-2 gap-2">
        {AUTH_STATUS_OPTIONS.map((option) => {
          const selected = form.authStatus === option.value;
          return (
            <Button
              key={option.value}
              size="sm"
              variant={selected ? "default" : "outline"}
              className="justify-start"
              onClick={() => updateForm(person.id, { authStatus: option.value })}
            >
              <Text>{selected ? "✓ " : ""}{option.label}</Text>
            </Button>
          );
        })}
      </View>
    );
  };

  const renderMethodPicker = (person: IntervieweeCard) => {
    const form = getForm(person);
    return (
      <View className="flex flex-wrap gap-2">
        {AUTH_METHOD_OPTIONS.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={form.authMethod === option.value ? "default" : "outline"}
            onClick={() => updateForm(person.id, { authMethod: option.value })}
          >
            <Text>{option.label}</Text>
          </Button>
        ))}
      </View>
    );
  };

  const renderAffiliationPicker = (person: IntervieweeCard, taxonomy: TaxonomyGroup[]) => {
    const form = getForm(person);
    return (
      <View className="space-y-3">
        {taxonomy.map((group) => (
          <View key={group.code} className="bg-stone-50 rounded-lg p-3">
            <Text className="block text-xs font-semibold text-stone-700 mb-2">
              {group.code} {group.primary}
            </Text>
            <View className="flex flex-wrap gap-2">
              {group.secondary.map((secondary) => {
                const affiliation = { primary: group.primary, secondary };
                const selected = hasAffiliation(form.affiliations, affiliation);
                return (
                  <Button
                    key={`${group.primary}-${secondary}`}
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    onClick={() =>
                      updateForm(person.id, {
                        affiliations: toggleAffiliation(form.affiliations, affiliation),
                      })
                    }
                  >
                    <Text>{secondary}</Text>
                  </Button>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="min-h-screen bg-background p-4">
        <Skeleton className="h-8 w-48 mb-4" />
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

  const taxonomy = authData.taxonomy?.length ? authData.taxonomy : DEFAULT_TAXONOMY;
  const interviewees = authData.interviewees || [];
  const taggedCount = interviewees.filter((person) => person.topic_affiliations.length > 0).length;

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
            已同意 {authData.stats.agreed}/{authData.stats.total} 人
          </Text>
          <Text className="block text-amber-100 text-xs">
            已标注 {taggedCount}/{authData.stats.total} 人
          </Text>
        </View>
      </View>

      <View className="px-4 -mt-3">
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="p-3">
            <Text className="block text-sm font-semibold text-amber-900 mb-1">
              先看人，再看话题归属
            </Text>
            <Text className="block text-xs text-amber-800 leading-relaxed">
              {authData.reminder || "授权管理以受访人为主：先确认人的授权状态，再标注这个人关联的一、二级话题。"}
            </Text>
          </CardContent>
        </Card>

        <View className="grid grid-cols-2 gap-2 mb-4">
          <Card>
            <CardContent className="p-3">
              <Text className="block text-lg font-bold text-stone-800">
                {authData.stats.pending + authData.stats.revisit}
              </Text>
              <Text className="block text-xs text-muted-foreground">待确认/回访</Text>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <Text className="block text-lg font-bold text-stone-800">
                {authData.stats.declined + authData.stats.withdrawn}
              </Text>
              <Text className="block text-xs text-muted-foreground">不同意/已撤回</Text>
            </CardContent>
          </Card>
        </View>

        {interviewees.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <Text className="block text-sm text-muted-foreground text-center">
                还没有受访人记录。采访内容整理完成后，会从整理文档里推导候选受访人；也可以后续新增受访人表。
              </Text>
            </CardContent>
          </Card>
        ) : (
          <View className="space-y-3">
            {interviewees.map((person) => {
              const expanded = expandedPerson === person.id;
              const form = getForm(person);
              const info = statusInfo(form.authStatus);
              const StatusIcon = info.icon;
              const savedAffiliations = person.topic_affiliations || [];
              const suggestions = person.suggested_affiliations || [];

              return (
                <Card key={person.id}>
                  <CardContent className="p-4">
                    <View
                      className="flex items-start justify-between"
                      onClick={() => setExpandedPerson(expanded ? null : person.id)}
                    >
                      <View className="flex items-start flex-1">
                        <View className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mr-3">
                          <UserRound size={20} color="#92400E" />
                        </View>
                        <View className="flex-1">
                          <View className="flex items-center mb-1">
                            <Text className="block text-base font-semibold text-foreground mr-2">
                              {person.name}
                            </Text>
                            {person.is_temporary && (
                              <Badge variant="outline">
                                <Text className="text-xs">待建档</Text>
                              </Badge>
                            )}
                          </View>
                          <Text className="block text-xs text-muted-foreground">
                            {(person.age || "年龄待补充") +
                              " / " +
                              (person.occupation || person.role || "身份待补充")}
                          </Text>
                        </View>
                      </View>
                      <Badge className={info.color}>
                        <View className="flex items-center">
                          <StatusIcon size={12} color="#57534E" className="mr-1" />
                          <Text className="text-xs">{info.label}</Text>
                        </View>
                      </Badge>
                    </View>

                    <View className="mt-3 bg-stone-50 rounded-lg p-3">
                      <View className="flex items-center mb-1">
                        <Tags size={14} color="#78716C" className="mr-1" />
                        <Text className="text-xs text-muted-foreground">话题归属</Text>
                      </View>
                      <Text className="block text-sm text-stone-700 leading-relaxed">
                        {affiliationText(savedAffiliations)}
                      </Text>
                    </View>

                    {person.source_summary && (
                      <View className="mt-3 bg-white rounded-lg border border-stone-100 p-3">
                        <View className="flex items-center mb-1">
                          <FileText size={14} color="#78716C" className="mr-1" />
                          <Text className="text-xs text-muted-foreground">
                            整理文档线索：{person.source_count} 条
                          </Text>
                        </View>
                        <Text className="block text-xs text-stone-600 leading-relaxed">
                          {person.source_summary}
                        </Text>
                      </View>
                    )}

                    {suggestions.length > 0 && savedAffiliations.length === 0 && (
                      <View className="mt-3 bg-amber-50 rounded-lg p-3">
                        <Text className="block text-xs text-amber-800 mb-1">
                          系统建议标注：
                        </Text>
                        <Text className="block text-xs text-amber-800 leading-relaxed">
                          {affiliationText(suggestions)}
                        </Text>
                      </View>
                    )}

                    <View className="mt-3 flex items-center justify-between">
                      <Text className="text-xs text-muted-foreground">
                        授权方式：{methodLabel(person.auth_method)}
                      </Text>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-amber-700"
                        onClick={() => setExpandedPerson(expanded ? null : person.id)}
                      >
                        <Text>{expanded ? "收起" : "编辑"}</Text>
                      </Button>
                    </View>

                    {expanded && (
                      <View className="mt-4 space-y-4">
                        <Separator />

                        <View>
                          <Text className="block text-xs font-medium text-stone-700 mb-2">
                            受访人姓名
                          </Text>
                          <Input
                            value={form.name}
                            placeholder="例如：陈爷爷"
                            onInput={(event) =>
                              updateForm(person.id, {
                                name: String(event.detail.value || ""),
                              })
                            }
                          />
                        </View>

                        <View>
                          <Text className="block text-xs font-medium text-stone-700 mb-2">
                            授权状态
                          </Text>
                          {renderStatusPicker(person)}
                        </View>

                        <View>
                          <Text className="block text-xs font-medium text-stone-700 mb-2">
                            授权方式
                          </Text>
                          {renderMethodPicker(person)}
                        </View>

                        <View>
                          <Text className="block text-xs font-medium text-stone-700 mb-2">
                            话题归属
                          </Text>
                          {renderAffiliationPicker(person, taxonomy)}
                        </View>

                        <View>
                          <Text className="block text-xs font-medium text-stone-700 mb-2">
                            特殊要求
                          </Text>
                          <Textarea
                            value={form.authNote}
                            placeholder="例如：可以用于项目材料；公开时不要写家人的真实姓名。"
                            className="h-24"
                            onInput={(event) =>
                              updateForm(person.id, {
                                authNote: String(event.detail.value || ""),
                              })
                            }
                          />
                        </View>

                        <View className="bg-stone-50 rounded-lg p-3">
                          <View className="flex items-center">
                            <Check size={14} color="#166534" className="mr-1" />
                            <Text className="text-xs text-stone-700">
                              将保存：{form.name || "未命名受访人"} / {statusInfo(form.authStatus).label} / {affiliationText(form.affiliations)}
                            </Text>
                          </View>
                        </View>

                        <Button
                          className="w-full bg-amber-700 text-white"
                          disabled={saving === person.id}
                          onClick={() => handleSave(person)}
                        >
                          <Text>{saving === person.id ? "保存中..." : "保存授权状态和话题归属"}</Text>
                        </Button>

                        {person.confirmed_at && (
                          <View className="bg-green-50 rounded-lg p-2">
                            <Text className="block text-xs text-green-800">
                              最近确认：{person.auth_status_label} / {person.auth_method_label || "方式待补充"}
                            </Text>
                            {person.auth_note && (
                              <Text className="block text-xs text-green-700 mt-1">
                                特殊要求：{person.auth_note}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

export default AuthorizationPage;
