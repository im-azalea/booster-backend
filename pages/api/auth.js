export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  const clientId = process.env.NEYNAR_CLIENT_ID;
  const apiKey = process.env.NEYNAR_API_KEY;

  const response = await fetch(`https://api.neynar.com/v2/siwn/authenticate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api_key": apiKey
    },
    body: JSON.stringify({
      code,
      client_id: clientId
    })
  });

  if (!response.ok) {
    return res.status(500).json({ error: "Failed to authenticate" });
  }

  const data = await response.json();

  return res.status(200).json({ data });
}
