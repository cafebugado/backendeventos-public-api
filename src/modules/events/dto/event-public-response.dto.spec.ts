import { Evento } from '@prisma/client';
import { EventPublicResponseDto } from './event-public-response.dto';

function buildEvento(overrides: Partial<Evento> = {}): Evento {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    nome: 'Meetup Café Bugado',
    slug: 'meetup-cafe-bugado',
    descricao: 'Um encontro mensal da comunidade',
    data_evento: '10/03/2026',
    horario: '19:00',
    dia_semana: 'Terça-feira',
    periodo: 'Noturno',
    link: 'https://cafebugado.com.br',
    imagem: null,
    modalidade: 'Online',
    endereco: null,
    cidade: 'São Paulo',
    estado: 'SP',
    status: 'publicado',
    motivo_recusa: null,
    created_by: '22222222-2222-2222-2222-222222222222',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('EventPublicResponseDto.fromEntity', () => {
  it('mapeia todos os 16 campos públicos a partir da entidade', () => {
    const dto = EventPublicResponseDto.fromEntity(buildEvento());

    expect(dto).toMatchObject({
      id: '11111111-1111-1111-1111-111111111111',
      slug: 'meetup-cafe-bugado',
      nome: 'Meetup Café Bugado',
      descricao: 'Um encontro mensal da comunidade',
      data_evento: '10/03/2026',
      horario: '19:00',
      dia_semana: 'Terça-feira',
      periodo: 'Noturno',
      modalidade: 'Online',
      endereco: null,
      cidade: 'São Paulo',
      estado: 'SP',
      link: 'https://cafebugado.com.br',
      imagem: null,
    });
    expect(dto.created_at).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(dto.updated_at).toEqual(new Date('2026-01-02T00:00:00.000Z'));
  });

  it('nunca inclui status, created_by ou motivo_recusa', () => {
    const dto = EventPublicResponseDto.fromEntity(
      buildEvento({ status: 'rascunho', motivo_recusa: 'dados incompletos' }),
    );

    expect(dto).not.toHaveProperty('status');
    expect(dto).not.toHaveProperty('created_by');
    expect(dto).not.toHaveProperty('motivo_recusa');
  });
});
