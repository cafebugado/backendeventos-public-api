import { Inject, Injectable } from '@nestjs/common';
import { TagResponseDto } from './dto/tag-response.dto';
import { TAG_REPOSITORY } from './repositories/tag.repository.interface';
import type { ITagRepository } from './repositories/tag.repository.interface';

@Injectable()
export class TagsService {
  constructor(
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: ITagRepository,
  ) {}

  async findAll(): Promise<TagResponseDto[]> {
    const tags = await this.tagRepository.findAll();
    return tags.map((tag) => TagResponseDto.fromEntity(tag));
  }

  async getEventTagsMap(): Promise<Record<string, TagResponseDto[]>> {
    const map = await this.tagRepository.findEventTagsMap();
    const result: Record<string, TagResponseDto[]> = {};
    for (const [eventoId, tags] of Object.entries(map)) {
      result[eventoId] = tags.map((tag) => TagResponseDto.fromEntity(tag));
    }
    return result;
  }
}
