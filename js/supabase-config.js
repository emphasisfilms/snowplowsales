// Supabase Configuration
// Replace these with your actual Supabase project credentials
var SUPABASE_URL = 'https://mmkzpssjmkwrevgfebua.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ta3pwc3NqbWt3cmV2Z2ZlYnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTM5MTIsImV4cCI6MjA4NjIyOTkxMn0.gjmaZ_odMQv6hKRrrQCk8eCZ1mF7A026haJ6WZjSEIQ';

// Initialize Supabase client
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to get public URL for storage images
function getImageUrl(storagePath) {
    if (!storagePath) return null;
    var result = supabase.storage.from('equipment-photos').getPublicUrl(storagePath);
    return result.data.publicUrl;
}
