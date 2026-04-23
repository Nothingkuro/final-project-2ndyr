export interface ICommand {
  execute(): Promise<any>;
  undo(): Promise<unknown>;
}
