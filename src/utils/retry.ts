export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelay?: number; label?: string } = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelay = 1000, label = 'operaçao' } = options;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt === maxAttempts) {
        console.error(`[Retry Error] ${label} falhou definitivamente na tentativa ${maxAttempts}/${maxAttempts}: ${error.message}`);
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`[Retry Warning] ${label} tentativa ${attempt}/${maxAttempts} falhou. Tentando novamente em ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error(`[Retry Error] Excedido limite de tentativas para ${label}`);
}
