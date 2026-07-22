import { ApiClient } from '../api.js';
import { writeJson, writeLine } from '../output.js';
import type { Account, Credits, ExportList } from '../types.js';

export async function whoami(json: boolean): Promise<void> {
  const client = new ApiClient();
  const [account, credits] = await Promise.all([
    client.request<Account>('/account'),
    client.request<Credits>('/credits'),
  ]);
  if (json) {
    writeJson({ account, credits });
    return;
  }
  writeLine(`账户：${account.email ?? account.displayName ?? account.id}`);
  writeLine(`状态：${account.accountStatus}`);
  writeLine(`可用积分：${credits.availableBalance.toLocaleString('zh-CN')}`);
  writeLine(`冻结积分：${credits.reservedBalance.toLocaleString('zh-CN')}`);
}

export async function credits(json: boolean): Promise<void> {
  const result = await new ApiClient().request<Credits>('/credits');
  if (json) {
    writeJson(result);
    return;
  }
  writeLine(`可用积分：${result.availableBalance.toLocaleString('zh-CN')}`);
  writeLine(`冻结积分：${result.reservedBalance.toLocaleString('zh-CN')}`);
  writeLine(`累计获得：${result.lifetimeGranted.toLocaleString('zh-CN')}`);
  writeLine(`累计使用：${result.lifetimeSpent.toLocaleString('zh-CN')}`);
}

export async function history(limit: number, json: boolean): Promise<void> {
  const normalizedLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  const result = await new ApiClient().request<ExportList>(
    `/exports?limit=${normalizedLimit}`,
  );
  if (json) {
    writeJson(result);
    return;
  }
  if (result.exports.length === 0) {
    writeLine('还没有导出记录。');
    return;
  }
  for (const item of result.exports) {
    const createdAt = new Date(item.createdAt).toLocaleString('zh-CN');
    const title = (item.title ?? '未命名视频').replace(/\s+/gu, ' ').slice(0, 44);
    writeLine(`${item.status.padEnd(10)} ${String(item.deliveredRows).padStart(7)} 条  ${title}`);
    writeLine(`  ${item.id}  ${createdAt}`);
  }
  if (result.nextCursor) writeLine('还有更早的记录，可使用 API 分页读取。');
}
