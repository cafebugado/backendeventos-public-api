import { Injectable } from '@nestjs/common';
import { Contribuinte } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { IContributorRepository } from './contributor.repository.interface';

@Injectable()
export class PrismaContributorRepository implements IContributorRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Contribuinte[]> {
    return this.prisma.contribuinte.findMany({
      orderBy: { nome: 'asc' },
    });
  }
}
