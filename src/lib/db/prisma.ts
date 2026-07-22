import { PrismaClient } from '@prisma/client'

// Supabase pooler uses a cert chain Node.js doesn't trust by default.
// Relax TLS verification for the Prisma client connection in dev so the
// app can reach the database without needing a custom CA bundle.
if (process.env.NODE_ENV === 'development' && !process.env.DISABLE_TLS_RELAX) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma