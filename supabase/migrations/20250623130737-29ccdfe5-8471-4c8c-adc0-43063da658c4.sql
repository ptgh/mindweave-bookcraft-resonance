
-- First create the scifi_authors and author_books tables if they don't exist
CREATE TABLE IF NOT EXISTS public.scifi_authors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  wikipedia_url TEXT,
  bio TEXT,
  birth_year INTEGER,
  death_year INTEGER,
  nationality TEXT,
  notable_works TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.author_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.scifi_authors(id) ON DELETE CASCADE,
  google_books_id TEXT,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  published_date TEXT,
  page_count INTEGER,
  categories TEXT[],
  cover_url TEXT,
  preview_link TEXT,
  info_link TEXT,
  rating DECIMAL(2,1),
  ratings_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scifi_authors_name ON public.scifi_authors(name);
CREATE INDEX IF NOT EXISTS idx_author_books_author_id ON public.author_books(author_id);
CREATE INDEX IF NOT EXISTS idx_author_books_title ON public.author_books(title);

-- Enable RLS
ALTER TABLE public.scifi_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_books ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
DROP POLICY IF EXISTS "Allow public read access to scifi_authors" ON public.scifi_authors;
DROP POLICY IF EXISTS "Allow public read access to author_books" ON public.author_books;

CREATE POLICY "Allow public read access to scifi_authors" 
  ON public.scifi_authors 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to author_books" 
  ON public.author_books 
  FOR SELECT 
  USING (true);

-- Now insert the comprehensive sci-fi authors list
INSERT INTO public.scifi_authors (name, nationality, notable_works) VALUES
-- Previously added authors (check if exists first)
('Isaac Asimov', 'American', ARRAY['Foundation', 'I, Robot', 'The Caves of Steel']),
('Arthur C. Clarke', 'British', ARRAY['2001: A Space Odyssey', 'Childhood''s End', 'Rendezvous with Rama']),
('Philip K. Dick', 'American', ARRAY['Do Androids Dream of Electric Sheep?', 'The Man in the High Castle', 'Minority Report']),
('Robert A. Heinlein', 'American', ARRAY['Stranger in a Strange Land', 'Starship Troopers', 'The Moon Is a Harsh Mistress']),
('Ursula K. Le Guin', 'American', ARRAY['The Left Hand of Darkness', 'The Dispossessed', 'A Wizard of Earthsea']),
('Frank Herbert', 'American', ARRAY['Dune', 'Dune Messiah', 'Children of Dune']),
('Ray Bradbury', 'American', ARRAY['Fahrenheit 451', 'The Martian Chronicles', 'Dandelion Wine']),
('H.G. Wells', 'British', ARRAY['The Time Machine', 'The War of the Worlds', 'The Invisible Man']),
('Jules Verne', 'French', ARRAY['Twenty Thousand Leagues Under the Sea', 'Journey to the Center of the Earth', 'Around the World in Eighty Days']),
('William Gibson', 'American', ARRAY['Neuromancer', 'Count Zero', 'Mona Lisa Overdrive']),

