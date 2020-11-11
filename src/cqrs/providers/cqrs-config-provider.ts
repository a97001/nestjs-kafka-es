import { CqrsModuleOptions } from "../interfaces/cqrs-module-options";

export function getCqrsConfigProvider(options: CqrsModuleOptions) {
    return {
        provide: 'CqrsModuleOptions',
        useValue: options,
    };
};