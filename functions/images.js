const sharp = require("sharp");
const cache = require("memory-cache");
const axios = require("axios");

// Cache duration constants
const CACHE_DURATION_IMAGE = 300000; // 5 minutes
const CACHE_DURATION_FLAG = 600000; // 10 minutes

exports.handler = async (event) => {
  const { httpMethod, path } = event;

  // Handle preflight OPTIONS request
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
  const operation = segments[2]; // 'cover', 'chapter', or 'flags'

  try {
    if (operation === "cover" || operation === "chapter") {
      // Construct target URL for images and chapters
      const targetUrl =
        operation === "cover"
          ? `https://uploads.mangadex.org/covers/${segments[3]}/${segments[4]}.${segments[5]}.jpg`
          : `https://cmdxd98sb0x3yprd.mangadex.network/data-saver/${segments[3]}/${segments[4]}`;

      // Check cache for cached image data
      const cachedImageData = await cache.get(targetUrl);
      if (cachedImageData) {
        // Return cached image data if available
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: `data:image/webp;base64,${cachedImageData.data}`,
        };
      }

      // Process image and cache the result
      const imageData = await addImageProcessingTask(targetUrl, operation);

      // Return image stream
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: `data:image/webp;base64,${imageData}`,
      };
    } else if (operation === "flags") {
      // Handle 'flags' operation for fetching flag images
      const flagCode = segments[3].toLowerCase(); // Convert flag code to lowercase
      const targetUrl = `https://mangadex.org/img/flags/${flagCode}.svg`;

      // Check cache for cached flag data
      const cachedFlagData = await cache.get(targetUrl);
      if (cachedFlagData) {
        // Return cached flag data if available
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "image/svg+xml", // Set content type to SVG image
            "Access-Control-Allow-Origin": "*", // Allow requests from all origins
          },
          body: cachedFlagData,
          isBase64Encoded: false, // Set to false to indicate raw binary data
        };
      }

      // Process flag image and cache the result
      const flagData = await addFlagImageProcessingTask(targetUrl);

      // Return flag image data
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "image/svg+xml", // Set content type to SVG image
          "Access-Control-Allow-Origin": "*", // Allow requests from all origins
        },
        body: flagData,
        isBase64Encoded: false, // Set to false to indicate raw binary data
      };
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
