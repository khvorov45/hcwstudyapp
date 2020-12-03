export const BACKEND_PORT = process.env.HFS_BACKEND_PORT
  ? parseInt(process.env.HFS_BACKEND_PORT)
  : 8000

export const DB_CONNECTION_STRING =
  process.env.HFS_DB_CONNECTION_STRING ??
  "postgres://postgres:admin@localhost:7000/postgres"

export const DB_CLEAN = process.env.HFS_DB_CLEAN !== undefined
