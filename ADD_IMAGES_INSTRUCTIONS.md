# How to Add SNSU Logo and Building Images

## Required Images

You need to add two image files to the `public` folder:

1. **School Logo**: `public/snsu-logo.png`
   - The circular SNSU logo (the one with the torch, sunburst, and university name)
   - Recommended size: 256x256px or larger
   - Format: PNG with transparent background preferred

2. **Building Image**: `public/snsu-building.jpg`
   - The SNSU building architectural rendering
   - Recommended size: 1920x1080px or larger
   - Format: JPG

## Steps to Add Images

1. **Get your images ready:**
   - Make sure you have the SNSU logo saved as a PNG file
   - Make sure you have the building image saved as a PNG or JPG file

2. **Copy the images to the public folder:**
   - Navigate to: `C:\Users\User\Desktop\Qr Scanner\uni-event-log\public\`
   - Copy your logo file and rename it to: `snsu-logo.png`
   - Copy your building file and rename it to: `snsu-building.jpg`

3. **Verify the files are in the right place:**
   - You should have:
     - `public/snsu-logo.png`
     - `public/snsu-building.jpg`

4. **Refresh your browser:**
   - The images should now appear on the login page

## Current Status

The login page code is already configured to use these images:
- Logo: Displays in the white circular container at the top
- Building: Shows as a background overlay with 20% opacity

If the images are missing, the page will show:
- A fallback shield icon instead of the logo
- Just the green gradient background (no building overlay)

## File Structure

```
uni-event-log/
├── public/
│   ├── snsu-logo.png      ← ADD THIS FILE (PNG)
│   ├── snsu-building.jpg  ← ADD THIS FILE (JPG)
│   ├── favicon.ico
│   └── ...
└── src/
    └── pages/
        └── Login.tsx      ← Already configured to use the images
```

