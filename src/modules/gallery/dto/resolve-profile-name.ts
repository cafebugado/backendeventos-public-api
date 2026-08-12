import { UserProfile } from '@prisma/client';

// Réplica de `_profile_display_name` do legado (galeria_service.py): concatena
// nome + sobrenome, `null` se o profile não existir ou os dois campos forem vazios.
export function resolveProfileName(
  profile: Pick<UserProfile, 'nome' | 'sobrenome'> | undefined,
): string | null {
  if (!profile) {
    return null;
  }
  const name = [profile.nome, profile.sobrenome].filter(Boolean).join(' ');
  return name || null;
}
