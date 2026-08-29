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
  ArrowLeft,
  FileText,
  Plus,
  Search,
  ShieldCheck,
  Tags,
  UserRound,
  Users,
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

interface InterviewPackage {
  id: string;
  title: string;
  summary: string;
  created_at?: string | null;
}

interface IntervieweeCard {
  id: string;
  name: string;
  age?: string | null;
  occupation?: string | null;
  role?: string | null;
  auth_status: string;
  auth_status_label: string;
  auth_note?: string | null;
  topic_affiliations: TopicAffiliation[];
  suggested_affiliations?: TopicAffiliation[];
  interview_packages?: InterviewPackage[];
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
    unset: number;
    agreed: number;
    declined: number;
    tagged: number;
  };
  interviewees: IntervieweeCard[];
  taxonomy: TaxonomyGroup[];
}

interface IntervieweeForm {
  name: string;
  age: string;
  occupation: string;
  role: string;
  authStatus: string;
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
  { value: "unset", label: "未设置", color: "bg-stone-100 text-stone-600" },
  { value: "agreed", label: "同意", color: "bg-green-50 text-green-700" },
  { value: "declined", label: "不同意", color: "bg-red-50 text-red-600" },
];

const statusInfo = (status: string) =>
  AUTH_STATUS_OPTIONS.find((item) => item.value === status) || AUTH_STATUS_OPTIONS[0];

const affiliationKey = (item: TopicAffiliation) => `${item.primary}::${item.secondary}`;

const hasAffiliation = (items: TopicAffiliation[], target: TopicAffiliation) =>
  items.some((item) => affiliationKey(item) === affiliationKey(target));

const toggleAffiliation = (items: TopicAffiliation[], target: TopicAffiliation) =>
  hasAffiliation(items, target)
    ? items.filter((item) => affiliationKey(item) !== affiliationKey(target))
    : [...items, target];

const affiliationText = (items: TopicAffiliation[]) => {
  if (items.length === 0) return "未标注";
  return items.map((item) => item.secondary).join("、");
};

const personMatchesQuery = (person: IntervieweeCard, query: string) => {
  const normalized = query.trim();
  if (!normalized) return true;
  const affiliations = [
    ...(person.topic_affiliations || []),
    ...(person.suggested_affiliations || []),
  ];
  const text = [
    person.name,
    person.age,
    person.occupation,
    person.role,
    person.source_summary,
    person.auth_note,
    ...affiliations.map((item) => `${item.primary} ${item.secondary}`),
  ]
    .filter(Boolean)
    .join(" ");
  return text.includes(normalized);
};

