-- Enable realtime for scifi_authors table
ALTER TABLE public.scifi_authors REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scifi_authors;