const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // =====================================
  // CORS
  // =====================================

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    // =====================================
    // READ REQUEST
    // =====================================

    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({
          error: "Pesan tidak boleh kosong.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // =====================================
    // OPENAI API KEY
    // =====================================

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY belum tersedia.");

      return new Response(
        JSON.stringify({
          error: "OPENAI_API_KEY belum tersedia di Supabase.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // =====================================
    // SYSTEM PROMPT
    // =====================================

    const systemPrompt = `
Kamu adalah Master Baja AI, asisten resmi untuk website Master Baja Bangunan.

Nama bisnis:
Master Baja Bangunan

Tugas utama:
Membantu customer memahami kebutuhan material bangunan untuk rumah atau proyek mereka.

Kamu dapat membantu:
- Menghitung perkiraan kebutuhan material.
- Memberikan estimasi jumlah semen, pasir, batu, bata merah, hebel, besi beton, baja ringan, dan material lainnya.
- Membantu membuat daftar material berdasarkan ukuran bangunan.
- Menanyakan detail yang belum diberikan customer.
- Menjelaskan perhitungan dengan bahasa sederhana.
- Memberikan estimasi awal, bukan harga final.
- Mengarahkan customer untuk menghubungi Master Baja Bangunan untuk pengecekan harga dan kebutuhan aktual.

Informasi yang dapat ditanyakan:
- Panjang bangunan.
- Lebar bangunan.
- Tinggi dinding.
- Jumlah lantai.
- Jenis material dinding.
- Ukuran pondasi jika diperlukan.
- Ukuran kolom dan balok jika diperlukan.
- Jenis atap.
- Lokasi proyek jika berhubungan dengan pengiriman.

ATURAN PENTING:

1. Jangan mengarang harga terbaru.

2. Jangan mengatakan stok tersedia jika tidak ada data stok.

3. Jika data belum cukup untuk melakukan perhitungan, tanyakan data yang diperlukan terlebih dahulu.

4. Jelaskan bahwa hasil perhitungan adalah estimasi awal.

5. Untuk pekerjaan struktur seperti pondasi, kolom, balok, dan kebutuhan besi struktur, sarankan customer melakukan pengecekan dengan tenaga profesional atau engineer.

6. Gunakan bahasa Indonesia yang ramah, jelas, dan mudah dipahami.

7. Jangan terlalu teknis kecuali customer meminta penjelasan teknis.

8. Jangan memberikan daftar material yang sangat panjang jika customer baru memberikan informasi dasar.

9. Jika customer memberikan ukuran bangunan tetapi belum memberikan informasi penting lainnya, tanyakan informasi tersebut terlebih dahulu.

CONTOH:

Jika customer mengatakan:

"Saya mau bangun rumah 6x10 meter"

Jangan langsung menghitung semua material.

Tanyakan:

1. Rumah 1 atau 2 lantai?
2. Tinggi dinding berapa meter?
3. Menggunakan bata merah atau hebel?
4. Jenis atap apa?
5. Apakah ingin menghitung material struktur juga?

Tujuan akhirnya:
Membantu customer mendapatkan gambaran kebutuhan material bangunan dan kemudian menghubungi Master Baja Bangunan untuk pengecekan harga, stok, dan kebutuhan aktual.
`;

    // =====================================
    // CALL OPENAI
    // =====================================

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },

        body: JSON.stringify({
          model: "gpt-5-mini",
          instructions: systemPrompt,
          input: message,
          max_output_tokens: 700,
        }),
      },
    );

    // =====================================
    // HANDLE OPENAI ERROR
    // =====================================

    if (!response.ok) {
      const errorText = await response.text();

      console.error("OpenAI API Error:", errorText);

      return new Response(
        JSON.stringify({
          error: "AI sedang mengalami gangguan.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // =====================================
    // READ OPENAI RESPONSE
    // =====================================

    const data = await response.json();

    console.log(
      "OpenAI response received:",
      JSON.stringify(data),
    );

    // =====================================
    // EXTRACT TEXT FROM RESPONSES API
    // =====================================

    let reply = "";

    if (Array.isArray(data.output)) {
      for (const item of data.output) {
        if (!Array.isArray(item.content)) {
          continue;
        }

        for (const content of item.content) {
          if (
            content.type === "output_text" &&
            typeof content.text === "string"
          ) {
            reply += content.text;
          }
        }
      }
    }

    // =====================================
    // FALLBACK
    // =====================================

    if (!reply.trim()) {
      console.error(
        "Tidak menemukan output_text dari OpenAI:",
        JSON.stringify(data),
      );

      reply =
        "Maaf, saya belum bisa memberikan jawaban saat ini.";
    }

    // =====================================
    // RETURN RESPONSE TO FRONTEND
    // =====================================

    return new Response(
      JSON.stringify({
        reply: reply.trim(),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    // =====================================
    // GENERAL ERROR
    // =====================================

    console.error(
      "Master Baja AI Error:",
      error,
    );

    return new Response(
      JSON.stringify({
        error: "Terjadi kesalahan pada AI.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});