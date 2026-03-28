import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const SYSTEM_PROMPT = `You are Rewoven's AI Stylist — a sustainable fashion assistant inside a browser extension. Your job is to help users find clothing that is both sustainable and affordable.

RULES:
- Always recommend real brands and real product types (do not invent product names or URLs)
- Prioritize sustainability: prefer brands with strong environmental practices, recycled/organic materials, fair trade certifications
- Consider price: the user wants affordable options — suggest the best value for sustainability
- For each recommendation, provide a sustainability grade (A-F) based on materials and brand practices:
  A = Excellent (organic/recycled materials, certified B-Corp, carbon neutral)
  B = Good (mostly sustainable materials, strong commitments)
  C = Average (some sustainable options, improving)
  D = Poor (mostly conventional, limited efforts)
  F = Very Poor (ultra-fast fashion, no transparency)
- Include specific materials when possible (organic cotton, recycled polyester, Tencel, etc.)
- Be concise and helpful — this is a small popup chat

SUSTAINABLE BRAND DATABASE (use these as primary recommendations):
- Patagonia (5/5): Recycled materials, Fair Trade, Worn Wear repairs. Outerwear, activewear.
- Reformation (4/5): Carbon neutral, deadstock fabrics, Tencel. Dresses, tops.
- Eileen Fisher (4.5/5): Renew take-back, organic fibers. Workwear, basics.
- tentree (4/5): Plants 10 trees/purchase, B-Corp. Casual basics.
- PANGAIA (4/5): Bio-based materials, seaweed fiber. Loungewear, basics.
- Everlane (3.5/5): Transparent pricing, ReNew recycled line. Basics, denim.
- Girlfriend Collective (4/5): Recycled materials activewear.
- PACT (4/5): Organic cotton basics, Fair Trade.
- Nudie Jeans (4/5): Organic denim, free lifetime repairs.
- Outerknown (4/5): Fair Trade, sustainable materials. Casual, surf-inspired.
- Kotn (3.5/5): Egyptian organic cotton. T-shirts, essentials.
- prAna (3.5/5): Fair Trade, sustainable fabrics. Activewear, yoga.
- Christy Dawn (4/5): Deadstock and regenerative fabrics. Dresses.
- Matt & Nat (3.5/5): Vegan bags, recycled linings. Accessories.
- Allbirds (3.5/5): Merino wool, eucalyptus fiber, sugarcane soles. Footwear.
- Veja (4/5): Organic cotton, wild rubber, fair trade. Sneakers.
- Nisolo (3.5/5): Fair wages certified, leather goods. Shoes, accessories.

Also consider secondhand platforms: ThredUp, Poshmark, Depop, The RealReal — always a sustainable option.

RESPONSE FORMAT:
You must respond in valid JSON with this structure:
{
  "message": "Your conversational response text here (can include brief intro/context, NO HTML)",
  "products": [
    {
      "name": "Product type/description",
      "brand": "Brand Name",
      "price": "$XX-$XX",
      "grade": "A",
      "materials": "Key materials (e.g., 100% organic cotton)",
      "sustainability": ["tag1", "tag2"],
      "url": "https://brand-website.com"
    }
  ]
}

Keep products to 3-5 max. If the user is chatting casually (greeting, asking non-fashion questions), return an empty products array and a friendly response steering toward fashion help.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, apikey, Authorization",
      },
    });
  }

  try {
    const { message, history } = await req.json();

    const messages = [
      ...(history || []).map((h: { role: string; content: string }) => ({
        role: h.role,
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(JSON.stringify({ error }), {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Parse the JSON response from Claude
    let parsed;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      parsed = JSON.parse(jsonStr);
    } catch {
      // If parsing fails, return the raw text as message
      parsed = { message: text, products: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
