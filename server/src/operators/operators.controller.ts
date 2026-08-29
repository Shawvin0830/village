import { Body, Controller, Get, Headers, HttpCode, Post, Query } from '@nestjs/common';
import { OperatorsService, type OperatorHeaders } from './operators.service';

@Controller()
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Post('operators/identify')
  @HttpCode(200)
  async identify(
    @Body()
    body: {
      display_name: string;
      project_code?: string;
      role_code?: string;
      operator_token?: string;
      note?: string;
    },
  ) {
    const data = await this.operatorsService.identify(body);
    return { code: 200, msg: 'success', data };
  }

  @Get('operators/me')
  @HttpCode(200)
  async me(@Headers() headers: OperatorHeaders) {
    const data = await this.operatorsService.me(headers);
    return { code: 200, msg: 'success', data };
  }

  @Post('operators/switch-project')
  @HttpCode(200)
  async switchProject(
    @Body()
    body: {
      display_name: string;
      project_code?: string;
      role_code?: string;
      operator_token?: string;
      note?: string;
    },
  ) {
    const data = await this.operatorsService.identify(body);
    return { code: 200, msg: 'success', data };
  }

  @Get('activity-logs')
  @HttpCode(200)
  async getActivityLogs(
    @Headers() headers: OperatorHeaders,
    @Query('target_type') targetType?: string,
    @Query('target_id') targetId?: string,
  ) {
    const data = await this.operatorsService.getLogs(headers, {
      targetType,
      targetId,
    });
    return { code: 200, msg: 'success', data };
  }
}
