import { Module } from '@nestjs/common';
import { ContributorsController } from './contributors.controller';
import { ContributorsService } from './contributors.service';
import { CONTRIBUTOR_REPOSITORY } from './repositories/contributor.repository.interface';
import { PrismaContributorRepository } from './repositories/prisma-contributor.repository';

@Module({
  controllers: [ContributorsController],
  providers: [
    ContributorsService,
    {
      provide: CONTRIBUTOR_REPOSITORY,
      useClass: PrismaContributorRepository,
    },
  ],
})
export class ContributorsModule {}
