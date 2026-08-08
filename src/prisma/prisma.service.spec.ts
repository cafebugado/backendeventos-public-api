import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('conecta ao banco no onModuleInit', async () => {
    const service = new PrismaService();
    const connectSpy = jest
      .spyOn(service, '$connect')
      .mockResolvedValue(undefined);

    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  it('desconecta do banco no onModuleDestroy', async () => {
    const service = new PrismaService();
    const disconnectSpy = jest
      .spyOn(service, '$disconnect')
      .mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
