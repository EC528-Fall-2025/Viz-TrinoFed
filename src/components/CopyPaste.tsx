import * as React from 'react';
import { ContentCopy } from '@mui/icons-material';

interface CopyPasteProps {
  dataToCopy?: string;
  copyParentContent?: boolean;
  parentRef?: React.RefObject<HTMLElement | null>;
  style?: React.CSSProperties;
}

export default function CopyPaste ({ dataToCopy, copyParentContent = false, parentRef, style }: CopyPasteProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    let contentToCopy = dataToCopy || '';
    
    if (copyParentContent && parentRef?.current) {
      // Get all text content from the parent element
      contentToCopy = parentRef.current.innerText || parentRef.current.textContent || '';
    } else if (copyParentContent) {
      // Fallback: try to find the parent element by traversing up the DOM
      const parentElement = (e.currentTarget as HTMLElement).parentElement;
      if (parentElement) {
        contentToCopy = parentElement.innerText || parentElement.textContent || '';
      }
    }
    
    navigator.clipboard.writeText(contentToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
      <div
        onClick={handleCopy} 
        style={{ 
          position: 'absolute', 
          top: 10, 
          right: 10, 
          padding: 1,
          fontSize: '18px',
          color: '#666',
          cursor: 'pointer',
          ...style
        }}
      >
        {copied ? '✓' : <ContentCopy sx={{ width: '18px', height: '18px' }} />}
      </div>
  );
};