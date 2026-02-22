import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, User, Book, Feather, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileSearchInput } from '@/components/profile/ProfileSearchInput';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import gsap from 'gsap';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditModal = ({ isOpen, onClose }: ProfileEditModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [favoriteBook, setFavoriteBook] = useState('');
  const [favoriteAuthor, setFavoriteAuthor] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
      // Parse reading_preferences for favorites
      const prefs = profile.reading_preferences as { favoriteBook?: string; favoriteAuthor?: string } | null;
      setFavoriteBook(prefs?.favoriteBook || '');
      setFavoriteAuthor(prefs?.favoriteAuthor || '');
    }
  }, [profile]);

  // Fetch user email
  useEffect(() => {
    const getEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    if (isOpen) getEmail();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      gsap.fromTo(modalRef.current, 
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power3.out" }
      );
      
      // Animate form fields with stagger
      if (formRef.current) {
        const fields = formRef.current.querySelectorAll('.form-field');
        gsap.fromTo(fields,
          { opacity: 0, x: -15 },
          { opacity: 1, x: 0, duration: 0.3, stagger: 0.06, ease: "power2.out", delay: 0.15 }
        );
      }
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        opacity: 0,
        scale: 0.95,
        duration: 0.2,
        ease: "power2.in",
        onComplete: onClose
      });
    } else {
      onClose();
    }
  }, [onClose]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image', variant: 'destructive' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max size is 2MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast({ title: 'Avatar uploaded', description: 'Save to apply changes' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: 'Please try again', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await updateProfile({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl || null,
        reading_preferences: {
          favoriteBook: favoriteBook.trim() || null,
          favoriteAuthor: favoriteAuthor.trim() || null
        }
      } as any);

      if (success) {
        handleClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div 
        ref={modalRef}
        className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-100">Edit Profile</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div ref={formRef} className="p-4 space-y-5 max-h-[60vh] overflow-y-auto scrollbar-hide">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 form-field">
            <Avatar className="w-20 h-20">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-slate-700 text-slate-300 text-xl">
                {displayName?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isUploading}
              />
              <span className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                <Upload className="w-3 h-3" />
                {isUploading ? 'Uploading...' : 'Change Avatar'}
              </span>
            </label>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5 form-field">
            <Label htmlFor="email" className="flex items-center gap-2 text-xs">
              <Mail className="w-3 h-3 text-slate-500" />
              Email
            </Label>
            <Input
              id="email"
              value={userEmail}
              disabled
              className="bg-slate-800/30 border-slate-700 text-slate-400 text-sm"
            />
          </div>

          {/* Display Name */}
          <div className="space-y-1.5 form-field">
            <Label htmlFor="displayName" className="text-xs">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How others see you"
              className="bg-slate-800/50 border-slate-600 text-sm"
              maxLength={50}
            />
            <p className="text-[10px] text-slate-500">This is how other readers will find you</p>
          </div>

          {/* Bio */}
          <div className="space-y-1.5 form-field">
            <Label htmlFor="bio" className="text-xs">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about your reading interests..."
              className="bg-slate-800/50 border-slate-600 resize-none text-sm"
              rows={2}
              maxLength={200}
            />
            <p className="text-[10px] text-slate-500">{bio.length}/200 characters</p>
          </div>

          {/* Favorite Book */}
          <div className="space-y-1.5 form-field">
            <Label htmlFor="favoriteBook" className="flex items-center gap-2 text-xs">
              <Book className="w-3 h-3 text-blue-400" />
              Favorite Book
            </Label>
            <ProfileSearchInput
              id="favoriteBook"
              type="book"
              value={favoriteBook}
              onChange={setFavoriteBook}
              placeholder="Search science fiction books..."
              maxLength={100}
            />
          </div>

          {/* Favorite Author */}
          <div className="space-y-1.5 form-field">
            <Label htmlFor="favoriteAuthor" className="flex items-center gap-2 text-xs">
              <Feather className="w-3 h-3 text-emerald-400" />
              Favorite Author
            </Label>
            <ProfileSearchInput
              id="favoriteAuthor"
              type="author"
              value={favoriteAuthor}
              onChange={setFavoriteAuthor}
              placeholder="Search science fiction authors..."
              maxLength={100}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
