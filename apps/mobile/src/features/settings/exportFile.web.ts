// apps/mobile/src/features/settings/exportFile.web.ts
// The web preview has no share sheet (navigator.share needs HTTPS and files); it downloads the file.
export type ExportOutcome = 'shared' | 'saved' | 'unavailable';

export async function shareExport(json: string, fileName: string): Promise<ExportOutcome> {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return 'unavailable';
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'saved';
}
