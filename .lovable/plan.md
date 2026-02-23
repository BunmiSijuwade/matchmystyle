

# Swap Hero Background Image

## Note on Licensing
The selected image is from **Unsplash+** (premium/paid). If you have an Unsplash+ subscription, you're free to use it. Otherwise, consider picking a free image from unsplash.com (look for ones without the "Unsplash+" badge).

## Changes (1 file)

### `src/pages/Index.tsx`
- Replace the imported `heroBg` asset with the Unsplash URL used directly as an inline `src`
- Remove the `import heroBg from "@/assets/hero-bg.jpg"` line
- Set the hero `<img>` src to the Unsplash CDN URL:
  ```
  https://plus.unsplash.com/premium_vector-1724355762918-775a14a5c3d5?fm=jpg&q=80&w=2000&auto=format&fit=crop
  ```
- The old `src/assets/hero-bg.jpg` file can optionally be deleted afterward

## What Stays the Same
- All hero layout, gradient overlays, opacity, and responsive behavior remain identical
- Only the image source changes

