import Vue from 'vue'

export function getEngine(): any {
  // Prefer Vue 2 global prototype if available
  const vueEngine = (Vue as any)?.prototype?.$engine


  return (
    vueEngine ||
    (typeof window !== 'undefined' && (window as any).__ldesignEngine) ||
    (typeof window !== 'undefined' && (window as any).__ENGINE__) ||
    undefined
  );
}

export async function waitForEngine(timeoutMs = 5000): Promise<any> {
  const existing = getEngine();
  if (existing) return existing;

  return new Promise((resolve, reject) => {
    const onReady = () => {
      const eng = getEngine();
      if (eng) {
        resolve(eng);
        window.removeEventListener('ldesign:engine-ready', onReady);
      }
    };
    window.addEventListener('ldesign:engine-ready', onReady);

    const timer = setTimeout(() => {
      window.removeEventListener('ldesign:engine-ready', onReady);
      reject(new Error('waitForEngine timeout'));
    }, timeoutMs);

    // Clear timer when resolved
    const originalResolve = resolve as any;
    (resolve as any) = (v: any) => {
      clearTimeout(timer);
      originalResolve(v);
    };
  });
}

