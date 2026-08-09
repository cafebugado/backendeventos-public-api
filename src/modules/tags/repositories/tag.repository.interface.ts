import { Tag } from '@prisma/client';

export interface ITagRepository {
  findAll(): Promise<Tag[]>;
  findEventTagsMap(): Promise<Record<string, Tag[]>>;
  findTagsForEvento(eventoId: string): Promise<Tag[]>;
}

export const TAG_REPOSITORY = Symbol('TAG_REPOSITORY');
