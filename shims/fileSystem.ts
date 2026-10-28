// Web build: exports download a Blob instead of writing a file, so these are never called.
export const Paths = { cache: '' };
export class Directory {
  exists = false;
  constructor(...uris: unknown[]) { void uris; }
  create(_options?: unknown) {}
  delete() {}
}
export class File {
  uri = '';
  constructor(...uris: unknown[]) { void uris; }
  create(_options?: unknown) {}
  write(_content: string) {}
  move(_destination: unknown) {}
}
