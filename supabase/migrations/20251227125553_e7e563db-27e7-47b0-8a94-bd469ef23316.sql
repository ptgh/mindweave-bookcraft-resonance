-- Update films that are original screenplays (not based on books)
UPDATE sf_film_adaptations SET adaptation_type = 'original' WHERE id IN (
  'd3f1cd6c-49b5-4ebb-b749-bf4f13e8af2b', -- Silent Running
  '267113ad-ed3e-400d-b961-2d88213b86d8', -- High Life
  '528f969a-dfbd-422a-a735-cb74b277fbb0', -- Crimes of the Future
  'c9da712f-073d-41af-b48f-a662824a1e1b', -- La Jetée
  '559d0ade-277f-4f3e-8ece-36b8a86412a8', -- Brazil
  'fd782bf8-a326-4018-a08f-d91de2710e35', -- Outland
  '00b42b3c-b62b-4f68-8b60-7f84fb145673', -- Vinyan
  'd9c76066-3afd-469f-9784-1479dc2e22d8', -- Alphaville
  'd6d7afdd-fcc7-4587-93f9-beb3a2103c68', -- Gattaca
  'dfa37fa9-2d16-40dc-9e77-4a3885e43676', -- Andrei Rublev
  '956dab29-51fd-4773-88d3-119cbad9ecab', -- Scanners
  '44a12529-7d81-42d2-9791-f2353cfdf6d7', -- Dark City
  '7f4316ee-8b30-495c-9c5f-a87feb87c6c0', -- Eraserhead
  '8d055998-8883-4fe4-adf0-eaa30d54843a'  -- Videodrome
);