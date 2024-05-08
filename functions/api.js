const axios = require("axios");
const cache = require("memory-cache");
const { AnimeWallpaper, AnimeSource } = require("anime-wallpaper");

const animeList = [
  "Fullmetal Alchemist",
  "Death Note",
  "Cowboy Bebop",
  "Spirited Away",
  "Melancholy of Haruhi Suzumiya",
  "Neon Genesis Evangelion",
  "Bleach",
  "Code Geass",
  "FLCL",
  "Naruto",
  "Samurai Champloo",
  "Trigun",
  "Gurren Lagann",
  "Howl's Moving Castle",
  "Fullmetal Alchemist: Brotherhood",
  "Clannad",
  "Fruits Basket",
  "Akira",
  "Cowboy Bebop: The Movie",
  "Full Metal Panic? Fumoffu",
  "5 Centimeters Per Second",
  "Rurouni Kenshin",
  "Girl Who Leapt Through Time",
  "Hellsing",
  "Fullmetal Alchemist",
  "Ghost in the Shell",
  "Steins Gate",
  "Darker than Black",
  "Fate/stay night",
  "Claymore",
  "Toradora!",
  "Inuyasha",
  "Neon Genesis Evangelion: The End of Evangelion",
  "My Neighbor Totoro",
  "Grave of the Fireflies",
  "Dragon Ball Z",
  "Berserk",
  "Shakugan no Shana",
  "One Piece",
  "Attack on Titan",
  "Naruto Shippūden",
  "Samurai 7",
  "Soul Eater",
  "Ergo Proxy",
  "Black Lagoon",
  "Gungrave",
  "Dragon Ball",
  "Yu Yu Hakusho",
  "Mobile Suit Gundam Seed",
  "Durarara!!",
];

exports.handler = async (event) => {
  const { httpMethod, path, queryStringParameters } = event;

  if (httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ message: "Preflight check successful" }),
    };
  }

  const segments = path.split("/");
  const operation = segments[2]; // 'wall_paper' or 'v1'.

  try {
    if (operation === "wall_paper") {
      const wallpaper = new AnimeWallpaper();

      // Randomly select an anime title
      const randomIndex = Math.floor(Math.random() * animeList.length);
      const randomAnimeTitle = animeList[randomIndex];
      
      const res = await wallpaper.search(
        { title: randomAnimeTitle },
        AnimeSource.Wallpapers
      );

      // Return data from the external API with CORS headers
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Allow requests from all origins
        },
        body: JSON.stringify(res),
      };
    } else if (operation === "v1") {
      // Handle asynchronous redirection for /api/* route
      const targetUrl = `https://api.mangadex.org${path.substring(7)}?${serializeQueryString(queryStringParameters)}`;

      if (segments[3] !== "chapter") {
        // Check cache
        const cachedData = cache.get(targetUrl);
        if (cachedData) {
          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*", // Allow requests from all origins
            },
            body: JSON.stringify(cachedData.data),
          };
        }
      }

      // Fetch data from redirected URL
      const response = await axios.get(targetUrl);

      if (segments[3] !== "chapter") {
        cache.put(targetUrl, {data: response.data}, 60000);
      }

      // Return data from the external API with CORS headers
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Allow requests from all origins
        },
        body: JSON.stringify(response.data),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid operation" }),
      };
    }
  } catch (error) {
    console.error("Error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

// Function to serialize query parameters
function serializeQueryString(params) {
  return Object.entries(params)
    .map(([key, value]) => {
      if (value.split(", ").length > 1) {
        // For parameters ending with [], ensure each value is separately appended
        return value
          .split(", ")
          .map((val) => `${key}=${val}`)
          .join("&");
      } else {
        // For other parameters, encode key and value and join with equal sign
        return `${key}=${value}`;
      }
    })
    .join("&");
}
