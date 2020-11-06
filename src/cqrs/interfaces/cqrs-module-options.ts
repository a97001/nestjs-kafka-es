export interface CqrsModuleOptions {
    replicationFactor: number;
    'delete.retention.ms': number;
}