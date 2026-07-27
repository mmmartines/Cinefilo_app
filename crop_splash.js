const Jimp = require('jimp');

async function processSplash() {
  try {
    const img = await Jimp.read('E:/Portifolio/Cinefilo/app/assets/splash.png');
    const width = img.bitmap.width;
    const height = img.bitmap.height;
    console.log(`Original Dimensions: ${width}x${height}`);

    // Android 12 limits the splash icon to the center. 
    // Usually a 288x288 or 512x512 square from the absolute center is perfect if the image is full screen.
    const cropSize = Math.min(width, height, 1024); // Crop a 1024x1024 or smaller square from the center
    const x = (width - cropSize) / 2;
    const y = (height - cropSize) / 2;

    img.crop(x, y, cropSize, cropSize);
    
    // Save as proper PNG
    await img.writeAsync('E:/Portifolio/Cinefilo/app/assets/splash_cropped.png');
    console.log('Splash successfully cropped to center square.');
  } catch (err) {
    console.error('Error processing image:', err);
  }
}

processSplash();
