

## Current State Analysis

| Area | Current | Gap |
|------|---------|-----|
| **Authors** (scifi_authors) | 211 total | ~20 notable SF authors missing (e.g., Ted Chiang, Vernor Vinge already exists but others like Samuel Butler, Yevgeny Zamyatin, John Wyndham, Cordwainer Smith missing) |
| **Author Books** (author_books) | 193 books across 97 authors | **114 authors have ZERO books** — including major names like Iain M. Banks, Alastair Reynolds, Harlan Ellison, Jack Vance, Bruce Sterling, Brian Aldiss, Adrian Tchaikovsky, Liu Cixin |
| **Transmissions** (user library) | 88 titles | Many are non-fiction, design books, or anthologies mixed in. ~15-20 canonical SF novels could be added |

The "Available Books — Transmissions ready for signal logging" section is empty for most authors because 114/211 authors have no records in `author_books`. The Google Books API fallback in `useAuthorMatrix` supplements at runtime but results are inconsistent and include non-SF titles (e.g., "Angel Tarot Cards" for A. Roberts).

## Plan

### 1. Bulk-populate author_books for 50+ priority authors (Edge Function)

Enhance the existing `populate-curated-books` edge function pattern to accept a batch of author names, query Google Books API with SF-genre filtering, and insert curated results into `author_books`. This is the same approach used by `populate-publisher-books`.

Priority authors (currently 0 books): Iain M. Banks, Alastair Reynolds, Adrian Tchaikovsky, Liu Cixin, Harlan Ellison, Jack Vance, Bruce Sterling, Brian Aldiss, Octavia Butler, Margaret Atwood, N.K. Jemisin, Becky Chambers, Peter Watts, Greg Bear, Larry Niven, Connie Willis, John Scalzi, James S.A. Corey, Ian McDonald, Clifford D. Simak, Hal Clement, Philip José Farmer, Andre Norton, A.E. van Vogt, Kobo Abe, Joanna Russ, James Tiptree Jr., Pat Cadigan, Rudy Rucker, Sheri S. Tepper, and more.

**New edge function: `populate-author-books`**
- Accepts `{ authorNames: string[], booksPerAuthor: number }` 
- For each author: looks up `scifi_authors` ID, queries Google Books API for `inauthor:"Name" subject:fiction`, filters to SF-relevant titles, deduplicates by title, inserts into `author_books`
- Skips authors who already have books (prevents duplicates)
- Uses `GOOGLE_BOOKS_API_KEY` (already configured) for higher rate limits

### 2. Add ~15 missing canonical SF authors (Migration)

Insert into `scifi_authors`:
- Ted Chiang, John Wyndham, Cordwainer Smith, Yevgeny Zamyatin, Samuel Butler, Karin Tidbeck, Annalee Newitz, Christopher Priest, Doris Lessing, Mervyn Peake, Walter M. Miller Jr., James White, Clifford Simak (check dedup with existing "Clifford D. Simak"), Bob Shaw, John Christopher

### 3. Add ~25 quality SF transmissions (Migration)

Add canonical titles the logged-in user doesn't have yet, with protagonists pre-assigned:

- *The Left Hand of Darkness* — Ursula K. Le Guin (Genly Ai)
- *The Dispossessed* — Ursula K. Le Guin (Shevek)  
- *Neuromancer* already exists; add *Count Zero* — William Gibson (Bobby Newmark)
- *Consider Phlebas* — Iain M. Banks (Bora Horza Gobuchul)
- *Use of Weapons* — Iain M. Banks (Cheradenine Zakalwe)
- *Revelation Space* — Alastair Reynolds (Dan Sylveste)
- *The Three-Body Problem* — Liu Cixin (Ye Wenjie)
- *Blindsight* — Peter Watts (Siri Keeton)
- *Rendezvous with Rama* — Arthur C. Clarke (Commander Norton)
- *The Stars My Destination* — Alfred Bester (Gully Foyle)
- *Ringworld* — Larry Niven (Louis Wu)
- *Gateway* — Frederik Pohl (Robinette Broadhead)
- *Solaris* — Stanislaw Lem (Kris Kelvin)
- *A Canticle for Leibowitz* — Walter M. Miller Jr. (Brother Francis)
- *The Book of the New Sun* — Gene Wolfe (Severian)
- *Parable of the Sower* — Octavia Butler (Lauren Olamina)
- *Children of Time* — Adrian Tchaikovsky (Holsten Mason)
- *Old Man's War* — John Scalzi (John Perry)
- *Altered Carbon* — Richard K. Morgan (Takeshi Kovacs)
- *The Fifth Season* — N.K. Jemisin (Essun)
- *Leviathan Wakes* — James S.A. Corey (Jim Holden)
- *Station Eleven* — Emily St. John Mandel (Kirsten Raymonde)
- *The Handmaid's Tale* — Margaret Atwood (Offred)
- *We* — Yevgeny Zamyatin (D-503)
- *The Day of the Triffids* — John Wyndham (Bill Masen)

### 4. Admin "Populate Author Books" batch tool (UI)

Add a button to the Admin Enrichment panel that triggers `populate-author-books` for all authors with 0 books, processing in batches of 5 to respect API rate limits. Progress indicator shows completion.

### Technical Details

```text
populate-author-books (new edge function)
├── Input: { authorNames?: string[], booksPerAuthor?: number, fillEmpty?: boolean }
├── If fillEmpty=true: query scifi_authors LEFT JOIN author_books WHERE count=0
├── For each author:
│   ├── Google Books API: inauthor:"name" + subject:science+fiction
│   ├── Filter: exclude non-fiction, self-help, duplicates
│   ├── Map to author_books schema
│   └── Upsert with ON CONFLICT (author_id, google_books_id)
└── Return: { processed: N, books_added: N, skipped: N }
```

### Deduplication Strategy
- `author_books`: deduplicate by `(author_id, title)` case-insensitive before insert
- `transmissions`: the existing `saveTransmission` already checks `(user_id, title, author)` 
- `scifi_authors`: check by normalized name before insert
- Merge "A. Roberts" / "Adam Roberts" duplicates, "Octavia Butler" / "Octavia E. Butler", "Arkady Strugatsky" / "Arkady And Boris Strugatsky"

### Expected Outcome
- Authors: 211 → ~225
- Author Books: 193 → ~700+ (filling the 114 empty authors)
- Transmissions: 88 → ~113 (quality SF canon)
- Every author card click shows real books immediately from the database, not relying on inconsistent Google Books API runtime calls