const AuthorizationPage = () => {
  const router = useRouter();
  const topicId = router.params.topicId || "";

  const [authData, setAuthData] = useState<AuthListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [listStatus, setListStatus] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, IntervieweeForm>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

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
        age: person.age || "",
        occupation: person.occupation || "",
        role: person.role || "",
        authStatus: person.auth_status || "unset",
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

  const openProfile = (personId: string) => {
    setSelectedPersonId(personId);
    setListStatus(null);
  };

  const openStatusList = (status: string) => {
    setListStatus(status);
    setSelectedPersonId(null);
  };

  const addInterviewee = () => {
    if (!authData) return;
    const id = `temp-manual-${Date.now()}`;
    const newPerson: IntervieweeCard = {
      id,
      name: "新受访人",
      age: null,
      occupation: null,
      role: null,
      auth_status: "unset",
      auth_status_label: "未设置",
      auth_note: null,
      topic_affiliations: [],
      suggested_affiliations: [],
      interview_packages: [],
      source_count: 0,
      source_summary: "",
      confirmed_at: null,
      is_temporary: true,
    };
    setAuthData({
      ...authData,
      stats: { ...authData.stats, total: authData.stats.total + 1, unset: authData.stats.unset + 1 },
      interviewees: [...authData.interviewees, newPerson],
    });
    setFormState((current) => ({
      ...current,
      [id]: {
        name: "",
        age: "",
        occupation: "",
        role: "",
        authStatus: "unset",
        authNote: "",
        affiliations: [],
      },
    }));
    openProfile(id);
  };

  const savePerson = async (person: IntervieweeCard) => {
    const form = getForm(person);
    if (!form.name.trim()) {
      Taro.showToast({ title: "请填写姓名", icon: "none" });
      return;
    }

    try {
      setSaving(true);
      const res = await Network.request({
        url: `/api/topics/${topicId}/interviewees/${person.id}/authorization`,
        method: "POST",
        data: {
          name: form.name.trim(),
          age: form.age.trim(),
          occupation: form.occupation.trim(),
          role: form.role.trim(),
          auth_status: form.authStatus,
          auth_note: form.authNote.trim(),
          topic_affiliations: form.affiliations,
        },
      });

      if (res.data?.data) {
        Taro.showToast({ title: "已保存", icon: "success" });
        await fetchAuthList();
        setSelectedPersonId(res.data.data.id || person.id);
      }
    } catch (err) {
      console.error("保存受访人失败:", err);
      Taro.showToast({ title: "保存失败，请重试", icon: "none" });
    } finally {
      setSaving(false);
    }
  };

  const addCustomSecondary = (person: IntervieweeCard, group: TaxonomyGroup) => {
    const inputKey = `${person.id}-${group.primary}`;
    const value = (customInputs[inputKey] || "").trim();
    if (!value) {
      Taro.showToast({ title: "请输入话题名", icon: "none" });
      return;
    }
    const form = getForm(person);
    updateForm(person.id, {
      affiliations: toggleAffiliation(form.affiliations, {
        primary: group.primary,
        secondary: value,
      }),
    });
    setCustomInputs((current) => ({ ...current, [inputKey]: "" }));
  };

  if (loading) {
    return (
      <View className="min-h-screen bg-background p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-12 w-full mb-3" />
        <Skeleton className="h-20 w-full mb-3" />
        <Skeleton className="h-20 w-full" />
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
  const selectedPerson = interviewees.find((item) => item.id === selectedPersonId) || null;
  const searchResults = query.trim()
    ? interviewees.filter((person) => personMatchesQuery(person, query))
    : [];
  const statusList = listStatus
    ? interviewees.filter((person) => person.auth_status === listStatus)
    : [];

  const renderPersonRow = (person: IntervieweeCard) => {
    const info = statusInfo(person.auth_status);
    return (
      <View
        key={person.id}
        className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0"
        onClick={() => openProfile(person.id)}
      >
        <View className="flex items-center flex-1">
          <View className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center mr-3">
            <UserRound size={18} color="#92400E" />
          </View>
          <View className="flex-1">
            <View className="flex items-center">
              <Text className="block text-sm font-semibold text-foreground mr-2">
                {person.name}
              </Text>
              {person.is_temporary && (
                <Badge variant="outline">
                  <Text className="text-xs">待建档</Text>
                </Badge>
              )}
            </View>
            <Text className="block text-xs text-muted-foreground mt-1">
              {affiliationText(person.topic_affiliations)}
            </Text>
          </View>
        </View>
        <Badge className={info.color}>
          <Text className="text-xs">{info.label}</Text>
        </Badge>
      </View>
    );
  };

  const renderListView = (title: string, people: IntervieweeCard[]) => (
    <View className="px-4 -mt-3">
      <Card>
        <CardContent className="p-4">
          <View className="flex items-center mb-3">
            <Button
              size="sm"
              variant="ghost"
              className="mr-2"
              onClick={() => {
                setListStatus(null);
                setSelectedPersonId(null);
              }}
            >
              <ArrowLeft size={16} color="#57534E" />
            </Button>
            <Text className="block text-base font-semibold text-foreground">{title}</Text>
          </View>
          {people.length > 0 ? (
            <View>{people.map(renderPersonRow)}</View>
          ) : (
            <Text className="block text-sm text-muted-foreground text-center py-6">
              暂无名单
            </Text>
          )}
        </CardContent>
      </Card>
    </View>
  );

  const renderProfile = (person: IntervieweeCard) => {
    const form = getForm(person);
    const packages = person.interview_packages || [];

    return (
      <View className="px-4 -mt-3">
        <Card>
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-4">
              <View className="flex items-center">
                <Button
                  size="sm"
                  variant="ghost"
                  className="mr-2"
                  onClick={() => setSelectedPersonId(null)}
                >
                  <ArrowLeft size={16} color="#57534E" />
                </Button>
                <Text className="block text-base font-semibold text-foreground">
                  受访人档案
                </Text>
              </View>
              <Badge className={statusInfo(form.authStatus).color}>
                <Text className="text-xs">{statusInfo(form.authStatus).label}</Text>
              </Badge>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="block text-xs font-medium text-stone-700 mb-2">姓名</Text>
                <Input
                  value={form.name}
                  placeholder="例如：陈爷爷"
                  onInput={(event) =>
                    updateForm(person.id, { name: String(event.detail.value || "") })
                  }
                />
              </View>

              <View className="grid grid-cols-2 gap-3">
                <View>
                  <Text className="block text-xs font-medium text-stone-700 mb-2">年龄</Text>
                  <Input
                    value={form.age}
                    placeholder="例如：72"
                    onInput={(event) =>
                      updateForm(person.id, { age: String(event.detail.value || "") })
                    }
                  />
                </View>
                <View>
                  <Text className="block text-xs font-medium text-stone-700 mb-2">职业</Text>
                  <Input
                    value={form.occupation}
                    placeholder="例如：木匠"
                    onInput={(event) =>
                      updateForm(person.id, { occupation: String(event.detail.value || "") })
                    }
                  />
                </View>
              </View>

              <View>
                <Text className="block text-xs font-medium text-stone-700 mb-2">身份</Text>
                <Input
                  value={form.role}
                  placeholder="例如：村中老人"
                  onInput={(event) =>
                    updateForm(person.id, { role: String(event.detail.value || "") })
                  }
                />
              </View>

              <View>
                <Text className="block text-xs font-medium text-stone-700 mb-2">授权状态</Text>
                <View className="grid grid-cols-3 gap-2">
                  {AUTH_STATUS_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      size="sm"
                      variant={form.authStatus === option.value ? "default" : "outline"}
                      onClick={() => updateForm(person.id, { authStatus: option.value })}
                    >
                      <Text>{option.label}</Text>
                    </Button>
                  ))}
                </View>
              </View>

              <View>
                <Text className="block text-xs font-medium text-stone-700 mb-2">话题归属</Text>
                {form.affiliations.length > 0 && (
                  <View className="flex flex-wrap gap-2 mb-3">
                    {form.affiliations.map((item) => (
                      <Badge key={affiliationKey(item)} variant="secondary">
                        <Text className="text-xs">{item.secondary}</Text>
                      </Badge>
                    ))}
                  </View>
                )}
                <View className="space-y-3">
                  {taxonomy.map((group) => {
                    const inputKey = `${person.id}-${group.primary}`;
                    return (
                      <View key={group.code} className="bg-stone-50 rounded-lg p-3">
                        <View className="flex items-center justify-between mb-2">
                          <Text className="block text-xs font-semibold text-stone-700">
                            {group.code} {group.primary}
                          </Text>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-amber-700"
                            onClick={() => addCustomSecondary(person, group)}
                          >
                            <Plus size={14} color="#B45309" className="mr-1" />
                            <Text>添加</Text>
                          </Button>
                        </View>
                        <View className="flex gap-2 mb-2">
                          <Input
                            value={customInputs[inputKey] || ""}
                            placeholder="自定义话题"
                            onInput={(event) =>
                              setCustomInputs((current) => ({
                                ...current,
                                [inputKey]: String(event.detail.value || ""),
                              }))
                            }
                          />
                        </View>
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
                    );
                  })}
                </View>
              </View>

              <View>
                <Text className="block text-xs font-medium text-stone-700 mb-2">特殊要求</Text>
                <Textarea
                  value={form.authNote}
                  placeholder="例如：公开时不要写家人的真实姓名。"
                  className="h-24"
                  onInput={(event) =>
                    updateForm(person.id, { authNote: String(event.detail.value || "") })
                  }
                />
              </View>

              {packages.length > 0 && (
                <View>
                  <Separator className="my-2" />
                  <Text className="block text-xs font-medium text-stone-700 mb-2">
                    关联采访
                  </Text>
                  <View className="space-y-2">
                    {packages.map((item) => (
                      <View key={item.id} className="bg-stone-50 rounded-lg p-3">
                        <View className="flex items-center mb-1">
                          <FileText size={14} color="#78716C" className="mr-1" />
                          <Text className="text-xs font-medium text-stone-700">
                            {item.title}
                          </Text>
                        </View>
                        <Text className="block text-xs text-muted-foreground leading-relaxed">
                          {item.summary}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <Button
                className="w-full bg-amber-700 text-white"
                disabled={saving}
                onClick={() => savePerson(person)}
              >
                <Text>{saving ? "保存中..." : "保存档案"}</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      </View>
    );
  };

  const renderHome = () => (
    <View className="px-4 -mt-3">
      <Card className="mb-4">
        <CardContent className="p-3">
          <View className="flex items-center">
            <Search size={16} color="#78716C" className="mr-2" />
            <Input
              value={query}
              placeholder="搜索人名、一级主题或二级话题"
              onInput={(event) => setQuery(String(event.detail.value || ""))}
            />
          </View>
        </CardContent>
      </Card>

      {query.trim() && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <Text className="block text-sm font-semibold text-foreground mb-2">
              搜索结果
            </Text>
            {searchResults.length > 0 ? (
              searchResults.map(renderPersonRow)
            ) : (
              <Text className="block text-sm text-muted-foreground text-center py-4">
                没有找到相关受访人
              </Text>
            )}
          </CardContent>
        </Card>
      )}

      <View className="grid grid-cols-3 gap-2 mb-4">
        {AUTH_STATUS_OPTIONS.map((option) => {
          const count = authData.stats[option.value as keyof typeof authData.stats] || 0;
          return (
            <Card key={option.value} onClick={() => openStatusList(option.value)}>
              <CardContent className="p-3">
                <Text className="block text-lg font-bold text-stone-800">{count}</Text>
                <Text className="block text-xs text-muted-foreground">{option.label}</Text>
              </CardContent>
            </Card>
          );
        })}
      </View>

      <View className="grid grid-cols-2 gap-3 mb-4">
        <Button
          variant="outline"
          className="h-auto py-4 bg-white"
          onClick={() => openStatusList("all")}
        >
          <Users size={18} color="#92400E" className="mr-2" />
          <Text>受访人名单</Text>
        </Button>
        <Button className="h-auto py-4 bg-amber-700 text-white" onClick={addInterviewee}>
          <Plus size={18} color="#FFFFFF" className="mr-2" />
          <Text>增加受访人</Text>
        </Button>
      </View>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <View className="flex items-center mb-2">
            <Tags size={16} color="#92400E" className="mr-2" />
            <Text className="block text-sm font-semibold text-amber-900">
              话题归属
            </Text>
          </View>
          <Text className="block text-sm text-amber-800">
            已标注 {authData.stats.tagged}/{authData.stats.total} 人
          </Text>
        </CardContent>
      </Card>
    </View>
  );

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
            受访人 {authData.stats.total} 人
          </Text>
          <Text className="block text-amber-100 text-xs">
            同意 {authData.stats.agreed} / 不同意 {authData.stats.declined}
          </Text>
        </View>
      </View>

      {selectedPerson
        ? renderProfile(selectedPerson)
        : listStatus
          ? renderListView(
              listStatus === "all" ? "受访人名单" : `${statusInfo(listStatus).label}名单`,
              listStatus === "all" ? interviewees : statusList,
            )
          : renderHome()}
    </View>
  );
};

export default AuthorizationPage;
