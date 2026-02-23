import { useEffect } from 'react';

interface UseClipboardPasteProps {
  onImagePasted: (file: File) => void;
  isEnabled?: boolean;
}

export function useClipboardPaste({ onImagePasted, isEnabled = true }: UseClipboardPasteProps) {
  useEffect(() => {
    if (!isEnabled) return;

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            onImagePasted(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onImagePasted, isEnabled]);
}
