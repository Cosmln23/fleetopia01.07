import { Loader } from "@googlemaps/js-api-loader";

let loaderPromise: Promise<typeof google> | null = null;

export const loadGoogle = () => {
  if (!loaderPromise) {
    console.log('[GOOGLE] 🚀 Starting clean Google Maps loader...')
    
    loaderPromise = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: "weekly",
      libraries: ["places"],   // autocomplete inclus
    }).load().then((google) => {
      console.log('[GOOGLE] ✅ Google Maps with Places loaded successfully')
      console.log('[GOOGLE] 🔍 Places API:', !!google.maps.places)
      console.log('[GOOGLE] 🔍 AutocompleteService:', !!google.maps.places?.AutocompleteService)
      return google;
    });
  }
  
  return loaderPromise;
};