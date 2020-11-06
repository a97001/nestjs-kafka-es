import { DynamicModule, Global, Module } from '@nestjs/common';
import { CqrsEventBus } from './providers/cqrs-event-bus';
import { CqrsCommandBus } from './providers/cqrs-command-bus';
import { TypegooseModule } from 'nestjs-typegoose';
import { CqrsEvent } from './models/cqrs-event';
import { CqrsEventStore } from './providers/cqrs-event-store';
import { CqrsModuleOptions } from './interfaces/cqrs-module-options';
import { KafkaModule } from '@a97001/nestjs-rdkafka';

@Global()
@Module({
  imports: [
    TypegooseModule.forFeature([
      { typegooseClass: CqrsEvent, schemaOptions: { collection: 'cqrsEvents', timestamps: true, ...{ autoCreate: true } } }
    ]),
    KafkaModule
  ],
  providers: [CqrsEventBus, CqrsCommandBus, CqrsEventStore]
})
export class CqrsModule {
  static forRoot(options: CqrsModuleOptions): DynamicModule {
    return {
      module: CqrsModule,
      providers: [{
        provide: 'CqrsModuleOptions',
        useValue: options,
      },
        CqrsEventBus,
        CqrsCommandBus,
        CqrsEventStore
      ],
      exports: [CqrsEventBus, CqrsCommandBus, CqrsEventStore]
    }
  }
}
