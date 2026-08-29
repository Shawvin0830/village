import { Controller, Post, Get, Body, Headers, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { OperatorsService } from './operators.service';

@Controller('operators')
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Post('identify')
  @HttpCode(HttpStatus.OK)
  async identify(
    @Body() body: { display_name: string; role?: string; project_code?: string; note?: string },
  ) {
    const operator = await this.operatorsService.identify(
      body.display_name,
      body.role || 'viewer',
      body.project_code || 'village-memory',
      body.note,
    );

    await this.operatorsService.logActivity({
      operator,
      actionType: 'identify',
      targetType: 'operator',
      targetId: operator.id,
      targetName: operator.displayName,
      summary: `${operator.displayName}（${this.operatorsService.roleLabel(operator.role)}）进入项目`,
    });

    return {
      data: {
        operator_id: operator.id,
        operator_token: operator.operatorToken,
        display_name: operator.displayName,
        role: operator.role,
        role_label: this.operatorsService.roleLabel(operator.role),
      },
    };
  }

  @Get('me')
  async me(
    @Headers('x-operator-token') token: string,
    @Headers('x-project-code') projectCode: string,
  ) {
    const operator = await this.operatorsService.require({ 'x-operator-token': token });
    return {
      data: {
        operator_id: operator.id,
        display_name: operator.displayName,
        role: operator.role,
        role_label: this.operatorsService.roleLabel(operator.role),
        can_write: this.operatorsService.roleCan(operator, 'write'),
        can_admin: this.operatorsService.roleCan(operator, 'admin'),
      },
    };
  }

  @Get('activity-logs')
  async getActivityLogs(
    @Headers('x-operator-token') token: string,
    @Headers('x-project-code') projectCode: string,
    @Query('limit') limit?: string,
  ) {
    const operator = await this.operatorsService.require({ 'x-operator-token': token });
    const logs = await this.operatorsService.getActivityLogs(
      projectCode || 'village-memory',
      limit ? parseInt(limit, 10) : 50,
    );
    return { data: logs };
  }
}
