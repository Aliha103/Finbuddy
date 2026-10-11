// apps/mobile/src/features/settings/exportFile.ts (native)
// Writes the export to the cache directory and hands it to the system share sheet (expo-sharing).
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export type ExportOutcome = 'shared' | 'saved' | 'unavailable';

export async function shareExport(json: string, fileName: string): Promise<ExportOutcome> {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true, intermediates: true });
  file.write(json);
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export FinBuddy data', UTI: 'public.json' });
  return 'shared';
}
