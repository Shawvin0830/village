"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopicsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_client_1 = require("../storage/database/supabase-client");
const authorization_manager_skill_1 = require("../skills/authorization-manager.skill");
const trimText = (value) => (value || '').trim();
const shortText = (value, limit = 120) => {
    const text = trimText(value).replace(/\s+/g, ' ');
    return text.length > limit ? `${text.slice(0, limit)}...` : text;
};
const getRecordText = (record) => trimText(record.mandarin_text) || trimText(record.dialect_original) || trimText(record.transcript_text);
const extractSegments = (record) => {
    const analysis = record.ai_analysis;
    if (!analysis || !Array.isArray(analysis.segments))
        return [];
    return analysis.segments;
};
const extractPersonBase = (record) => {
    const analysis = record.ai_analysis || {};
    const interviewee = analysis.interviewee;
    if (interviewee && typeof interviewee === 'object') {
        return {
            name: String(interviewee.name || '受访人待补充'),
            age: interviewee.age ? String(interviewee.age) : null,
            occupation: interviewee.occupation ? String(interviewee.occupation) : null,
            role: interviewee.role || interviewee.identity ? String(interviewee.role || interviewee.identity) : null,
        };
    }
    const segment = extractSegments(record).find((item) => item.interviewee || item.speaker);
    return {
        name: String(analysis.interviewee_name || analysis.speaker || analysis.person || segment?.interviewee || segment?.speaker || '受访人待补充'),
        age: analysis.age ? String(analysis.age) : null,
        occupation: analysis.occupation ? String(analysis.occupation) : null,
        role: analysis.role || analysis.identity ? String(analysis.role || analysis.identity) : null,
    };
};
const safeAffiliations = (value) => {
    if (!Array.isArray(value))
        return [];
    return value
        .map((item) => {
        const record = item;
        return {
            primary: String(record.primary || ''),
            secondary: String(record.secondary || ''),
        };
    })
        .filter((item) => item.primary && item.secondary);
};
let TopicsService = class TopicsService {
    get client() {
        return (0, supabase_client_1.getSupabaseClient)();
    }
    constructor(authSkill) {
        this.authSkill = authSkill;
    }
    async findAll() {
        const { data, error } = await this.client
            .from('topics')
            .select('id, name, description, status, created_at')
            .order('created_at', { ascending: false });
        if (error)
            throw new Error(`查询话题列表失败: ${error.message}`);
        const topicsWithDetails = await Promise.all((data || []).map(async (topic) => {
            const { count: subtopicCount } = await this.client
                .from('subtopics')
                .select('*', { count: 'exact', head: true })
                .eq('topic_id', topic.id);
            const { data: plans } = await this.client
                .from('interview_plans')
                .select('id')
                .eq('topic_id', topic.id)
                .limit(1);
            const { count: authorizedCount } = await this.client
                .from('interviewees')
                .select('*', { count: 'exact', head: true })
                .eq('topic_id', topic.id)
                .eq('auth_status', 'agreed');
            const { count: interviewCount } = await this.client
                .from('interview_records')
                .select('*', { count: 'exact', head: true })
                .eq('topic_id', topic.id);
            const { count: organizedCount } = await this.client
                .from('interview_records')
                .select('*', { count: 'exact', head: true })
                .eq('topic_id', topic.id)
                .eq('status', 'completed');
            const { count: referenceCount } = await this.client
                .from('reference_materials')
                .select('*', { count: 'exact', head: true })
                .eq('topic_id', topic.id);
            return {
                ...topic,
                subtopic_count: subtopicCount || 0,
                has_interview_plan: plans && plans.length > 0,
                authorized_count: authorizedCount || 0,
                interview_count: interviewCount || 0,
                organized_count: organizedCount || 0,
                reference_count: referenceCount || 0,
            };
        }));
        return topicsWithDetails;
    }
    async findOne(id) {
        const { data: topic, error: topicError } = await this.client
            .from('topics')
            .select('id, name, description, status, created_at')
            .eq('id', id)
            .maybeSingle();
        if (topicError)
            throw new Error(`查询话题失败: ${topicError.message}`);
        if (!topic)
            throw new Error('话题不存在');
        const { data: subtopics, error: subError } = await this.client
            .from('subtopics')
            .select('id, name, icon, transcript_status, verify_status, auth_level, summary')
            .eq('topic_id', id)
            .order('created_at', { ascending: true });
        if (subError)
            throw new Error(`查询子话题失败: ${subError.message}`);
        return { ...topic, subtopics: subtopics || [] };
    }
    async create(name, description) {
        const { data, error } = await this.client
            .from('topics')
            .insert({ name, description: description || null })
            .select()
            .single();
        if (error)
            throw new Error(`创建话题失败: ${error.message}`);
        return data;
    }
    async deleteTopic(id) {
        const { error } = await this.client
            .from('topics')
            .delete()
            .eq('id', id);
        if (error)
            throw new Error(`删除话题失败: ${error.message}`);
        return { success: true };
    }
    async getSubtopics(topicId) {
        const { data, error } = await this.client
            .from('subtopics')
            .select('id, name, icon, transcript_status, verify_status, auth_level, summary')
            .eq('topic_id', topicId)
            .order('created_at', { ascending: true });
        if (error)
            throw new Error(`查询子话题失败: ${error.message}`);
        return data || [];
    }
    async createSubtopic(topicId, name, icon) {
        const { data, error } = await this.client
            .from('subtopics')
            .insert({ topic_id: topicId, name, icon: icon || '📌' })
            .select()
            .single();
        if (error)
            throw new Error(`创建子话题失败: ${error.message}`);
        return data;
    }
    async getSubtopicMaterials(topicId, subtopicId) {
        const { data: topic, error: topicError } = await this.client
            .from('topics')
            .select('id, name')
            .eq('id', topicId)
            .maybeSingle();
        if (topicError)
            throw new Error(`查询话题失败: ${topicError.message}`);
        if (!topic)
            throw new Error('话题不存在');
        const { data: subtopic, error: subtopicError } = await this.client
            .from('subtopics')
            .select('id, name, icon, summary, transcript_status, verify_status')
            .eq('id', subtopicId)
            .eq('topic_id', topicId)
            .maybeSingle();
        if (subtopicError)
            throw new Error(`查询子话题失败: ${subtopicError.message}`);
        if (!subtopic)
            throw new Error('子话题不存在');
        const { data: records, error: recordsError } = await this.client
            .from('interview_records')
            .select('id, created_at, mandarin_text, dialect_original, transcript_text, ai_analysis')
            .eq('topic_id', topicId)
            .eq('subtopic_id', subtopicId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false });
        if (recordsError)
            throw new Error(`查询历史采访失败: ${recordsError.message}`);
        const { data: people } = await this.client
            .from('interviewees')
            .select('id, name, age, occupation, role, auth_status, auth_note, topic_affiliations, confirmed_at')
            .eq('topic_id', topicId);
        const peopleByName = new Map();
        for (const person of people || []) {
            peopleByName.set(String(person.name), person);
        }
        const quotes = (records || []).map((record, index) => {
            const segments = extractSegments(record);
            const text = getRecordText(record);
            const firstSegment = segments[0];
            const base = extractPersonBase(record);
            const savedPerson = peopleByName.get(base.name);
            const quoteText = shortText(firstSegment?.quote || firstSegment?.source_text || firstSegment?.mandarin_text || firstSegment?.summary || text, 160) ||
                '暂无摘录';
            return {
                id: record.id,
                quote: quoteText,
                summary: shortText(firstSegment?.summary || text, 120),
                full_interview: text || '暂无完整采访整理文本',
                created_at: record.created_at || null,
                interviewee: {
                    id: savedPerson?.id || `temp-${index}-${record.id}`,
                    name: String(savedPerson?.name || base.name),
                    age: savedPerson?.age || base.age,
                    occupation: savedPerson?.occupation || base.occupation,
                    role: savedPerson?.role || base.role,
                    auth_status: savedPerson?.auth_status || 'unset',
                    auth_note: savedPerson?.auth_note || null,
                    topic_affiliations: safeAffiliations(savedPerson?.topic_affiliations),
                    confirmed_at: savedPerson?.confirmed_at || null,
                },
            };
        });
        const { data: references, error: referencesError } = await this.client
            .from('reference_materials')
            .select('id, title, content, source, url, tags, created_at')
            .eq('topic_id', topicId)
            .or(`subtopic_id.eq.${subtopicId},subtopic_id.is.null`)
            .order('created_at', { ascending: false });
        if (referencesError)
            throw new Error(`查询外部文献失败: ${referencesError.message}`);
        const essenceSummary = this.buildEssenceSummary(subtopic.name, quotes.map((q) => ({
            quote: q.quote,
            interviewee: {
                name: String(q.interviewee.name),
                occupation: q.interviewee.occupation ? String(q.interviewee.occupation) : null,
                role: q.interviewee.role ? String(q.interviewee.role) : null,
            },
        })), (references || []).map((item) => ({
            title: item.title,
            content: item.content,
            source: item.source,
        })));
        return {
            topic_id: topic.id,
            topic_name: topic.name,
            subtopic,
            essence_summary: essenceSummary,
            quotes,
            references: (references || []).map((item) => ({
                id: item.id,
                title: item.title,
                source: item.source,
                url: item.url,
                tags: item.tags || [],
                summary: shortText(item.content, 160),
                content: item.content,
                created_at: item.created_at,
            })),
        };
    }
    buildEssenceSummary(subtopicName, quotes, references) {
        const parts = [];
        parts.push(`「${subtopicName}」是村落文化记忆的重要组成部分，对其进行系统梳理有助于还原历史面貌、传承地方文脉。`);
        const peopleList = [...new Set(quotes.map((q) => q.interviewee.name))].filter(Boolean);
        const refTitles = references.map((r) => r.title).filter(Boolean);
        const researchBits = [];
        if (quotes.length > 0) {
            const exampleNames = peopleList.slice(0, 3).join('、');
            const more = peopleList.length > 3 ? `等 ${peopleList.length} 位` : '';
            researchBits.push(`已采集 ${exampleNames}${more} 的口述记忆`);
        }
        if (references.length > 0) {
            const uniqueTitles = [...new Set(refTitles)];
            const exampleTitles = uniqueTitles.slice(0, 2).map((t) => `《${t}》`).join('、');
            const more = uniqueTitles.length > 2 ? `等 ${uniqueTitles.length} 篇` : '';
            researchBits.push(`查阅了 ${exampleTitles || '相关文献'}${more} 外部资料`);
        }
        if (researchBits.length > 0) {
            parts.push(`目前，${researchBits.join('，')}。`);
        }
        else {
            parts.push('目前该子话题的资料采集尚处于初期阶段，尚未录入采访记录或外部文献。');
        }
        if (quotes.length > 0) {
            const topQuote = quotes[0]?.quote || '';
            const snippet = topQuote.length > 60 ? `${topQuote.slice(0, 60)}…` : topQuote;
            parts.push(`通过整理，已初步提炼出关键口述片段，如"${snippet}"等，为后续深入研究提供了扎实的一手素材。`);
        }
        else if (references.length > 0) {
            parts.push('通过文献梳理，已初步掌握该子话题的基本脉络与核心信息，为后续深入研究奠定了基础。');
        }
        return parts.join('');
    }
    async deleteSubtopic(topicId, subtopicId) {
        const { error } = await this.client
            .from('subtopics')
            .delete()
            .eq('id', subtopicId)
            .eq('topic_id', topicId);
        if (error)
            throw new Error(`删除子话题失败: ${error.message}`);
        return { success: true };
    }
    async updateSubtopicAuth(topicId, subtopicId, authLevel, authPerson, restriction) {
        return this.authSkill.updateAuth(topicId, subtopicId, authLevel, authPerson, restriction);
    }
    async updateIntervieweeAuthorization(topicId, intervieweeId, payload) {
        return this.authSkill.updateIntervieweeAuthorization(topicId, intervieweeId, payload);
    }
    async getAuthList(topicId) {
        return this.authSkill.getAuthList(topicId);
    }
    async getAuthOverview(topicId) {
        return this.authSkill.getAuthOverview(topicId);
    }
    async getDashboard() {
        const { data: topics, error } = await this.client
            .from('topics')
            .select('id, name, description, status, created_at')
            .eq('status', 'active')
            .order('updated_at', { ascending: false })
            .limit(1);
        if (error)
            throw new Error(`查询话题失败: ${error.message}`);
        if (!topics || topics.length === 0) {
            return { topic: null, nextSteps: [] };
        }
        const topic = topics[0];
        const { data: subtopics, error: subError } = await this.client
            .from('subtopics')
            .select('id, name, icon, transcript_status, verify_status, auth_level, summary')
            .eq('topic_id', topic.id)
            .order('created_at', { ascending: true });
        if (subError)
            throw new Error(`查询子话题失败: ${subError.message}`);
        const subs = subtopics || [];
        const nextSteps = [];
        const hasNoSubtopics = subs.length === 0;
        const hasUntranscribed = subs.some((s) => s.transcript_status === 'not_started');
        const hasPendingVerify = subs.some((s) => s.verify_status === 'pending');
        const hasUnauthorized = subs.some((s) => s.auth_level === 'not_set' && s.transcript_status === 'transcribed');
        const allDone = subs.length > 0 && subs.every((s) => s.transcript_status === 'transcribed' && s.auth_level !== 'not_set');
        if (hasNoSubtopics) {
            nextSteps.push('先为话题添加几个子话题，比如"木雕""屋脊装饰"等');
            nextSteps.push('然后去"采访策划"生成采访问题清单');
        }
        else if (hasUntranscribed) {
            nextSteps.push('有子话题还没有整理好的采访内容，可以先用外部工具整理后再上传或录入');
        }
        if (hasPendingVerify) {
            nextSteps.push('有内容待核实，需要查证相关信息');
        }
        if (hasUnauthorized) {
            nextSteps.push('采访内容整理完成后，需要确认受访人授权状态和话题归属');
        }
        if (allDone) {
            nextSteps.push('🎉 阶段性完成！可以继续深挖某个子话题，或开始新话题');
        }
        return {
            topic: { ...topic, subtopics: subs },
            nextSteps,
        };
    }
    async getQuotes(topicId, subtopicId) {
        const { data: records, error } = await this.client
            .from('interview_records')
            .select('id, created_at, mandarin_text, dialect_original, transcript_text, ai_analysis')
            .eq('topic_id', topicId)
            .eq('subtopic_id', subtopicId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false });
        if (error)
            throw new Error(`查询采访记录失败: ${error.message}`);
        const { data: people } = await this.client
            .from('interviewees')
            .select('id, name, age, occupation, role')
            .eq('topic_id', topicId);
        const peopleByName = new Map();
        for (const person of people || []) {
            peopleByName.set(String(person.name), person);
        }
        const quotes = (records || []).map((record, index) => {
            const segments = extractSegments(record);
            const text = getRecordText(record);
            const firstSegment = segments[0];
            const base = extractPersonBase(record);
            const savedPerson = peopleByName.get(base.name);
            const quoteText = shortText(firstSegment?.quote || firstSegment?.source_text || firstSegment?.mandarin_text || firstSegment?.summary || text, 160) ||
                '暂无摘录';
            return {
                id: record.id,
                quote: quoteText,
                summary: shortText(firstSegment?.summary || text, 120),
                full_interview: text || '',
                created_at: record.created_at || null,
                interviewee: {
                    id: savedPerson?.id || `temp-${index}-${record.id}`,
                    name: String(savedPerson?.name || base.name),
                    age: savedPerson?.age || base.age || null,
                    occupation: savedPerson?.occupation || base.occupation || null,
                    role: savedPerson?.role || base.role || null,
                },
            };
        });
        return quotes;
    }
    async createQuote(topicId, subtopicId, body) {
        let intervieweeId = null;
        const { data: existing } = await this.client
            .from('interviewees')
            .select('id')
            .eq('topic_id', topicId)
            .eq('name', body.interviewee_name)
            .maybeSingle();
        if (existing) {
            intervieweeId = existing.id;
            const updateData = {};
            if (body.age)
                updateData.age = body.age;
            if (body.occupation)
                updateData.occupation = body.occupation;
            if (body.role)
                updateData.role = body.role;
            if (Object.keys(updateData).length > 0) {
                await this.client.from('interviewees').update(updateData).eq('id', intervieweeId);
            }
        }
        else {
            const { data: newPerson, error: personError } = await this.client
                .from('interviewees')
                .insert({
                topic_id: topicId,
                name: body.interviewee_name,
                age: body.age || null,
                occupation: body.occupation || null,
                role: body.role || null,
            })
                .select('id')
                .single();
            if (personError)
                throw new Error(`创建受访人失败: ${personError.message}`);
            intervieweeId = newPerson.id;
        }
        const aiAnalysis = {
            interviewee: {
                name: body.interviewee_name,
                age: body.age || null,
                occupation: body.occupation || null,
                role: body.role || null,
            },
            segments: [
                {
                    quote: body.quote || shortText(body.full_interview, 160),
                    summary: shortText(body.full_interview, 120),
                },
            ],
        };
        const { data: record, error: recordError } = await this.client
            .from('interview_records')
            .insert({
            topic_id: topicId,
            subtopic_id: subtopicId,
            mandarin_text: body.full_interview,
            status: 'completed',
            ai_analysis: aiAnalysis,
        })
            .select()
            .single();
        if (recordError)
            throw new Error(`创建采访记录失败: ${recordError.message}`);
        return {
            id: record.id,
            quote: body.quote || shortText(body.full_interview, 160),
            full_interview: body.full_interview,
            created_at: record.created_at,
            interviewee: {
                id: intervieweeId,
                name: body.interviewee_name,
                age: body.age || null,
                occupation: body.occupation || null,
                role: body.role || null,
            },
        };
    }
    async updateQuote(topicId, subtopicId, quoteId, body) {
        const { data: existing, error: fetchError } = await this.client
            .from('interview_records')
            .select('id, ai_analysis, mandarin_text')
            .eq('id', quoteId)
            .eq('topic_id', topicId)
            .maybeSingle();
        if (fetchError)
            throw new Error(`查询记录失败: ${fetchError.message}`);
        if (!existing)
            throw new Error('记录不存在');
        if (body.interviewee_name) {
            const oldAnalysis = (existing.ai_analysis || {});
            const oldInterviewee = (oldAnalysis.interviewee || {});
            const oldName = String(oldInterviewee.name || '');
            const { data: person } = await this.client
                .from('interviewees')
                .select('id')
                .eq('topic_id', topicId)
                .eq('name', oldName)
                .maybeSingle();
            if (person) {
                const updateData = { name: body.interviewee_name };
                if (body.age !== undefined)
                    updateData.age = body.age;
                if (body.occupation !== undefined)
                    updateData.occupation = body.occupation;
                if (body.role !== undefined)
                    updateData.role = body.role;
                await this.client.from('interviewees').update(updateData).eq('id', person.id);
            }
        }
        const fullText = body.full_interview || existing.mandarin_text || '';
        const quoteText = body.quote || shortText(fullText, 160);
        const newAnalysis = {
            interviewee: {
                name: body.interviewee_name || '',
                age: body.age || null,
                occupation: body.occupation || null,
                role: body.role || null,
            },
            segments: [
                {
                    quote: quoteText,
                    summary: shortText(fullText, 120),
                },
            ],
        };
        const updateData = {
            ai_analysis: newAnalysis,
            updated_at: new Date().toISOString(),
        };
        if (body.full_interview !== undefined) {
            updateData.mandarin_text = body.full_interview;
        }
        const { data: record, error: updateError } = await this.client
            .from('interview_records')
            .update(updateData)
            .eq('id', quoteId)
            .select()
            .single();
        if (updateError)
            throw new Error(`更新采访记录失败: ${updateError.message}`);
        return {
            id: record.id,
            quote: quoteText,
            full_interview: fullText,
            created_at: record.created_at,
            interviewee: {
                name: body.interviewee_name || '',
                age: body.age || null,
                occupation: body.occupation || null,
                role: body.role || null,
            },
        };
    }
    async deleteQuote(topicId, subtopicId, quoteId) {
        const { error } = await this.client
            .from('interview_records')
            .delete()
            .eq('id', quoteId)
            .eq('topic_id', topicId)
            .eq('subtopic_id', subtopicId);
        if (error)
            throw new Error(`删除采访记录失败: ${error.message}`);
        return { success: true };
    }
    async archiveTopic(topicId) {
        const { data, error } = await this.client
            .from('topics')
            .update({
            status: 'archived',
            updated_at: new Date().toISOString(),
        })
            .eq('id', topicId)
            .select()
            .single();
        if (error)
            throw new Error(`归档话题失败: ${error.message}`);
        return data;
    }
};
exports.TopicsService = TopicsService;
exports.TopicsService = TopicsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [authorization_manager_skill_1.AuthorizationManagerSkill])
], TopicsService);
//# sourceMappingURL=topics.service.js.map