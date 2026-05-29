export interface AttachmentDto {
  url: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  durationMs?: number;
}
