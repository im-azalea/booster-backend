// File: /pages/api/worker.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.NEYNAR_API_KEY;
  const signer = process.env.FARC_SIGNER_UUID;

  // 1️⃣ Ambil boost request yang belum di-like
  const { data: pendingBoosts, error } = await supabase
    .from('boosts')
    .select('*')
    .is('processed', null)
    .limit(10);

  if (error) {
    return res.status(500).json({ error: "Failed to fetch boosts", details: error });
  }

  // 2️⃣ Ambil semua member (kecuali owner cast)
  const { data: members } = await supabase
    .from('members')
    .select('*');

  for (const boost of pendingBoosts) {
    // 3️⃣ Pilih 30 liker random (atau seadanya)
    const likerPool = members.filter(m => m.farcaster_id !== boost.farcaster_id);
    const chosenLikers = likerPool.slice(0, 30);

    // 4️⃣ Panggil Neynar API buat like
    for (const liker of chosenLikers) {
      await fetch(`https://api.neynar.com/v2/farcaster/cast/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api_key": apiKey
        },
        body: JSON.stringify({
          signer_uuid: signer,
          cast_url: boost.cast_url
        })
      });
    }

    // 5️⃣ Like dari semua member ke @azalea
    const { data: azaleaCasts } = await supabase
      .from('casts')
      .select('*')
      .eq('author', 'azalea')
      .gte('created_at', new Date().toISOString().slice(0, 10));

    for (const cast of azaleaCasts) {
      for (const liker of members) {
        await fetch(`https://api.neynar.com/v2/farcaster/cast/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api_key": apiKey
          },
          body: JSON.stringify({
            signer_uuid: signer,
            cast_url: cast.cast_url
          })
        });
      }
    }

    // 6️⃣ Tandai boost sudah diproses
    await supabase
      .from('boosts')
      .update({ processed: true })
      .eq('id', boost.id);
  }

  return res.status(200).json({ message: `Processed ${pendingBoosts.length} boosts.` });
}
