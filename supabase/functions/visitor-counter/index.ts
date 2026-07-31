import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    "unknown";

  const now = new Date().toISOString();

  // Cari visitor berdasarkan IP
  const { data: visitor } = await supabase
    .from("visitors")
    .select("*")
    .eq("ip", ip)
    .maybeSingle();

  if (visitor) {
    await supabase
      .from("visitors")
      .update({
        last_seen: now,
      })
      .eq("id", visitor.id);
  } else {
    await supabase
      .from("visitors")
      .insert({
        ip,
        created_at: now,
        last_seen: now,
      });
  }

  // Total visitor
  const { count: total } = await supabase
    .from("visitors")
    .select("*", {
      count: "exact",
      head: true,
    });

  // Visitor hari ini
  const today = new Date().toISOString().split("T")[0];

  const { count: todayCount } = await supabase
    .from("visitors")
    .select("*", {
      count: "exact",
      head: true,
    })
    .gte("created_at", today);

  // Visitor online (aktif 5 menit terakhir)
  const fiveMinutesAgo = new Date(
    Date.now() - 5 * 60 * 1000
  ).toISOString();

  const { count: online } = await supabase
    .from("visitors")
    .select("*", {
      count: "exact",
      head: true,
    })
    .gte("last_seen", fiveMinutesAgo);

  return new Response(
    JSON.stringify({
      total,
      today: todayCount,
      online,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
});