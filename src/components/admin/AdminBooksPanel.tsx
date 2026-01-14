import React, { useState, useEffect } from 'react';
import { Book, Search, Plus, Edit2, Trash2, Image, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TransmissionBook {
  id: number;
  title: string | null;
  author: string | null;
  cover_url: string | null;
  isbn: string | null;
  publication_year: number | null;
  notes: string | null;
  tags: string | null;
  apple_link: string | null;
}

export const AdminBooksPanel: React.FC = () => {
  const { toast } = useEnhancedToast();
  const [books, setBooks] = useState<TransmissionBook[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<TransmissionBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBook, setEditingBook] = useState<TransmissionBook | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnrichingCovers, setIsEnrichingCovers] = useState(false);
  const [stats, setStats] = useState({ total: 0, withCover: 0, withIsbn: 0, withAppleLink: 0 });

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setFilteredBooks(books.filter(b => 
        b.title?.toLowerCase().includes(q) || 
        b.author?.toLowerCase().includes(q) ||
        b.isbn?.includes(q)
      ));
    } else {
      setFilteredBooks(books);
    }
  }, [searchQuery, books]);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transmissions')
        .select('id, title, author, cover_url, isbn, publication_year, notes, tags, apple_link')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mapped = (data || []) as TransmissionBook[];
      setBooks(mapped);
      setFilteredBooks(mapped);
      
      setStats({
        total: mapped.length,
        withCover: mapped.filter(b => b.cover_url).length,
        withIsbn: mapped.filter(b => b.isbn).length,
        withAppleLink: mapped.filter(b => b.apple_link).length,
      });
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({ title: 'Error', description: 'Failed to fetch books', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrichCovers = async () => {
    setIsEnrichingCovers(true);
    try {
      const { invokeAdminFunction } = await import('@/utils/adminFunctions');
      const { data, error } = await invokeAdminFunction('enrich-book-covers');
      if (error) throw error;
      toast({
        title: 'Cover Enrichment Complete',
        description: `Updated ${(data as { updated?: number })?.updated || 0} book covers`,
        variant: 'success',
      });
      fetchBooks();
    } catch (error) {
      console.error('Error enriching covers:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to enrich covers', variant: 'destructive' });
    } finally {
      setIsEnrichingCovers(false);
    }
  };

  const handleEdit = (book: TransmissionBook) => {
    setEditingBook({ ...book });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingBook) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('transmissions')
        .update({
          title: editingBook.title,
          author: editingBook.author,
          cover_url: editingBook.cover_url,
          isbn: editingBook.isbn,
          publication_year: editingBook.publication_year,
          apple_link: editingBook.apple_link,
        })
        .eq('id', editingBook.id);

      if (error) throw error;
      toast({ title: 'Saved', description: 'Book updated successfully', variant: 'success' });
      setShowEditModal(false);
      fetchBooks();
    } catch (error) {
      console.error('Error saving book:', error);
      toast({ title: 'Error', description: 'Failed to save book', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this book? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('transmissions').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Book removed', variant: 'success' });
      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({ title: 'Error', description: 'Failed to delete book', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="w-5 h-5 text-emerald-400" />
            <CardTitle>Book Management</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnrichCovers}
              disabled={isEnrichingCovers}
            >
              {isEnrichingCovers ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Image className="w-4 h-4 mr-2" />
              )}
              Enrich Covers
            </Button>
            <Button variant="outline" size="sm" onClick={fetchBooks}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Manage books in your signal library
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Books</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.withCover}</p>
            <p className="text-xs text-muted-foreground">With Covers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.withIsbn}</p>
            <p className="text-xs text-muted-foreground">With ISBN</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">{stats.total - stats.withCover}</p>
            <p className="text-xs text-muted-foreground">Missing Covers</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search books by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Book List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-track-muted/20 scrollbar-thumb-muted-foreground/30 rounded-lg">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border/30 hover:border-emerald-400/30 transition-colors"
              >
                {/* Cover Preview */}
                <div className="w-10 h-14 bg-muted/50 rounded overflow-hidden flex-shrink-0">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Book className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{book.title || 'Untitled'}</p>
                  <p className="text-sm text-muted-foreground truncate">{book.author || 'Unknown Author'}</p>
                  <div className="flex gap-1 mt-1">
                    {book.isbn && <Badge variant="outline" className="text-[10px]">ISBN</Badge>}
                    {book.cover_url && <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">Cover</Badge>}
                    {book.apple_link && <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">Apple</Badge>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(book)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => handleDelete(book.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredBooks.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                No books found matching your search.
              </p>
            )}
          </div>
        )}

        {/* Edit Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Book</DialogTitle>
            </DialogHeader>
            {editingBook && (
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={editingBook.title || ''}
                    onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Author</Label>
                  <Input
                    value={editingBook.author || ''}
                    onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Cover URL</Label>
                  <Input
                    value={editingBook.cover_url || ''}
                    onChange={(e) => setEditingBook({ ...editingBook, cover_url: e.target.value })}
                    placeholder="https://..."
                  />
                  {editingBook.cover_url && (
                    <img src={editingBook.cover_url} alt="" className="mt-2 w-20 h-28 object-cover rounded" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ISBN</Label>
                    <Input
                      value={editingBook.isbn || ''}
                      onChange={(e) => setEditingBook({ ...editingBook, isbn: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Year</Label>
                    <Input
                      type="number"
                      value={editingBook.publication_year || ''}
                      onChange={(e) => setEditingBook({ ...editingBook, publication_year: parseInt(e.target.value) || null })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Apple Books Link</Label>
                  <Input
                    value={editingBook.apple_link || ''}
                    onChange={(e) => setEditingBook({ ...editingBook, apple_link: e.target.value })}
                    placeholder="https://books.apple.com/..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminBooksPanel;
