import { ExportDouError } from './api.js';

export function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function writeLine(value = ''): void {
  process.stdout.write(`${value}\n`);
}

export function progress(value: string): void {
  process.stderr.write(`${value}\n`);
}

export function writeError(error: unknown, json: boolean): void {
  const normalized = error instanceof ExportDouError
    ? error
    : new ExportDouError(
      error instanceof Error ? error.message : String(error),
      'cli_error',
    );
  if (json) {
    writeJson({
      error: {
        code: normalized.code,
        message: normalized.message,
        retryAfterSeconds: normalized.retryAfterSeconds,
        status: normalized.status,
      },
    });
    return;
  }
  process.stderr.write(`错误：${normalized.message}\n`);
  process.stderr.write(`代码：${normalized.code}\n`);
  if (normalized.retryAfterSeconds) {
    process.stderr.write(`建议：${normalized.retryAfterSeconds} 秒后重试\n`);
  }
  if (normalized.code === 'insufficient_credits') {
    process.stderr.write('充值：https://exportdou.cn/pricing\n');
  }
}

export function terminalStatus(status: string): boolean {
  return [
    'cancelled',
    'completed',
    'expired',
    'failed',
    'partial',
  ].includes(status);
}
