import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export class EmailTakenError extends Error {
  constructor() {
    super("email_taken");
  }
}

export interface UserStore {
  findByEmail(email: string): User | null;
  findById(id: string): User | null;
  create(u: { email: string; name: string; passwordHash: string }): User;
  delete(id: string): boolean;
  count(): number;
}

/**
 * Minimal user store: in memory, optionally persisted to a JSON file (atomic write via rename).
 * Suitable for a hackathon demo. NOTE: on hosts with an ephemeral filesystem (e.g. App Platform) the file is lost
 * on redeploy; swap this class for a managed database for real use. Only account data is stored here, never
 * investigation content.
 */
export class FileUserStore implements UserStore {
  private byId = new Map<string, User>();
  private byEmail = new Map<string, string>();

  constructor(private path: string | null) {
    if (path && existsSync(path)) {
      try {
        const raw = JSON.parse(readFileSync(path, "utf8")) as { users?: User[] };
        for (const u of raw.users ?? []) this.index(u);
      } catch {
        throw new Error(`Could not read user store at ${path}; refusing to start with a corrupt file.`);
      }
    }
  }

  private index(u: User): void {
    this.byId.set(u.id, u);
    this.byEmail.set(u.email, u.id);
  }

  private persist(): void {
    if (!this.path) return;
    mkdirSync(dirname(this.path), { recursive: true });
    const tmp = `${this.path}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify({ users: [...this.byId.values()] }, null, 2), { mode: 0o600 });
    renameSync(tmp, this.path);
  }

  findByEmail(email: string): User | null {
    const id = this.byEmail.get(email);
    return id ? (this.byId.get(id) ?? null) : null;
  }
  findById(id: string): User | null {
    return this.byId.get(id) ?? null;
  }
  create(u: { email: string; name: string; passwordHash: string }): User {
    if (this.byEmail.has(u.email)) throw new EmailTakenError();
    const user: User = { id: randomUUID(), createdAt: new Date().toISOString(), ...u };
    this.index(user);
    this.persist();
    return user;
  }
  delete(id: string): boolean {
    const u = this.byId.get(id);
    if (!u) return false;
    this.byId.delete(id);
    this.byEmail.delete(u.email);
    this.persist();
    return true;
  }
  count(): number {
    return this.byId.size;
  }
}
