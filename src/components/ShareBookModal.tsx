import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Share2, Link, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { getSocialShareImageUrl } from '@/utils/performance';

interface ShareBookModalProps {
  book: {
    id?: number; // Transmission ID for shareable URL
    title: string;
    author: string;
    cover_url?: string | null;
  };
  onClose: () => void;
}

type TemplateStyle = 'minimal' | 'gradient' | 'dark';

const TEMPLATE_STYLES: { id: TemplateStyle; name: string; description: string }[] = [
  { id: 'minimal', name: 'Minimal', description: 'Clean white' },
  { id: 'gradient', name: 'Cosmic', description: 'Space gradient' },
  { id: 'dark', name: 'Dark', description: 'Sophisticated' },
];

const SITE_URL = 'https://www.leafnode.co.uk';

// Helper to convert image URL to base64 to bypass CORS - improved with multiple fallbacks
const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
  // Try direct fetch first
  try {
    const response = await fetch(url);
    if (response.ok) {
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }
  } catch {
    // Continue to proxies
  }

  // List of CORS proxies to try
  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://cors-anywhere.herokuapp.com/${url}`,
  ];

  for (const proxyUrl of proxies) {
    try {
      const response = await fetch(proxyUrl);
      if (response.ok) {
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      continue;
    }
  }

  return null;
};


