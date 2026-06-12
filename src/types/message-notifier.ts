export interface MessageNotifier {
  send(message: string, destination: string): Promise<void>
}
