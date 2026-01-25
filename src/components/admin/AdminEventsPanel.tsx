import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Calendar, MapPin, ExternalLink, Save, X, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface SciFiEvent {
  id: string;
  name: string;
  event_type: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  time: string | null;
  venue: string | null;
  city: string;
  country: string;
  website_url: string | null;
  ticket_url: string | null;
  featured_authors: string[] | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const emptyEvent: Partial<SciFiEvent> = {
  name: '',
  event_type: 'convention',
  description: '',
  start_date: '',
  end_date: '',
  time: '',
  venue: '',
  city: '',
  country: 'UK',
  website_url: '',
  ticket_url: '',
  featured_authors: [],
  is_recurring: false,
  recurrence_pattern: '',
  is_active: true,
};

const eventTypes = [
  { value: 'convention', label: 'Convention' },
  { value: 'festival', label: 'Festival' },
  { value: 'reading', label: 'Reading Group' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'booklaunch', label: 'Book Launch' },
];

export const AdminEventsPanel: React.FC = () => {
  const [events, setEvents] = useState<SciFiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Partial<SciFiEvent> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authorsInput, setAuthorsInput] = useState('');
  const { toast } = useToast();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scifi_events')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEdit = (event: SciFiEvent) => {
    setEditingEvent(event);
    setAuthorsInput(event.featured_authors?.join(', ') || '');
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingEvent({ ...emptyEvent });
    setAuthorsInput('');
    setIsCreating(true);
  };

  const handleCancel = () => {
    setEditingEvent(null);
    setIsCreating(false);
    setAuthorsInput('');
  };

  const handleSave = async () => {
    if (!editingEvent?.name || !editingEvent?.start_date || !editingEvent?.city) {
      toast({
        title: 'Validation Error',
        description: 'Name, start date, and city are required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const eventData = {
        name: editingEvent.name!,
        event_type: editingEvent.event_type || 'convention',
        start_date: editingEvent.start_date!,
        city: editingEvent.city!,
        country: editingEvent.country || 'UK',
        featured_authors: authorsInput.split(',').map(a => a.trim()).filter(Boolean),
        end_date: editingEvent.end_date || null,
        time: editingEvent.time || null,
        venue: editingEvent.venue || null,
        website_url: editingEvent.website_url || null,
        ticket_url: editingEvent.ticket_url || null,
        description: editingEvent.description || null,
        recurrence_pattern: editingEvent.recurrence_pattern || null,
        is_recurring: editingEvent.is_recurring || false,
        is_active: editingEvent.is_active !== false,
      };

      if (isCreating) {
        const { error } = await supabase
          .from('scifi_events')
          .insert(eventData);

        if (error) throw error;
        toast({ title: 'Success', description: 'Event created' });
      } else {
        const { error } = await supabase
          .from('scifi_events')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Event updated' });
      }

      handleCancel();
      fetchEvents();
    } catch (err) {
      console.error('Error saving event:', err);
      toast({
        title: 'Error',
        description: 'Failed to save event',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('scifi_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Deleted', description: 'Event removed' });
      fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (event: SciFiEvent) => {
    try {
      const { error } = await supabase
        .from('scifi_events')
        .update({ is_active: !event.is_active })
        .eq('id', event.id);

      if (error) throw error;
      toast({ 
        title: event.is_active ? 'Deactivated' : 'Activated', 
        description: `Event ${event.is_active ? 'hidden from' : 'shown on'} public view` 
      });
      fetchEvents();
    } catch (err) {
      console.error('Error toggling event:', err);
    }
  };

  const upcomingCount = events.filter(e => new Date(e.start_date) >= new Date() && e.is_active).length;
  const pastCount = events.filter(e => new Date(e.start_date) < new Date()).length;

  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg text-slate-200">Sci-Fi Events Management</CardTitle>
          <p className="text-sm text-slate-400 mt-1">
            {upcomingCount} upcoming • {pastCount} past • {events.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Edit/Create Form */}
        {editingEvent && (
          <Card className="mb-6 bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-base">
                {isCreating ? 'Create New Event' : 'Edit Event'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Name *</Label>
                  <Input
                    value={editingEvent.name || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                    placeholder="Cymera Festival 2025"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select
                    value={editingEvent.event_type || 'convention'}
                    onValueChange={(v) => setEditingEvent({ ...editingEvent, event_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={editingEvent.start_date || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={editingEvent.end_date || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, end_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    value={editingEvent.time || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                    placeholder="10:00 - 18:00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Input
                    value={editingEvent.venue || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, venue: e.target.value })}
                    placeholder="Convention Centre"
                  />
                </div>
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input
                    value={editingEvent.city || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, city: e.target.value })}
                    placeholder="Edinburgh"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={editingEvent.country || 'UK'}
                    onChange={(e) => setEditingEvent({ ...editingEvent, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Website URL</Label>
                  <Input
                    type="url"
                    value={editingEvent.website_url || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, website_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ticket URL</Label>
                  <Input
                    type="url"
                    value={editingEvent.ticket_url || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, ticket_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingEvent.description || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  placeholder="Event description..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Featured Authors (comma-separated)</Label>
                <Input
                  value={authorsInput}
                  onChange={(e) => setAuthorsInput(e.target.value)}
                  placeholder="Author Name, Another Author"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingEvent.is_recurring || false}
                    onCheckedChange={(v) => setEditingEvent({ ...editingEvent, is_recurring: v })}
                  />
                  <Label>Recurring Event</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingEvent.is_active !== false}
                    onCheckedChange={(v) => setEditingEvent({ ...editingEvent, is_active: v })}
                  />
                  <Label>Active (visible to public)</Label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Event'}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Events List */}
        <div className="max-h-[500px] overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No events found. Add your first event!</div>
          ) : (
            events.map((event) => {
              const isPast = new Date(event.start_date) < new Date();
              return (
                <div
                  key={event.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isPast 
                      ? 'bg-slate-800/30 border-slate-700/50 opacity-60' 
                      : 'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-200 truncate">{event.name}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {eventTypes.find(t => t.value === event.event_type)?.label || event.event_type}
                      </Badge>
                      {!event.is_active && (
                        <Badge variant="secondary" className="text-xs shrink-0">Hidden</Badge>
                      )}
                      {isPast && (
                        <Badge variant="secondary" className="text-xs shrink-0">Past</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(event.start_date), 'd MMM yyyy')}
                        {event.end_date && ` - ${format(parseISO(event.end_date), 'd MMM yyyy')}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.city}, {event.country}
                      </span>
                      {event.website_url && (
                        <a 
                          href={event.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(event)}
                      title={event.is_active ? 'Hide from public' : 'Show to public'}
                    >
                      {event.is_active ? 'Hide' : 'Show'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(event)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(event.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
