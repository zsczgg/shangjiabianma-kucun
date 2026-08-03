import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { prisma } from './db';

const KEY_SETTING = 'catalogApiKeyEncrypted';
const SUFFIX_SETTING = 'catalogApiKeySuffix';

function encryptionKey() {
  const secret = process.env.CONFIG_ENCRYPTION_KEY || process.env.INTERNAL_SYNC_TOKEN;
  if (!secret || secret.length < 24) throw new Error('服务器尚未配置 CONFIG_ENCRYPTION_KEY');
  return createHash('sha256').update(secret).digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

export function decryptSecret(value: string) {
  const packed = Buffer.from(value, 'base64url');
  if (packed.length < 29) throw new Error('加密配置格式无效');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), packed.subarray(0, 12));
  decipher.setAuthTag(packed.subarray(12, 28));
  return Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString('utf8');
}

export async function getCatalogApiKey() {
  const stored = await prisma.appSetting.findUnique({ where: { key: KEY_SETTING } });
  if (stored) {
    try { return decryptSecret(stored.value); }
    catch (error) { console.error('读取加密 API Key 失败，将尝试服务器备用配置', error instanceof Error ? error.message : '未知错误'); }
  }
  return process.env.CATALOG_API_KEY;
}

export async function getCatalogKeyStatus() {
  const [encrypted, suffix] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: KEY_SETTING } }),
    prisma.appSetting.findUnique({ where: { key: SUFFIX_SETTING } }),
  ]);
  const configured = Boolean(encrypted || process.env.CATALOG_API_KEY);
  return { configured, source: encrypted ? 'DATABASE' : configured ? 'ENVIRONMENT' : 'NONE', suffix: suffix?.value || null };
}

export async function validateCatalogApiKey(apiKey: string) {
  const base = process.env.CATALOG_API_BASE_URL?.replace(/\/$/, '');
  if (!base) throw new Error('服务器尚未配置商品编码系统 API 地址');
  const response = await fetch(`${base}/skus?page=1&pageSize=1&status=ALL`, {
    headers: { Authorization: `Bearer ${apiKey}` }, cache: 'no-store', signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(response.status === 401 ? 'API Key 无效或已停用' : `上游接口返回 HTTP ${response.status}`);
  const body = await response.json() as { success?: boolean };
  if (!body.success) throw new Error('上游接口未通过验证');
}

export async function replaceCatalogApiKey(apiKey: string) {
  const trimmed = apiKey.trim();
  if (trimmed.length < 20) throw new Error('API Key 格式不正确');
  await validateCatalogApiKey(trimmed);
  const encrypted = encryptSecret(trimmed);
  await prisma.$transaction([
    prisma.appSetting.upsert({ where: { key: KEY_SETTING }, update: { value: encrypted }, create: { key: KEY_SETTING, value: encrypted } }),
    prisma.appSetting.upsert({ where: { key: SUFFIX_SETTING }, update: { value: trimmed.slice(-4) }, create: { key: SUFFIX_SETTING, value: trimmed.slice(-4) } }),
  ]);
}
