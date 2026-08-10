import { IContributorRepository } from './repositories/contributor.repository.interface';
import { ContributorsService } from './contributors.service';

function buildContribuinte(
  overrides: Partial<{
    id: string;
    github_username: string;
    nome: string;
    avatar_url: string;
    github_url: string;
    linkedin_url: string | null;
    portfolio_url: string | null;
  }> = {},
) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    github_username: 'alice',
    nome: 'Alice',
    avatar_url: 'https://example.com/a.png',
    github_url: 'https://github.com/alice',
    linkedin_url: 'https://linkedin.com/in/alice',
    portfolio_url: 'https://alice.dev',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as never;
}

describe('ContributorsService', () => {
  function createService(): {
    service: ContributorsService;
    repo: jest.Mocked<IContributorRepository>;
  } {
    const repo: jest.Mocked<IContributorRepository> = {
      findAll: jest.fn(),
    };
    return { service: new ContributorsService(repo), repo };
  }

  describe('findAll', () => {
    it('retorna array vazio sem erro quando não há contribuintes', async () => {
      const { service, repo } = createService();
      repo.findAll.mockResolvedValue([]);

      await expect(service.findAll()).resolves.toEqual([]);
    });

    it('mapeia cada entidade para o DTO (id/nome/avatar_url/github_url/linkedin_url/portfolio_url)', async () => {
      const { service, repo } = createService();
      repo.findAll.mockResolvedValue([buildContribuinte()]);

      const result = await service.findAll();

      expect(result).toEqual([
        {
          id: '11111111-1111-1111-1111-111111111111',
          nome: 'Alice',
          avatar_url: 'https://example.com/a.png',
          github_url: 'https://github.com/alice',
          linkedin_url: 'https://linkedin.com/in/alice',
          portfolio_url: 'https://alice.dev',
        },
      ]);
    });

    it('preserva linkedin_url/portfolio_url como null quando o contribuinte não cadastrou', async () => {
      const { service, repo } = createService();
      repo.findAll.mockResolvedValue([
        buildContribuinte({ linkedin_url: null, portfolio_url: null }),
      ]);

      const result = await service.findAll();

      expect(result[0].linkedin_url).toBeNull();
      expect(result[0].portfolio_url).toBeNull();
    });

    it('não vaza os campos internos github_username/created_at/updated_at no DTO', async () => {
      const { service, repo } = createService();
      repo.findAll.mockResolvedValue([buildContribuinte()]);

      const result = await service.findAll();

      expect(result[0]).not.toHaveProperty('github_username');
      expect(result[0]).not.toHaveProperty('created_at');
      expect(result[0]).not.toHaveProperty('updated_at');
    });
  });
});
