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

// ----------------------------------------------------------------------------
// Public inventory visibility
// Controlled from the admin dashboard (Inventory tab → "Public Inventory Page").
// Stored in site_settings under key `inventory_page` as
// { "public": true|false, "message": "..." }.
// If the row is missing, the inventory is treated as HIDDEN so the public
// pages fall back to the "call for current inventory" notice.
// ----------------------------------------------------------------------------
var INVENTORY_NOTICE_DEFAULT = "We're building out our online inventory. In the meantime, we have new and used Fisher plows, spreaders, Toro snow blowers and mowers in stock — call 603-352-6855 or stop by 538 Main Street in Walpole, NH for current availability.";

function getInventoryVisibility() {
    return supabase.from('site_settings').select('value').eq('key', 'inventory_page').maybeSingle()
        .then(function (r) {
            var v = (r && r.data && r.data.value) || {};
            return {
                public: v.public === true,
                message: (typeof v.message === 'string' && v.message.trim()) ? v.message.trim() : INVENTORY_NOTICE_DEFAULT
            };
        })
        .catch(function () {
            return { public: false, message: INVENTORY_NOTICE_DEFAULT };
        });
}
