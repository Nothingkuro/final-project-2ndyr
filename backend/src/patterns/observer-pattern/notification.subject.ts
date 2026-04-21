import type { Response } from 'express';

type NotificationSignal = {
  type: 'REFRESH_NOTIFICATIONS';
  timestamp: string;
};

export class NotificationSubject {
  private clients = new Map<string, Response>();

  subscribeClient(id: string, res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Cache-Control', 'no-cache');

    this.clients.set(id, res);

    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    res.write(': connected\n\n');

    res.on('close', () => {
      this.clients.delete(id);
    });
  }

  async notifyAll(): Promise<void> {
    const payload: NotificationSignal = {
      type: 'REFRESH_NOTIFICATIONS',
      timestamp: new Date().toISOString(),
    };
    const message = `data: ${JSON.stringify(payload)}\n\n`;

    for (const [id, client] of this.clients) {
      if (client.writableEnded) {
        this.clients.delete(id);
        continue;
      }

      try {
        client.write(message);
      } catch (error) {
        console.error('Failed to notify SSE client:', error);
        this.clients.delete(id);
      }
    }
  }
}

export const globalNotificationSubject = new NotificationSubject();
