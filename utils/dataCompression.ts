
/**
 * Simple LZ-based compression for JSON data
 * Uses browser's CompressionStream when available
 */
export const compressData = async (data: any): Promise<string> => {
  const jsonString = JSON.stringify(data);
  if (typeof CompressionStream !== 'undefined') {
    const stream = new Blob([jsonString]).stream();
    const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
    const compressedBlob = await new Response(compressedStream).blob();
    const buffer = await compressedBlob.arrayBuffer();
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }
  return btoa(encodeURIComponent(jsonString));
};

export const decompressData = async (compressed: string): Promise<any> => {
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const binary = atob(compressed);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const stream = new Blob([bytes]).stream();
      const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
      const decompressedBlob = await new Response(decompressedStream).blob();
      const text = await decompressedBlob.text();
      return JSON.parse(text);
    } catch {
      return JSON.parse(decodeURIComponent(atob(compressed)));
    }
  }
  return JSON.parse(decodeURIComponent(atob(compressed)));
};

/**
 * Chunk large arrays for batch processing
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
