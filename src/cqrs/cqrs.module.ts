import { DynamicModule, Global, Module } from '@nestjs/common';
import { CqrsEventBus } from './providers/cqrs-event-bus';
import { CqrsCommandBus } from './providers/cqrs-command-bus';
import { TypegooseModule } from 'nestjs-typegoose';
import { CqrsEvent } from './models/cqrs-event';
import { CqrsEventStore } from './providers/cqrs-event-store';
import { CqrsModuleOptions } from './interfaces/cqrs-module-options';
import { KafkaModule } from 'nestjs-rdkafka';
import { getCqrsConfigProvider } from './providers/cqrs-config-provider';
import { CqrsEventPublisher } from './providers/cqrs-event-publisher';

@Global()
@Module({
  imports: [
    TypegooseModule.forFeature([
      { typegooseClass: CqrsEvent, schemaOptions: { collection: 'cqrsEvents', timestamps: true, ...{ autoCreate: true } } }
    ]),
    KafkaModule
  ],
  providers: [CqrsEventBus, CqrsCommandBus, CqrsEventStore, CqrsEventPublisher]
})
export class CqrsModule {
  static forRootAsync(options: CqrsModuleOptions): DynamicModule {
    const cqrsConfigProvider = getCqrsConfigProvider(options);
    return {
      module: CqrsModule,
      providers: [
        cqrsConfigProvider,
        CqrsEventBus,
        CqrsCommandBus,
        CqrsEventStore
      ],
      exports: [cqrsConfigProvider, CqrsEventBus, CqrsCommandBus, CqrsEventStore]
    }
  }
}
