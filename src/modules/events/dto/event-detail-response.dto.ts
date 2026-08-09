import { ApiProperty } from '@nestjs/swagger';
import { EventPublicResponseDto } from './event-public-response.dto';
import { TagResponseDto } from '../../tags/dto/tag-response.dto';

export class EventDetailResponseDto {
  @ApiProperty({ type: EventPublicResponseDto })
  evento!: EventPublicResponseDto;

  @ApiProperty({ type: TagResponseDto, isArray: true })
  tags!: TagResponseDto[];

  static from(
    evento: EventPublicResponseDto,
    tags: TagResponseDto[],
  ): EventDetailResponseDto {
    const dto = new EventDetailResponseDto();
    dto.evento = evento;
    dto.tags = tags;
    return dto;
  }
}
