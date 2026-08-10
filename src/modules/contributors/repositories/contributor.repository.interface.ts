import { Contribuinte } from '@prisma/client';

export interface IContributorRepository {
  findAll(): Promise<Contribuinte[]>;
}

export const CONTRIBUTOR_REPOSITORY = Symbol('CONTRIBUTOR_REPOSITORY');
