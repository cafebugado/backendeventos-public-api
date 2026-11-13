import type { Mocked } from 'vitest';
import { ContributorsController } from './contributors.controller';
import { ContributorsService } from './contributors.service';

describe('ContributorsController', () => {
  function createController(): {
    controller: ContributorsController;
    service: Mocked<Pick<ContributorsService, 'findAll'>>;
  } {
    const service: Mocked<Pick<ContributorsService, 'findAll'>> = {
      findAll: vi.fn(),
    };
    const controller = new ContributorsController(
      service as unknown as ContributorsService,
    );
    return { controller, service };
  }

  it('retorna o array resolvido pelo ContributorsService.findAll', async () => {
    const { controller, service } = createController();
    const dtos = [
      {
        id: '1',
        nome: 'Alice',
        avatar_url: 'https://example.com/a.png',
        github_url: 'https://github.com/alice',
        linkedin_url: null,
        portfolio_url: null,
      },
    ] as never;
    service.findAll.mockResolvedValue(dtos);

    await expect(controller.findAll()).resolves.toBe(dtos);
  });
});
