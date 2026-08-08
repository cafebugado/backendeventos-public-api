import { BadRequestException } from '@nestjs/common';
import { ParseOptionalIntPipe } from './parse-optional-int.pipe';

describe('ParseOptionalIntPipe', () => {
  const pipe = new ParseOptionalIntPipe();

  it('retorna undefined quando o valor está ausente ou vazio', () => {
    expect(pipe.transform(undefined)).toBeUndefined();
    expect(pipe.transform('')).toBeUndefined();
  });

  it('converte uma string inteira válida para número', () => {
    expect(pipe.transform('5')).toBe(5);
  });

  it('lança BadRequestException para valores não inteiros', () => {
    expect(() => pipe.transform('abc')).toThrow(BadRequestException);
    expect(() => pipe.transform('1.5')).toThrow(BadRequestException);
  });
});
