export interface CqrsModuleOptions {
    eventBusOptions: {
        kafka: {
            replicationFactor: number;
            num_partitions: number;
            'delete.retention.ms': string;
        }
    }
}