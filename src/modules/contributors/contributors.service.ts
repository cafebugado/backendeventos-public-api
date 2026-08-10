import { Inject, Injectable } from '@nestjs/common';
import { ContributorResponseDto } from './dto/contributor-response.dto';
import { CONTRIBUTOR_REPOSITORY } from './repositories/contributor.repository.interface';
import type { IContributorRepository } from './repositories/contributor.repository.interface';

@Injectable()
export class ContributorsService {
  constructor(
    @Inject(CONTRIBUTOR_REPOSITORY)
    private readonly contributorRepository: IContributorRepository,
  ) {}

  async findAll(): Promise<ContributorResponseDto[]> {
    const contribuintes = await this.contributorRepository.findAll();
    return contribuintes.map((contribuinte) =>
      ContributorResponseDto.fromEntity(contribuinte),
    );
  }
}
