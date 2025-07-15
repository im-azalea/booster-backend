// File: /pages/api/boost.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { farcaster_id, cast_url } = req.body;

  if (!farcaster_id || !cast_url) {
    return res.status(400).json({ error: "Missing farcaster_id or cast_url" });
  }

  // Cek berapa boost hari ini
  const { count, error: countError } = await supabase
    .from('boosts')
    .select('*', { count: 'exact', head: true })
    .eq('farcaster_id', farcaster_id)
    .gte('created_at', new Date().toISOString().slice(0, 10));

  if (countError) {
    return res.status(500).json({ error: "Count failed", details: countError });
  }

  if (count >= 3) {
    return res.status(400).json({ error: "Daily boost limit reached" });
  }

  // Insert boost request
  const { data, error } = await supabase
    .from('boosts')
    .insert([
      {
        farcaster_id,
        cast_url,
        created_at: new Date().toISOString()
      }
    ]);

  if (error) {
    return res.status(500).json({ error: "Failed to save boost", details: error });
  }

  return res.status(200).json({ message: "Boost request saved!", data });
}
