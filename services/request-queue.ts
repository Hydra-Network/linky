type QueueItem<T> = {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
  retries: number;
};

export class RequestQueue<T> {
  private queue: QueueItem<T>[] = [];
  private active = 0;

  constructor(
    private concurrency: number,
    private maxRetries: number,
    private baseDelayMs: number,
  ) {}

  enqueue(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ fn, resolve, reject, retries: 0 });
      this.process();
    });
  }

  private async process() {
    while (this.active < this.concurrency && this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.active++;
      this.execute(item).finally(() => {
        this.active--;
        this.process();
      });
    }
  }

  private async execute(item: QueueItem<T>) {
    try {
      const result = await item.fn();
      item.resolve(result);
    } catch (err) {
      if (item.retries < this.maxRetries) {
        item.retries++;
        const delay = this.baseDelayMs * 2 ** (item.retries - 1);
        await new Promise((r) => setTimeout(r, delay));
        await this.execute(item);
      } else {
        item.reject(err as Error);
      }
    }
  }
}
