# Manga Website Proxy Server

This repository contains code for a proxy server implemented using Node.js and Express.js to serve manga images and other resources for a manga website. The server utilizes serverless functions on Netlify to handle requests efficiently. The README explains the problem faced during development and how it was solved.

## Functionality

The proxy server serves multiple functions to facilitate the manga website:

1. **Manga Image Proxy**: Fetches manga cover images and chapter images from an external API, processes them using the `sharp` module for resizing and compression, and serves them to the frontend. Images are fetched as streams to optimize processing time and reduce serverless function execution time.

2. **Flag Image Proxy**: Retrieves flag images for manga metadata from an external source and serves them to the frontend. Cached flag data is utilized to minimize repetitive fetching and improve performance.

3. **Anime Wallpaper Generator**: Generates random anime wallpapers by querying an external API with a list of predefined anime titles. The retrieved wallpapers are returned to the frontend for display.

4. **API Data Proxy**: Handles redirection for API requests to an external manga API. It forwards requests to the external API, caches the responses, and serves the data to the frontend. Cached data is utilized to reduce external API calls and improve response times.

## Problem Statement

The goal was to create a manga website that displays images fetched from an external API. However, the API providers disallowed direct hotlinking of images, necessitating the implementation of a proxy server. Several challenges were encountered during development:

1. **Cold Start Time**: Initially, a proxy server was set up using Node.js and Express.js hosted on Render. However, the free tier of Render had a cold start time of about 20 seconds, resulting in a significant delay before responding to user requests.

2. **Image Processing Performance**: To optimize image loading and ensure faster rendering on the client side, images needed to be resized and compressed. The `sharp` module in Node.js was employed for high-performance image processing. However, processing large images caused serverless functions on Netlify to exceed their execution time limit of 10 seconds, resulting in timeouts.

## Solution

To address the aforementioned challenges, the following solutions were implemented:

1. **Netlify Serverless Functions**: Netlify's serverless functions were chosen as they provided a more efficient and scalable solution compared to the previous hosting provider. Although initial attempts faced timeout issues due to image processing overhead, serverless functions offered a more flexible architecture.

2. **Stream Processing**: To optimize image processing within the serverless function's execution time limit, images were fetched as streams rather than buffers. This allowed for concurrent processing of image data, significantly reducing the processing time. The processed image data was then converted to a buffer and encoded to base64 before being sent to the frontend.

3. **Caching**: To improve performance and reduce the load on the external API, a caching mechanism was implemented using `memory-cache`. Processed image data and other resources were cached for a certain duration to minimize repetitive processing and data fetching.

## Code Overview

The code consists of a serverless functions on Netlify. It handles various operations such as fetching manga cover images, chapter images, flag images, and generating anime wallpapers. The `sharp` module is used for image processing, and `axios` is used for making HTTP requests to the external API. Caching is implemented using `memory-cache` to improve performance and reduce response times.

Certainly! Here's the updated usage section with instructions for different operating systems:

## Usage

1. Clone the repository: `git clone <repository-url>`
2. Install dependencies: `npm install`

### For Windows:

3. Install Sharp: `npm i sharp@0.32.6`

### For Linux:

3. Install Sharp: `npm uninstall sharp & npm install --include=optional --arch=x64 --platform=linux sharp@0.32.6`

4. Run the server: `npm run start`
5. Access the serverless functions to fetch manga images, resources, and generate anime wallpapers.

## Deployment

### Deploying on Netlify:

1. If you haven't already, install Sharp for deployment on Netlify: 
   ```
   npm install --include=optional --arch=x64 --platform=linux sharp@0.32.6
   ```
2. Ensure you have a Netlify account and the Netlify CLI installed.
3. Navigate to the project directory.
4. Run `netlify login` to authenticate with your Netlify account.
5. Run `netlify init` to initialize your project on Netlify.
6. Follow the prompts to link your repository and set up the deployment settings.
7. Once configured, run `npm run build` to deploy your project to Netlify.

Now your manga website proxy server should be up and running on Netlify!

Certainly! Here's the Contribution section added to the README:

## Contribution

Contributions are welcome and encouraged! Here's how you can contribute to the project:

1. Fork the repository.
2. Create a new branch for your feature or bug fix: `git checkout -b feature-name`.
3. Make your changes and commit them: `git commit -m 'Add new feature'`.
4. Push to the branch: `git push origin feature-name`.
5. Submit a pull request detailing your changes.

Please ensure that your code follows the project's coding conventions and standards. Additionally, include relevant tests and documentation for new features or changes.

Your contributions help improve the project and make it better for everyone. Thank you for contributing!

## Conclusion

By leveraging Netlify serverless functions, optimizing image processing, and implementing caching mechanisms, the proxy server effectively addresses the challenges posed by the API restrictions and serverless function execution limits. The resulting solution provides a scalable and efficient platform for serving manga content while ensuring a smooth user experience.

