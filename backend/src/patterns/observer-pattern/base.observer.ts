export interface Observer<TEvent> {
  update(event: TEvent): Promise<void> | void;
}

export interface IBaseObserver<TEvent> extends Observer<TEvent> {}

export class Subject<TEvent> {
  private observers = new Set<Observer<TEvent>>();

  attach(observer: Observer<TEvent>): void {
    this.observers.add(observer);
  }

  detach(observer: Observer<TEvent>): void {
    this.observers.delete(observer);
  }

  subscribe(observer: Observer<TEvent>): void {
    this.attach(observer);
  }

  unsubscribe(observer: Observer<TEvent>): void {
    this.detach(observer);
  }

  async notify(event: TEvent): Promise<void> {
    const results = await Promise.allSettled(
      Array.from(this.observers, (observer) => Promise.resolve(observer.update(event))),
    );

    results.forEach((result) => {
      if (result.status === 'rejected') {
        console.error('Observer execution failed:', result.reason);
      }
    });
  }
}
