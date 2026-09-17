/**
 * Helper para procesar URLs de video (Google Drive, YouTube, Vimeo, directos)
 * para evitar saturar el servidor y base de datos con archivos pesados.
 */
export interface VideoEmbedInfo {
  isEmbed: boolean;
  embedUrl: string;
  isDrive: boolean;
  rawUrl: string;
}

export function parseVideoUrl(url: string): VideoEmbedInfo {
  if (!url) {
    return { isEmbed: false, embedUrl: '', isDrive: false, rawUrl: '' };
  }

  const trimmed = url.trim();

  // 1. Google Drive
  if (trimmed.includes('drive.google.com')) {
    const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return {
        isEmbed: true,
        embedUrl: `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`,
        isDrive: true,
        rawUrl: trimmed,
      };
    }

    const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return {
        isEmbed: true,
        embedUrl: `https://drive.google.com/file/d/${idMatch[1]}/preview`,
        isDrive: true,
        rawUrl: trimmed,
      };
    }

    if (trimmed.includes('/preview')) {
      return {
        isEmbed: true,
        embedUrl: trimmed,
        isDrive: true,
        rawUrl: trimmed,
      };
    }

    return {
      isEmbed: true,
      embedUrl: trimmed.replace(/\/view(\?.*)?$/, '/preview'),
      isDrive: true,
      rawUrl: trimmed,
    };
  }

  // 2. YouTube
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    let videoId = '';
    if (trimmed.includes('youtu.be/')) {
      videoId = trimmed.split('youtu.be/')[1]?.split('?')[0];
    } else {
      const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (vMatch) videoId = vMatch[1];
    }
    if (videoId) {
      return {
        isEmbed: true,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        isDrive: false,
        rawUrl: trimmed,
      };
    }
  }

  // 3. Loom
  if (trimmed.includes('loom.com/share/')) {
    const loomId = trimmed.split('loom.com/share/')[1]?.split('?')[0];
    if (loomId) {
      return {
        isEmbed: true,
        embedUrl: `https://www.loom.com/embed/${loomId}`,
        isDrive: false,
        rawUrl: trimmed,
      };
    }
  }

  // 4. Video directo (mp4, webm, blob, data:)
  return {
    isEmbed: false,
    embedUrl: trimmed,
    isDrive: false,
    rawUrl: trimmed,
  };
}
