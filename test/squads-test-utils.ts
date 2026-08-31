import type { Prisma, PrismaClient, Squad } from '../generated/prisma/client';

export async function clearSquads(prisma: PrismaClient): Promise<void> {
  await prisma.squad.deleteMany();
}

export async function seedSquads(
  prisma: PrismaClient,
  squads: readonly Prisma.SquadCreateInput[],
): Promise<Squad[]> {
  return Promise.all(squads.map((data) => prisma.squad.create({ data })));
}
