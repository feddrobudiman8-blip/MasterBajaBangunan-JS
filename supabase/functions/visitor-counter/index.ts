import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Ambil IP visitor
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  const now = new Date().toISOString();

  // Cek apakah IP sudah ada
  const { data: existingVisitor, error: findError } = await supabase
    .from("visitors")
    .select("id, ip")
    .eq("ip", ip)
    .maybeSingle();

  if (findError) {
    console.error("Gagal mencari visitor:", findError);

    return new Response(
      JSON.stringify({
        error: "Gagal mencari visitor",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // Kalau IP sudah ada → update last_seen
  if (existingVisitor) {
    const { error: updateError } = await supabase
      .from("visitors")
      .update({
        last_seen: now,
      })
      .eq("id", existingVisitor.id);

    if (updateError) {
      console.error("Gagal update visitor:", updateError);
    }
  } else {
    // Kalau IP belum ada → buat visitor baru
    const { error: insertError } = await supabase
      .from("visitors")
      .insert({
        ip,
        created_at: now,
        last_seen: now,
      });

    if (insertError) {
      console.error("Gagal insert visitor:", insertError);
    }
  }

  // =========================
  // TOTAL VISITOR UNIK
  // =========================

  const { count: total } = await supabase
    .from("visitors")
    .select("*", {
      count: "exact",
      head: true,
    });

  // =========================
  // VISITOR HARI INI
  // =========================

  const today = new Date().toISOString().split("T")[0];

  const { count: todayCount } = await supabase
    .from("visitors")
    .select("*", {
      count: "exact",
      head: true,
    })
    .gte("created_at", today);

  // =========================
  // VISITOR ONLINE
  // AKTIF 5 MENIT TERAKHIR
  // =========================

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
      total: total ?? 0,
      today: todayCount ?? 0,
      online: online ?? 0,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
});