export function getDocument(opts: { data: Uint8Array }): {
  promise: Promise<{
    numPages: number;
    getPage: (n: number) => Promise<{
      getViewport: (o: { scale: number }) => { width: number; height: number };
      render: (o: { canvas: HTMLCanvasElement; viewport: unknown }) => { promise: Promise<void> };
    }>;
  }>;
};

export const GlobalWorkerOptions: { workerSrc: string };
