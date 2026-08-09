import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { TAG_REPOSITORY } from './repositories/tag.repository.interface';
import { PrismaTagRepository } from './repositories/prisma-tag.repository';

@Module({
  controllers: [TagsController],
  providers: [
    TagsService,
    { provide: TAG_REPOSITORY, useClass: PrismaTagRepository },
  ],
  exports: [TAG_REPOSITORY],
})
export class TagsModule {}
