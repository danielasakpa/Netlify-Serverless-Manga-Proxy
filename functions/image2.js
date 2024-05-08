const sharp = require("sharp");
const cache = require("memory-cache");
const axios = require("axios");

export default async (req, context) => {
  const { url } = req;

  const segments = url.split("/");
  const operation = segments[3]; // 'cover', 'chapter', or 'flags'

  try {
    if (operation === "cover" || operation === "chapter") {
      const params =
        operation === "cover"
          ? {
              mangaId: context.params.mangaId,
              coverId: context.params.coverId,
              size: context.params.size,
            }
          : {
              mangaHash: context.params.mangaHash,
              chapterId: context.params.chapterId,
            };

      const targetUrl =
        operation === "cover"
          ? `https://uploads.mangadex.org/covers/${params.mangaId}/${params.coverId}.${params.size}.jpg`
          : `https://cmdxd98sb0x3yprd.mangadex.network/data-saver/${params.mangaHash}/${params.chapterId}`;

      // Check cache for cached image data
      const cachedImageData = await cache.get(targetUrl);
      if (cachedImageData) {
        // Return cached image data if available
        return new Response.json(`data:image/webp;base64,${cachedImageData.data}`, {
          statusCode: 200,
          headers: {
            "content-type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      // Process image and cache the result
      const imageData = await addImageProcessingTask(targetUrl, operation);

      // Return image stream
      return new Response.json(`data:image/webp;base64,${imageData}`, {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } else if (operation === "flags") {
      const { flagCode } = context.params;

      const targetUrl = `https://mangadex.org/img/flags/${flagCode}.svg`;

      // Check cache for cached flag data
      const cachedFlagData = await cache.get(targetUrl);
      if (cachedFlagData) {
        // Return cached flag data if available
        return new Response(cachedFlagData, {
          statusCode: 200,
          headers: {
            "content-type": "image/svg+xml",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      // Process flag image and cache the result
      const flagData = await addFlagImageProcessingTask(targetUrl);

      // Return flag image data
      return new Response(flagData, {
        statusCode: 200,
        headers: {
          "content-type": "image/svg+xml",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } else {
      // Invalid operation
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

// Function to add image processing task to batch
async function addImageProcessingTask(targetUrl, operation) {
  try {
    // Fetch data from external API
    const response = await axios.get(targetUrl, {
      responseType: "stream", // Set responseType to 'stream' to get a readable stream
    });

    let imageStream;

    if (operation === "chapter") {
      // Process the image for chapter without resizing, and compress it as JPEG with specified quality
      imageStream = response.data.pipe(
        sharp().webp({ quality: 100, force: false })
      );
    } else {
      // Process the image for cover by resizing and compressing it as JPEG with specified quality
      imageStream = response.data.pipe(
        sharp().webp({ quality: 65, force: false })
      );
    }

    const chunks = [];

    // Collect all chunks of the stream into an array
    imageStream.on("data", (chunk) => {
      chunks.push(chunk);
    });

    return new Promise((resolve, reject) => {
      imageStream.on("end", () => {
        // Concatenate all chunks into a single buffer
        const buffer = Buffer.concat(chunks);

        // Encode buffer data to base64
        const base64Data = buffer.toString("base64");

        // Cache the base64 encoded data
        cache.put(targetUrl, { data: base64Data }, CACHE_DURATION_IMAGE); // Cache for 5 minutes

        resolve(base64Data); // Return the base64 data
      });

      imageStream.on("error", (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error("Error processing image:", error.message);
    throw error;
  }
}
// Function to add flag image processing task to batch
async function addFlagImageProcessingTask(targetUrl) {
  try {
    // Fetch flag image
    const response = await axios.get(targetUrl);

    // Cache fetched data in memory-cache
    cache.put(targetUrl, response.data, CACHE_DURATION_FLAG); // Cache for 10 minutes

    return response.data;
  } catch (error) {
    console.error("Error processing flag image:", error.message);
  }
}

export const config = {
  path: [
    "/cover/:mangaId/:coverId/:size",
    "/chapter/:mangaHash/:chapterId",
    "/flag/:flagCode",
  ],
};
