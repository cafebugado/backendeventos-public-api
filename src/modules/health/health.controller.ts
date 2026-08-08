import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOkResponse({ description: 'Serviço e banco de dados operacionais.' })
  @ApiServiceUnavailableResponse({ description: 'Banco de dados inacessível.' })
  async check(): Promise<{ status: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      this.logger.error('Falha na checagem de saúde do banco de dados', error);
      throw new ServiceUnavailableException('Banco de dados inacessível');
    }
  }
}
