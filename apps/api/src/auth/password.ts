import { argon2id, hash, verify } from "argon2";
export const passwordParameters = { type: argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 } as const;
export const hashPassword = (password: string) => hash(password, passwordParameters);
export const verifyPassword = (digest: string, password: string) => verify(digest, password);
