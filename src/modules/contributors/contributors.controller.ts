import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CACHE_TTL } from '../../common/constants/cache-ttl';
import { CacheTtl } from '../../common/decorators/cache-ttl.decorator';
import { CacheControlInterceptor } from '../../common/interceptors/cache-control.interceptor';
import { ContributorResponseDto } from './dto/contributor-response.dto';
import { ContributorsService } from './contributors.service';

@ApiTags('contributors')
@Controller('contributors')
@UseInterceptors(CacheControlInterceptor)
@CacheTtl(CACHE_TTL.reference)
export class ContributorsController {
  constructor(private readonly contributorsService: ContributorsService) {}

  @Get()
  @ApiOkResponse({ type: ContributorResponseDto, isArray: true })
  findAll(): Promise<ContributorResponseDto[]> {
    return this.contributorsService.findAll();
  }
}
