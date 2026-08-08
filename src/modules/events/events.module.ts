import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EVENTO_REPOSITORY } from './repositories/evento.repository.interface';
import { PrismaEventoRepository } from './repositories/prisma-evento.repository';

@Module({
  controllers: [EventsController],
  providers: [
    EventsService,
    { provide: EVENTO_REPOSITORY, useClass: PrismaEventoRepository },
  ],
})
export class EventsModule {}
