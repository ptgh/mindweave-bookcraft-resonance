import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Instagram, Twitter, Facebook, Link2, Check, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';

interface ShareBookModalProps {
  book: {
    title: string;
    author: string;
    cover_url?: string | null;
  };
  onClose: () => void;
}

type TemplateStyle = 'minimal' | 'gradient' | 'dark' | 'polaroid';

const TEMPLATE_STYLES: { id: TemplateStyle; name: string; description: string }[] = [
  { id: 'minimal', name: 'Minimal', description: 'Clean white background' },
  { id: 'gradient', name: 'Cosmic', description: 'Space gradient theme' },
  { id: 'dark', name: 'Dark', description: 'Dark sophisticated style' },
  { id: 'polaroid', name: 'Polaroid', description: 'Vintage polaroid frame' },
];

const ShareBookModal = ({ book, onClose }: ShareBookModalProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateStyle>('gradient');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useEnhancedToast();

  const generateShareImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    setGeneratingImage(true);

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
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        break;
      case 'gradient':
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(0.5, '#1e3a5f');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        // Add stars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 100; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 2 + 1;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'dark':
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);
        // Add subtle border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 4;
        ctx.strokeRect(40, 40, width - 80, height - 80);
        break;
      case 'polaroid':
        ctx.fillStyle = '#f5f5f0';
        ctx.fillRect(0, 0, width, height);
        // Draw polaroid frame
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 20;
        ctx.fillRect(140, 200, 800, 1000);
        ctx.shadowColor = 'transparent';
        break;
    }

    // Load and draw book cover
    if (book.cover_url) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = book.cover_url!;
        });

        // Position based on template
        let coverX, coverY, coverWidth, coverHeight;
        
        if (selectedTemplate === 'polaroid') {
          coverX = 180;
          coverY = 240;
          coverWidth = 720;
          coverHeight = 720 * (img.height / img.width);
          if (coverHeight > 700) {
            coverHeight = 700;
            coverWidth = coverHeight * (img.width / img.height);
            coverX = (width - coverWidth) / 2;
          }
        } else {
          coverWidth = 500;
          coverHeight = 500 * (img.height / img.width);
          if (coverHeight > 750) {
            coverHeight = 750;
            coverWidth = coverHeight * (img.width / img.height);
          }
          coverX = (width - coverWidth) / 2;
          coverY = selectedTemplate === 'minimal' ? 400 : 350;
        }

        // Add shadow to cover
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 15;
        ctx.drawImage(img, coverX, coverY, coverWidth, coverHeight);
        ctx.shadowColor = 'transparent';

      } catch (error) {
        console.error('Failed to load book cover:', error);
        // Draw placeholder
        const placeholderX = (width - 400) / 2;
        const placeholderY = 400;
        ctx.fillStyle = selectedTemplate === 'minimal' ? '#e5e5e5' : 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(placeholderX, placeholderY, 400, 600);
      }
    }

    // Draw text
    const textColor = selectedTemplate === 'minimal' ? '#1a1a1a' : '#ffffff';
    const subtextColor = selectedTemplate === 'minimal' ? '#666666' : 'rgba(255, 255, 255, 0.7)';

    // Title
    ctx.fillStyle = textColor;
    ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    
    const titleY = selectedTemplate === 'polaroid' ? 1050 : 1300;
    const maxWidth = selectedTemplate === 'polaroid' ? 700 : 900;
    
    // Word wrap title
    const words = book.title.split(' ');
    let line = '';
    let y = titleY;
    const lineHeight = 70;
    
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
    ctx.font = '40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`by ${book.author}`, width / 2, y + 80);

    // Branding
    ctx.fillStyle = subtextColor;
    ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const brandingY = selectedTemplate === 'polaroid' ? 1150 : height - 120;
    ctx.fillText('📚 leafnode.app', width / 2, brandingY);

    // Currently reading tag
    ctx.fillStyle = selectedTemplate === 'minimal' ? '#3b82f6' : '#60a5fa';
    ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const tagY = selectedTemplate === 'polaroid' ? 180 : 200;
    ctx.fillText('📖 Currently Reading', width / 2, tagY);

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

  const handleDownload = async () => {
    const imageUrl = generatedImageUrl || await generateShareImage();
    if (!imageUrl) {
      toast({
        title: 'Error',
        description: 'Failed to generate image',
        variant: 'destructive',
      });
      return;
    }

    const link = document.createElement('a');
    link.download = `${book.title.replace(/[^a-z0-9]/gi, '_')}_share.png`;
    link.href = imageUrl;
    link.click();

    toast({
      title: 'Downloaded!',
      description: 'Share image saved. Open Instagram and add to your story!',
      variant: 'success',
    });
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/publisher?book=${encodeURIComponent(book.title)}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: 'Link Copied!',
      description: 'Share link copied to clipboard',
      variant: 'success',
    });
  };

  const handleTwitterShare = () => {
    const text = `📚 Currently reading "${book.title}" by ${book.author}`;
    const url = `${window.location.origin}/publisher`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleFacebookShare = () => {
    const url = `${window.location.origin}/publisher`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        // Try sharing with image if supported
        if (generatedImageUrl && navigator.canShare) {
          const blob = await fetch(generatedImageUrl).then(r => r.blob());
          const file = new File([blob], 'book-share.png', { type: 'image/png' });
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: book.title,
              text: `📚 Currently reading "${book.title}" by ${book.author}`,
              files: [file],
            });
            return;
          }
        }
        
        // Fallback to text-only share
        await navigator.share({
          title: book.title,
          text: `📚 Currently reading "${book.title}" by ${book.author}`,
          url: `${window.location.origin}/publisher`,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[2000] flex h-[100dvh] w-screen items-center justify-center bg-background/50 backdrop-blur-sm p-4">
      <div className="bg-slate-800/95 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl max-h-[calc(100dvh-2rem)] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="text-slate-200 font-medium">Share Book</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Template Selection */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Choose Template</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEMPLATE_STYLES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    selectedTemplate === template.id
                      ? 'border-primary bg-primary/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="text-sm font-medium text-slate-200">{template.name}</div>
                  <div className="text-xs text-slate-400">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Preview</h3>
            <div className="flex justify-center">
              <div className="relative w-[180px] h-[320px] rounded-lg overflow-hidden bg-slate-900 border border-slate-700 shadow-lg">
                {generatingImage ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-slate-600 border-t-primary rounded-full animate-spin" />
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
          </div>

          {/* Share Options */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Share To</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Instagram (Download) */}
              <Button
                variant="outline"
                onClick={handleDownload}
                className="flex flex-col items-center gap-2 h-auto py-4 border-slate-700 hover:border-pink-500 hover:bg-pink-500/10"
              >
                <Instagram className="w-6 h-6 text-pink-500" />
                <span className="text-xs">Instagram</span>
              </Button>

              {/* Twitter/X */}
              <Button
                variant="outline"
                onClick={handleTwitterShare}
                className="flex flex-col items-center gap-2 h-auto py-4 border-slate-700 hover:border-slate-400 hover:bg-slate-400/10"
              >
                <Twitter className="w-6 h-6" />
                <span className="text-xs">X / Twitter</span>
              </Button>

              {/* Facebook */}
              <Button
                variant="outline"
                onClick={handleFacebookShare}
                className="flex flex-col items-center gap-2 h-auto py-4 border-slate-700 hover:border-blue-500 hover:bg-blue-500/10"
              >
                <Facebook className="w-6 h-6 text-blue-500" />
                <span className="text-xs">Facebook</span>
              </Button>

              {/* Copy Link */}
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-2 h-auto py-4 border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10"
              >
                {copied ? (
                  <Check className="w-6 h-6 text-emerald-500" />
                ) : (
                  <Link2 className="w-6 h-6 text-slate-400" />
                )}
                <span className="text-xs">{copied ? 'Copied!' : 'Copy Link'}</span>
              </Button>
            </div>
          </div>

          {/* Native Share (Mobile) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              onClick={handleNativeShare}
              className="w-full"
              variant="secondary"
            >
              More Sharing Options
            </Button>
          )}

          {/* Download Button */}
          <Button
            onClick={handleDownload}
            className="w-full"
            disabled={generatingImage}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Image for Sharing
          </Button>
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
