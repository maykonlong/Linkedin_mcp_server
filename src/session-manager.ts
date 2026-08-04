import { BrowserContext } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { dirname } from 'path';

export class SessionManager {
  private sessionDir: string;
  private sessionFile: string;

  constructor() {
    this.sessionDir = path.resolve(__dirname, '..', 'sessions');
    this.sessionFile = path.join(this.sessionDir, 'session.json');
  }

  public getSessionPath(): string {
    return this.sessionFile;
  }

  public hasSession(): boolean {
    return fs.existsSync(this.sessionFile);
  }

  public async saveSession(context: BrowserContext): Promise<string> {
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
    const storageState = await context.storageState();
    fs.writeFileSync(this.sessionFile, JSON.stringify(storageState, null, 2), 'utf-8');
    return this.sessionFile;
  }
}
