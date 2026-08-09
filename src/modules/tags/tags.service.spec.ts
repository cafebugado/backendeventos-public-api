import { ITagRepository } from './repositories/tag.repository.interface';
import { TagsService } from './tags.service';

function buildTag(
  overrides: Partial<{ id: string; nome: string; cor: string | null }> = {},
) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    nome: 'Backend',
    cor: '#2563eb',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    created_by: null,
    ...overrides,
  } as never;
}

describe('TagsService', () => {
  function createService(): {
    service: TagsService;
    repo: jest.Mocked<ITagRepository>;
  } {
    const repo: jest.Mocked<ITagRepository> = {
      findAll: jest.fn(),
      findEventTagsMap: jest.fn(),
      findTagsForEvento: jest.fn(),
    };
    return { service: new TagsService(repo), repo };
  }

  describe('findAll', () => {
    it('retorna array vazio sem erro quando não há tags', async () => {
      const { service, repo } = createService();
      repo.findAll.mockResolvedValue([]);

      await expect(service.findAll()).resolves.toEqual([]);
    });

    it('mapeia cada entidade para o DTO (id/nome/cor)', async () => {
      const { service, repo } = createService();
      repo.findAll.mockResolvedValue([buildTag()]);

      const result = await service.findAll();

      expect(result).toEqual([
        {
          id: '11111111-1111-1111-1111-111111111111',
          nome: 'Backend',
          cor: '#2563eb',
        },
      ]);
    });

    it('não vaza o campo interno created_by no DTO', async () => {
      const { service, repo } = createService();
      repo.findAll.mockResolvedValue([buildTag({ id: '1' })]);

      const result = await service.findAll();

      expect(result[0]).not.toHaveProperty('created_by');
    });
  });

  describe('getEventTagsMap', () => {
    it('retorna objeto vazio quando o repositório não encontra nenhuma associação', async () => {
      const { service, repo } = createService();
      repo.findEventTagsMap.mockResolvedValue({});

      await expect(service.getEventTagsMap()).resolves.toEqual({});
    });

    it('mapeia as tags de cada evento para DTO, preservando as chaves por evento_id', async () => {
      const { service, repo } = createService();
      repo.findEventTagsMap.mockResolvedValue({
        'evento-1': [buildTag({ id: 't1', nome: 'Backend' })],
        'evento-2': [buildTag({ id: 't2', nome: 'Frontend' })],
      });

      const result = await service.getEventTagsMap();

      expect(result).toEqual({
        'evento-1': [{ id: 't1', nome: 'Backend', cor: '#2563eb' }],
        'evento-2': [{ id: 't2', nome: 'Frontend', cor: '#2563eb' }],
      });
    });
  });
});
