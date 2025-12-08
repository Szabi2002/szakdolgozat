export const environment = {
  production: true,
  apiUrl: 'https://kozlekedesi-jegykezelo-backend-production.up.railway.app/api',
  supabase: {
    url: 'https://prhlsuwkokuisqavwfoi.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaGxzdXdrb2t1aXNxYXZ3Zm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwOTM4NzAsImV4cCI6MjA3NzY2OTg3MH0.YCq2SR1djQiCUNqoI27ZIHBT8Vrka6HcPmm1ryQUpEk',
  },
  googleOAuthClientId: '', // Configure in Supabase dashboard
  map: {
    accessToken: 'pk.eyJ1IjoibmFneW5lbWVzMjAwMiIsImEiOiJjbWh0bzR5ZTkwMG4yMmtyOHp5dWhoNjhrIn0.4QRN4Tt4Jh2A7-AId1GKIQ',
    defaultCenter: { lat: 47.4979, lng: 19.0402 }, // Budapest
    defaultZoom: 13,
    style: 'mapbox://styles/mapbox/streets-v12',
    maxZoom: 19
  }
};
