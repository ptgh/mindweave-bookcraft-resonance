import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StreamingOption {
  service: {
    id: string;
    name: string;
    homePage: string;
    imageSet: {
      lightThemeImage: string;
      darkThemeImage: string;
    };
  };
  type: "subscription" | "rent" | "buy" | "addon" | "free";
  link: string;
  price?: {
    amount: string;
    currency: string;
    formatted: string;
  };
  quality?: string;
}

interface StreamingResult {
  id: string;
  title: string;
  streamingOptions?: {
    [country: string]: StreamingOption[];
  };
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STREAMING_API_KEY = Deno.env.get("STREAMING_AVAILABILITY_API_KEY");
    
    if (!STREAMING_API_KEY) {
      console.error("STREAMING_AVAILABILITY_API_KEY not configured");
      return json(500, { error: "Streaming API not configured" });
    }

    const { tmdbId, imdbId, title, year, region = "gb" } = await req.json();

    if (!tmdbId && !imdbId && !title) {
      return json(400, { error: "tmdbId, imdbId, or title required" });
    }

    console.log(`Fetching streaming links for: tmdbId=${tmdbId}, imdbId=${imdbId}, title=${title}, year=${year}, region=${region}`);

    let showData: StreamingResult | null = null;

    // Try lookup by TMDB ID first (most reliable)
    if (tmdbId) {
      try {
        const response = await fetch(
          `https://streaming-availability.p.rapidapi.com/shows/movie/${tmdbId}?country=${region}&output_language=en`,
          {
            headers: {
              "X-RapidAPI-Key": STREAMING_API_KEY,
              "X-RapidAPI-Host": "streaming-availability.p.rapidapi.com",
            },
          }
        );
        
        if (response.ok) {
          showData = await response.json();
          console.log(`Found by TMDB ID: ${showData?.title}`);
        } else {
          console.log(`TMDB lookup failed: ${response.status}`);
        }
      } catch (e) {
        console.error("TMDB lookup error:", e);
      }
    }

    // Fallback to IMDB ID
    if (!showData && imdbId) {
      try {
        const response = await fetch(
          `https://streaming-availability.p.rapidapi.com/shows/${imdbId}?country=${region}&output_language=en`,
          {
            headers: {
              "X-RapidAPI-Key": STREAMING_API_KEY,
              "X-RapidAPI-Host": "streaming-availability.p.rapidapi.com",
            },
          }
        );
        
        if (response.ok) {
          showData = await response.json();
          console.log(`Found by IMDB ID: ${showData?.title}`);
        }
      } catch (e) {
        console.error("IMDB lookup error:", e);
      }
    }

    // Fallback to title search
    if (!showData && title) {
      try {
        const searchQuery = year ? `${title}` : title;
        const yearFilter = year ? `&year_min=${year}&year_max=${year}` : "";
        
        const response = await fetch(
          `https://streaming-availability.p.rapidapi.com/shows/search/title?title=${encodeURIComponent(searchQuery)}&country=${region}&show_type=movie${yearFilter}&output_language=en`,
          {
            headers: {
              "X-RapidAPI-Key": STREAMING_API_KEY,
              "X-RapidAPI-Host": "streaming-availability.p.rapidapi.com",
            },
          }
        );
        
        if (response.ok) {
          const results = await response.json();
          if (results && results.length > 0) {
            // Find best match by year if provided
            if (year) {
              showData = results.find((r: { releaseYear?: number }) => r.releaseYear === year) || results[0];
            } else {
              showData = results[0];
            }
            console.log(`Found by title search: ${showData?.title}`);
          }
        }
      } catch (e) {
        console.error("Title search error:", e);
      }
    }

    // Format the response
    if (!showData || !showData.streamingOptions?.[region]) {
      console.log("No streaming data found");
      return json(200, {
        providers: {
          streaming: [],
          rent: [],
          buy: [],
          link: tmdbId 
            ? `https://www.themoviedb.org/movie/${tmdbId}/watch?locale=${region.toUpperCase()}`
            : `https://www.google.com/search?q=watch+${encodeURIComponent(title || "")}+${year || ""}+online`,
        },
        source: "no_data",
      });
    }

    const options = showData.streamingOptions[region];
    
    // Group by type
    const streaming: Array<{
      id: string;
      name: string;
      logo: string;
      deepLink: string;
      quality?: string;
    }> = [];
    const rent: Array<{
      id: string;
      name: string;
      logo: string;
      deepLink: string;
      price?: string;
      quality?: string;
    }> = [];
    const buy: Array<{
      id: string;
      name: string;
      logo: string;
      deepLink: string;
      price?: string;
      quality?: string;
    }> = [];

    // Track unique services per type to avoid duplicates
    const seenStreaming = new Set<string>();
    const seenRent = new Set<string>();
    const seenBuy = new Set<string>();

    for (const option of options) {
      const provider = {
        id: option.service.id,
        name: option.service.name,
        logo: option.service.imageSet?.lightThemeImage || option.service.imageSet?.darkThemeImage || "",
        deepLink: option.link,
        price: option.price?.formatted,
        quality: option.quality,
      };

      if ((option.type === "subscription" || option.type === "free") && !seenStreaming.has(option.service.id)) {
        seenStreaming.add(option.service.id);
        streaming.push(provider);
      } else if (option.type === "rent" && !seenRent.has(option.service.id)) {
        seenRent.add(option.service.id);
        rent.push(provider);
      } else if (option.type === "buy" && !seenBuy.has(option.service.id)) {
        seenBuy.add(option.service.id);
        buy.push(provider);
      }
    }

    console.log(`Found ${streaming.length} streaming, ${rent.length} rent, ${buy.length} buy options`);

    return json(200, {
      providers: {
        streaming,
        rent,
        buy,
        link: `https://www.themoviedb.org/movie/${tmdbId || showData.id}/watch?locale=${region.toUpperCase()}`,
      },
      source: "streaming_availability",
      movieTitle: showData.title,
    });

  } catch (error) {
    console.error("Error in get-streaming-links:", error);
    return json(500, { error: "Failed to fetch streaming links" });
  }
});
