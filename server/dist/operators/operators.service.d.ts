export interface OperatorContext {
    id: string;
    displayName: string;
    role: string;
    operatorToken: string;
}
export interface OperatorHeaders {
    'x-operator-token'?: string;
    'x-project-code'?: string;
}
export declare class OperatorsService {
    private generateToken;
    identify(displayName: string, role: string, projectId: string, note?: string): Promise<OperatorContext>;
    resolve(token: string | undefined): Promise<OperatorContext | null>;
    require(headers: OperatorHeaders | null): Promise<OperatorContext>;
    roleCan(operator: OperatorContext, action: 'write' | 'admin'): boolean;
    roleLabel(role: string): string;
    logActivity(params: {
        operator: OperatorContext | null;
        projectId?: string;
        actionType: string;
        targetType: string;
        targetId?: string;
        targetName?: string;
        summary: string;
    }): Promise<void>;
    getActivityLogs(projectId: string, limit?: number): Promise<any[]>;
    getOperatorById(id: string): Promise<OperatorContext | null>;
}
