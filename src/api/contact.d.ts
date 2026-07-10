import type { IncomingMessage, ServerResponse } from 'node:http';

export function handleContact(req: IncomingMessage, res: ServerResponse, options: { to: string }): Promise<void>;
