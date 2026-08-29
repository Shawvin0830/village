import { OperatorsService } from './operators.service';
export declare class OperatorsController {
    private readonly operatorsService;
    constructor(operatorsService: OperatorsService);
    identify(body: {
        display_name: string;
        role?: string;
        project_code?: string;
        note?: string;
    }): Promise<{
        data: {
            operator_id: string;
            operator_token: string;
            display_name: string;
            role: string;
            role_label: string;
        };
    }>;
    me(token: string, projectCode: string): Promise<{
        data: {
            operator_id: string;
            display_name: string;
            role: string;
            role_label: string;
            can_write: boolean;
            can_admin: boolean;
        };
    }>;
    getActivityLogs(token: string, projectCode: string, limit?: string): Promise<{
        data: any[];
    }>;
}