-- New comprehensive additions
('Edgar Rice Burroughs', 'American', ARRAY['A Princess of Mars', 'Tarzan of the Apes', 'The Land That Time Forgot']),
('Olaf Stapledon', 'British', ARRAY['Last and First Men', 'Star Maker', 'Odd John']),
('John W. Campbell Jr.', 'American', ARRAY['Who Goes There?', 'Islands of Space', 'The Mightiest Machine']),
('Robert E. Howard', 'American', ARRAY['Conan the Barbarian', 'The Shadow Kingdom', 'Red Nails']),
('Clark Ashton Smith', 'American', ARRAY['The City of the Singing Flame', 'The Dark Eidolon', 'Zothique']),
('Jack Williamson', 'American', ARRAY['The Humanoids', 'The Legion of Space', 'Darker Than You Think']),
('Edmond Hamilton', 'American', ARRAY['Captain Future', 'The Star Kings', 'City at World''s End']),
('Murray Leinster', 'American', ARRAY['First Contact', 'The Logic Named Joe', 'A Logic Named Joe']),
('Theodore Sturgeon', 'American', ARRAY['More Than Human', 'The Dreaming Jewels', 'Venus Plus X']),
('Clifford D. Simak', 'American', ARRAY['City', 'Way Station', 'The Goblin Reservation']),
('Frederik Pohl', 'American', ARRAY['Gateway', 'The Space Merchants', 'Man Plus']),
('Cyril M. Kornbluth', 'American', ARRAY['The Marching Morons', 'The Little Black Bag', 'Godfather Death']),
('Alfred Bester', 'American', ARRAY['The Stars My Destination', 'The Demolished Man', 'The Computer Connection']),
('James Blish', 'American', ARRAY['Cities in Flight', 'A Case of Conscience', 'The Seedling Stars']),
('Hal Clement', 'American', ARRAY['Mission of Gravity', 'Needle', 'Close to Critical']),
('Poul Anderson', 'American', ARRAY['Tau Zero', 'The High Crusade', 'Brain Wave']),
('Gordon R. Dickson', 'Canadian', ARRAY['Dorsai!', 'The Dragon and the George', 'Soldier, Ask Not']),
('Jack Vance', 'American', ARRAY['The Dying Earth', 'The Dragon Masters', 'The Demon Princes']),
('J.G. Ballard', 'British', ARRAY['Crash', 'The Drowned World', 'High-Rise']),
('Brian Aldiss', 'British', ARRAY['Hothouse', 'The Long Afternoon of Earth', 'Greybeard']),
('Michael Moorcock', 'British', ARRAY['Elric of Melniboné', 'The Eternal Champion', 'Jerry Cornelius']),
('Philip José Farmer', 'American', ARRAY['To Your Scattered Bodies Go', 'The Lovers', 'Dare']),
('Harlan Ellison', 'American', ARRAY['I Have No Mouth, and I Must Scream', 'A Boy and His Dog', 'The Beast That Shouted Love']),
('Samuel R. Delany', 'American', ARRAY['Dhalgren', 'Nova', 'The Einstein Intersection']),
('Thomas M. Disch', 'American', ARRAY['Camp Concentration', '334', 'The Genocides']),
('John Brunner', 'British', ARRAY['Stand on Zanzibar', 'The Shockwave Rider', 'The Sheep Look Up']),
('Barry N. Malzberg', 'American', ARRAY['Beyond Apollo', 'Herovit''s World', 'The Remaking of Sigmund Freud']),
('Bruce Sterling', 'American', ARRAY['Schismatrix', 'Islands in the Net', 'The Difference Engine']),
('Rudy Rucker', 'American', ARRAY['Software', 'Wetware', 'The Hacker and the Ants']),
('Pat Cadigan', 'American', ARRAY['Synners', 'Mindplayers', 'Fools']),
('Lewis Shiner', 'American', ARRAY['Frontera', 'Deserted Cities of the Heart', 'Glimpses']),
('John Shirley', 'American', ARRAY['City Come A-Walkin''', 'Eclipse', 'A Song Called Youth']),
('Ben Bova', 'American', ARRAY['Mars', 'Moonrise', 'The Kinsman Saga']),
('Gregory Benford', 'American', ARRAY['Timescape', 'In the Ocean of Night', 'Against Infinity']),
('David Weber', 'American', ARRAY['On Basilisk Station', 'Honor Harrington', 'Mutineers'' Moon']),
('Timothy Zahn', 'American', ARRAY['Heir to the Empire', 'The Thrawn Trilogy', 'Cobra']),
('Mike Resnick', 'American', ARRAY['Kirinyaga', 'Santiago', 'The Widowmaker']),
('Robert Charles Wilson', 'Canadian', ARRAY['Spin', 'The Chronoliths', 'Blind Lake']),
('Peter Watts', 'Canadian', ARRAY['Blindsight', 'Starfish', 'Echopraxia']),
('Richard K. Morgan', 'British', ARRAY['Altered Carbon', 'Market Forces', 'The Steel Remains']),
('Ian McDonald', 'British', ARRAY['River of Gods', 'The Dervish House', 'Luna: New Moon']),
('Justina Robson', 'British', ARRAY['Silver Screen', 'Mappa Mundi', 'Natural History']),
('Ken MacLeod', 'Scottish', ARRAY['The Star Fraction', 'The Stone Canal', 'The Cassini Division']),
('Gwyneth Jones', 'British', ARRAY['Divine Endurance', 'White Queen', 'North Wind']),
('Mary Gentle', 'British', ARRAY['Golden Witchbreed', 'Ancient Light', 'Ash: A Secret History']),
('Stephen Baxter', 'British', ARRAY['Timelike Infinity', 'Ring', 'The Time Ships']),
('Arkady Strugatsky', 'Russian', ARRAY['Roadside Picnic', 'Hard to Be a God', 'The Inhabited Island']),
('Boris Strugatsky', 'Russian', ARRAY['Roadside Picnic', 'Hard to Be a God', 'The Inhabited Island']),
('Stanisław Lem', 'Polish', ARRAY['Solaris', 'The Cyberiad', 'His Master''s Voice']),
('Dmitri Glukhovsky', 'Russian', ARRAY['Metro 2033', 'Metro 2034', 'Metro 2035']),
('Sergey Lukyanenko', 'Russian', ARRAY['Night Watch', 'Day Watch', 'Twilight Watch']),
('José Saramago', 'Portuguese', ARRAY['Blindness', 'The Cave', 'Death with Interruptions']),
('Michel Houellebecq', 'French', ARRAY['Atomised', 'The Possibility of an Island', 'Submission']),
('Kobo Abe', 'Japanese', ARRAY['The Woman in the Dunes', 'The Face of Another', 'Secret Rendezvous']),
('Haruki Murakami', 'Japanese', ARRAY['Hard-Boiled Wonderland', 'The Wind-Up Bird Chronicle', '1Q84']),
('Yasutaka Tsutsui', 'Japanese', ARRAY['The Girl Who Leapt Through Time', 'Paprika', 'Hell']),
('Liu Cixin', 'Chinese', ARRAY['The Three-Body Problem', 'The Dark Forest', 'Death''s End']),
('Chen Qiufan', 'Chinese', ARRAY['The Waste Tide', 'The Fish of Lijiang', 'The Year of the Rat']),
('Hao Jingfang', 'Chinese', ARRAY['Folding Beijing', 'Vagabonds', 'Born in 1984']),
('Wang Jinkang', 'Chinese', ARRAY['Ant Life', 'Gene Pirates', 'The Seven Shells']),
('Andre Norton', 'American', ARRAY['Witch World', 'The Time Traders', 'Star Man''s Son']),
('C.L. Moore', 'American', ARRAY['Northwest Smith', 'Jirel of Joiry', 'Shambleau']),
('Leigh Brackett', 'American', ARRAY['The Sword of Rhiannon', 'The Nemesis from Terra', 'Queen of the Martian Catacombs']),
('Zenna Henderson', 'American', ARRAY['Pilgrimage: The Book of the People', 'The People: No Different Flesh', 'The Anything Box']),
('James Tiptree Jr.', 'American', ARRAY['The Women Men Don''t See', 'Houston, Houston, Do You Read?', 'Her Smoke Rose Up Forever']),
('Joanna Russ', 'American', ARRAY['The Female Man', 'And Chaos Died', 'We Who Are About To...']),
('Vonda N. McIntyre', 'American', ARRAY['Dreamsnake', 'The Exile Waiting', 'Star Trek: The Wrath of Khan']),
('Joan D. Vinge', 'American', ARRAY['The Snow Queen', 'The Summer Queen', 'The Outcasts of Heaven Belt']),
('Kate Wilhelm', 'American', ARRAY['Where Late the Sweet Birds Sang', 'The Infinity Box', 'The Clewiston Test']),
('Suzette Haden Elgin', 'American', ARRAY['Native Tongue', 'The Judas Rose', 'Earthsong']),
('Sheri S. Tepper', 'American', ARRAY['Grass', 'The Gate to Women''s Country', 'Beauty']),
('Nancy Kress', 'American', ARRAY['Beggars in Spain', 'Brain Rose', 'An Alien Light']),
('Lisa Tuttle', 'American', ARRAY['Windhaven', 'Lost Futures', 'The Pillow Friend']),
('Pat Murphy', 'American', ARRAY['The Falling Woman', 'The Shadow Hunter', 'There and Back Again']),
('Karen Joy Fowler', 'American', ARRAY['Sarah Canary', 'The Jane Austen Book Club', 'We Are All Completely Beside Ourselves']),
('Margaret Atwood', 'Canadian', ARRAY['The Handmaid''s Tale', 'Oryx and Crake', 'The Testaments']),
('Octavia Butler', 'American', ARRAY['Kindred', 'Parable of the Sower', 'Dawn']),
('Nnedi Okorafor', 'Nigerian-American', ARRAY['Who Fears Death', 'Binti', 'The Fifth Season']),
('Nalo Hopkinson', 'Jamaican-Canadian', ARRAY['Brown Girl in the Ring', 'Midnight Robber', 'The Salt Roads']),
('Tobias S. Buckell', 'Caribbean-American', ARRAY['Crystal Rain', 'Ragamuffin', 'Sly Mongoose']),
('Vandana Singh', 'Indian-American', ARRAY['Of Love and Other Monsters', 'The Woman Who Thought She Was a Planet', 'Ambiguity Machines']),
('Aliette de Bodard', 'French-Vietnamese', ARRAY['The House of Shattered Wings', 'On a Red Station, Drifting', 'The Tea Master and the Detective']),
('Silvia Moreno-Garcia', 'Mexican-Canadian', ARRAY['Mexican Gothic', 'Gods of Jade and Shadow', 'Signal to Noise']),
('Rebecca Roanhorse', 'Native American', ARRAY['Trail of Lightning', 'Storm of Locusts', 'Star Wars: Resistance Reborn']),
('Rivers Solomon', 'American', ARRAY['An Unkindness of Magicians', 'The Deep', 'Sorrowland']),
('Andy Weir', 'American', ARRAY['The Martian', 'Artemis', 'Project Hail Mary']),
('Martha Wells', 'American', ARRAY['The Murderbot Diaries', 'The Books of the Raksura', 'Network Effect']),
('Becky Chambers', 'American', ARRAY['A Closed and Common Orbit', 'The Long Way to a Small, Angry Planet', 'Record of a Spaceborn Few']),
('N.K. Jemisin', 'American', ARRAY['The Fifth Season', 'The Obelisk Gate', 'The Stone Sky']),
('James S.A. Corey', 'American', ARRAY['Leviathan Wakes', 'Caliban''s War', 'Abaddon''s Gate']),
('Alastair Reynolds', 'British', ARRAY['Revelation Space', 'Chasm City', 'Redemption Ark']),
('Iain M. Banks', 'Scottish', ARRAY['Consider Phlebas', 'The Player of Games', 'Use of Weapons']),
('Mary Robinette Kowal', 'American', ARRAY['The Calculating Stars', 'The Fated Sky', 'The Relentless Moon']),
('Kurt Vonnegut', 'American', ARRAY['Slaughterhouse-Five', 'Cat''s Cradle', 'The Sirens of Titan']),
('George Orwell', 'British', ARRAY['1984', 'Animal Farm', 'Homage to Catalonia']),
('Aldous Huxley', 'British', ARRAY['Brave New World', 'Island', 'Ape and Essence']),
('Mary Shelley', 'British', ARRAY['Frankenstein', 'The Last Man', 'Mathilda']),
('E.E. "Doc" Smith', 'American', ARRAY['The Skylark of Space', 'Galactic Patrol', 'First Lensman']),
('A.E. van Vogt', 'Canadian', ARRAY['Slan', 'The Weapon Shops of Isher', 'The World of Null-A'])

ON CONFLICT (name) DO NOTHING;
