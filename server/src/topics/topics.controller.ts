import { Controller, Get, Post, Delete, Body, Param, HttpCode } from '@nestjs/common';
import { TopicsService } from './topics.service';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get('dashboard')
  @HttpCode(200)
  async getDashboard() {
    const data = await this.topicsService.getDashboard();
    return { code: 200, msg: 'success', data };
  }

  @Get()
  @HttpCode(200)
  async findAll() {
    const data = await this.topicsService.findAll();
    return { code: 200, msg: 'success', data };
  }

  @Get(':id')
  @HttpCode(200)
  async findOne(@Param('id') id: string) {
    const data = await this.topicsService.findOne(id);
    return { code: 200, msg: 'success', data };
  }

  @Post()
  @HttpCode(200)
  async create(@Body() body: { name: string; description?: string }) {
    const data = await this.topicsService.create(body.name, body.description);
    return { code: 200, msg: 'success', data };
  }

  @Get(':id/subtopics')
  @HttpCode(200)
  async getSubtopics(@Param('id') id: string) {
    const data = await this.topicsService.getSubtopics(id);
    return { code: 200, msg: 'success', data };
  }

  @Post(':id/subtopics')
  @HttpCode(200)
  async createSubtopic(
    @Param('id') id: string,
    @Body() body: { name: string; icon?: string },
  ) {
    const data = await this.topicsService.createSubtopic(id, body.name, body.icon);
    return { code: 200, msg: 'success', data };
  }

  @Post(':id/subtopics/:subId/auth')
  @HttpCode(200)
  async updateAuth(
    @Param('id') id: string,
    @Param('subId') subId: string,
    @Body() body: {
      auth_level: string;
      auth_method?: string;
      auth_person?: string;
      restriction?: string;
    },
  ) {
    const data = await this.topicsService.updateSubtopicAuth(
      id,
      subId,
      body.auth_level,
      body.auth_method,
      body.auth_person,
      body.restriction,
    );
    return { code: 200, msg: 'success', data };
  }

  @Post(':id/interviewees/:intervieweeId/authorization')
  @HttpCode(200)
  async updateIntervieweeAuthorization(
    @Param('id') id: string,
    @Param('intervieweeId') intervieweeId: string,
    @Body() body: {
      name?: string;
      auth_status: string;
      auth_method?: string;
      auth_note?: string;
      topic_affiliations?: Array<{ primary: string; secondary: string }>;
    },
  ) {
    const data = await this.topicsService.updateIntervieweeAuthorization(
      id,
      intervieweeId,
      {
        name: body.name,
        authStatus: body.auth_status,
        authMethod: body.auth_method,
        authNote: body.auth_note,
        topicAffiliations: body.topic_affiliations,
      },
    );
    return { code: 200, msg: 'success', data };
  }

  @Delete(':id/subtopics/:subId')
  @HttpCode(200)
  async deleteSubtopic(
    @Param('id') id: string,
    @Param('subId') subId: string,
  ) {
    const data = await this.topicsService.deleteSubtopic(id, subId);
    return { code: 200, msg: 'success', data };
  }

  @Get(':id/auth-list')
  @HttpCode(200)
  async getAuthList(@Param('id') id: string) {
    const data = await this.topicsService.getAuthList(id);
    return { code: 200, msg: 'success', data };
  }

  @Get(':id/auth-overview')
  @HttpCode(200)
  async getAuthOverview(@Param('id') id: string) {
    const data = await this.topicsService.getAuthOverview(id);
    return { code: 200, msg: 'success', data };
  }
}