const ShareBookModal = ({ book, onClose }: ShareBookModalProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateStyle>('gradient');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useEnhancedToast();

  // Generate shareable URL with OG meta tags
  const shareableUrl = book.id 
    ? `${SITE_URL}/share/book/${book.id}`
    : SITE_URL;

  // Check if native sharing is available
  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  // Copy shareable link to clipboard
  const copyShareableLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setLinkCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Share this link for rich social previews',
        variant: 'success',
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: 'Copy failed',
        description: 'Please copy the link manually',
        variant: 'destructive',
      });
    }
  };

  const generateShareImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    setGeneratingImage(true);
    setImageLoadError(false);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setGeneratingImage(false);
      return null;
    }

    // Instagram Story dimensions (9:16 aspect ratio)
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    // Draw background based on template
    switch (selectedTemplate) {
      case 'minimal':
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, width, height);
        break;
      case 'gradient':
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(0.5, '#1e3a5f');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        // Add subtle stars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        for (let i = 0; i < 80; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 2 + 0.5;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'dark':
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);
        break;
    }

    // Load and draw book cover - centered and larger
    let coverDrawn = false;
    let coverBottomY = 1100;
    
    if (book.cover_url) {
      try {
        const base64Image = await fetchImageAsBase64(book.cover_url);
        
        if (base64Image) {
          const img = new Image();
          
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = base64Image;
          });

          // Calculate cover dimensions - make it prominent and centered
          const maxCoverWidth = 600;
          const maxCoverHeight = 900;
          
          let coverWidth = maxCoverWidth;
          let coverHeight = coverWidth * (img.height / img.width);
          
          if (coverHeight > maxCoverHeight) {
            coverHeight = maxCoverHeight;
            coverWidth = coverHeight * (img.width / img.height);
          }
          
          const coverX = (width - coverWidth) / 2;
          const coverY = (height - coverHeight) / 2 - 150; // Slightly above center

          // Add subtle shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 40;
          ctx.shadowOffsetY = 20;
          ctx.drawImage(img, coverX, coverY, coverWidth, coverHeight);
          ctx.shadowColor = 'transparent';
          
          coverBottomY = coverY + coverHeight;
          coverDrawn = true;
        }
      } catch (error) {
        console.error('Failed to load book cover:', error);
      }
    }

    // Draw placeholder if cover failed to load
    if (!coverDrawn) {
      setImageLoadError(true);
      const placeholderWidth = 400;
      const placeholderHeight = 600;
      const placeholderX = (width - placeholderWidth) / 2;
      const placeholderY = (height - placeholderHeight) / 2 - 150;
      
      ctx.fillStyle = selectedTemplate === 'minimal' ? '#e5e5e5' : 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(placeholderX, placeholderY, placeholderWidth, placeholderHeight);
      
      coverBottomY = placeholderY + placeholderHeight;
    }

    // Draw title and author below cover
    const textColor = selectedTemplate === 'minimal' ? '#1a1a1a' : '#ffffff';
    const subtextColor = selectedTemplate === 'minimal' ? '#666666' : 'rgba(255, 255, 255, 0.7)';

    // Title
    ctx.fillStyle = textColor;
    ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    
    const titleY = coverBottomY + 80;
    const maxWidth = 900;
    
    // Word wrap title
    const words = book.title.split(' ');
    let line = '';
    let y = titleY;
    const lineHeight = 65;
    
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line.trim(), width / 2, y);
        line = word + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), width / 2, y);

    // Author
    ctx.fillStyle = subtextColor;
    ctx.font = '36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`by ${book.author}`, width / 2, y + 70);

    // Branding at bottom - closer to cover/title for better framing
    const brandingY = y + 140;
    ctx.fillStyle = subtextColor;
    ctx.font = '32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('www.leafnode.co.uk', width / 2, brandingY);

    // Generate data URL
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    setGeneratedImageUrl(dataUrl);
    setGeneratingImage(false);
    
    return dataUrl;
  }, [book, selectedTemplate]);

  // Generate image when template changes
  useEffect(() => {
    generateShareImage();
  }, [generateShareImage]);

  const handleNativeShare = async () => {
    if (!canShare) {
      toast({
        title: 'Not available',
        description: 'Sharing is not supported on this device',
        variant: 'destructive',
      });
      return;
    }

    try {
      const imageUrl = generatedImageUrl || await generateShareImage();
      
      if (imageUrl) {
        // Convert base64 to blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `${book.title.replace(/[^a-z0-9]/gi, '_')}_leafnode.png`, { type: 'image/png' });
        
        // Check if we can share files
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
          });
          
          toast({
            title: 'Shared!',
            description: 'Book cover shared successfully',
            variant: 'success',
          });
          return;
        }
      }
      
      // Fallback to text-only share with shareable URL (has OG tags)
      await navigator.share({
        title: book.title,
        text: `Check out "${book.title}" by ${book.author}`,
        url: shareableUrl,
      });
      
      toast({
        title: 'Shared!',
        description: 'Book link shared successfully',
        variant: 'success',
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
        toast({
          title: 'Share failed',
          description: 'Unable to share. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const modal = (
    <div 
      className="fixed inset-0 z-[2000] flex h-[100dvh] w-screen items-center justify-center bg-background/60 backdrop-blur-sm p-3"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-800/95 border border-slate-700 rounded-xl w-full max-w-sm shadow-2xl max-h-[calc(100dvh-1.5rem)] flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-slate-200 font-medium text-sm">Share Book</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-700/50 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Template Selection - Compact */}
          <div className="flex gap-2">
            {TEMPLATE_STYLES.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`flex-1 py-2 px-3 rounded-lg border transition-all text-center ${
                  selectedTemplate === template.id
                    ? 'border-primary bg-primary/10 text-slate-200'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span className="text-xs font-medium">{template.name}</span>
              </button>
            ))}
          </div>

          {/* Preview - Centered */}
          <div className="flex justify-center py-2">
            <div className="relative w-[160px] h-[284px] rounded-lg overflow-hidden bg-slate-900 border border-slate-700 shadow-lg">
              {generatingImage ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-slate-600 border-t-primary rounded-full animate-spin" />
                </div>
              ) : generatedImageUrl ? (
                <img
                  src={generatedImageUrl}
                  alt="Share preview"
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
          </div>

          {imageLoadError && (
            <p className="text-xs text-amber-400/80 text-center">
              Cover couldn't be loaded. A placeholder will be used.
            </p>
          )}

          {/* Copy Link Button - For social previews */}
          {book.id && (
            <Button
              onClick={copyShareableLink}
              variant="ghost"
              className="w-full h-10 text-sm text-slate-300 hover:text-slate-100 active:scale-[0.98] transition-transform"
            >
              {linkCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-400" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-2" />
                  Copy Link (for rich previews)
                </>
              )}
            </Button>
          )}

          {/* Share Button - Compact */}
          <Button
            onClick={handleNativeShare}
            variant="outline"
            className="w-full h-10 text-sm active:scale-[0.98] transition-transform"
            disabled={!canShare || generatingImage}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Image
          </Button>

          {!canShare && (
            <p className="text-xs text-slate-500 text-center">
              Native sharing not available - use Copy Link above
            </p>
          )}
        </div>

        {/* Hidden Canvas */}
        <canvas
          ref={canvasRef}
          className="hidden"
          width={1080}
          height={1920}
        />
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default ShareBookModal;
