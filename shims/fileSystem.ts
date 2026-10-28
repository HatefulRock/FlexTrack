// Web build: exports download a Blob instead of writing a file, so these are never called.
export const Paths = { cache: '' };
export class File {
  uri = '';
  create(_options?: unknown) {}
  write(_content: string) {}
}
