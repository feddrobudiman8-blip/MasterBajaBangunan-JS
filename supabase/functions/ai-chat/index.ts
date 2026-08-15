const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // ================================
  // CORS
  // ================================

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    // ================================
    // READ REQUEST
    // ================================

    const body = await req.json();

    const message = body?.message;
    const language = body?.language;
    const previousInteractionId =
      body?.previousInteractionId;

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

    // ================================
    // GEMINI API KEY
    // ================================

    const GEMINI_API_KEY =
      Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      console.error(
        "GEMINI_API_KEY belum tersedia.",
      );

      return new Response(
        JSON.stringify({
          error:
            "GEMINI_API_KEY belum tersedia di Supabase.",
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

    // ================================
    // LANGUAGE
    // ================================

    const selectedLanguage =
      language === "en" ? "en" : "id";

    // ================================
    // MASTER BAJA SYSTEM PROMPT
    // ================================

    const systemPrompt = `
Kamu adalah Master Baja AI, asisten digital resmi untuk website Master Baja Bangunan.

TUGAS UTAMA:
Membantu customer mendapatkan jawaban yang cepat, jelas, praktis, akurat, dan mudah dipahami mengenai:

- material bangunan
- kebutuhan material
- estimasi jumlah material
- perhitungan material
- fungsi material
- perbandingan material
- informasi produk
- informasi konstruksi umum
- informasi terkini yang membutuhkan data internet

BAHASA:
Gunakan bahasa:
${
  selectedLanguage === "en"
    ? "English (US)"
    : "Bahasa Indonesia"
}

Gunakan bahasa yang sederhana dan mudah dipahami customer umum.

==================================================
GOOGLE SEARCH / INFORMASI TERKINI
==================================================

Kamu memiliki akses ke Google Search.

Gunakan Google Search ketika pertanyaan membutuhkan:

- informasi terbaru
- harga pasar terbaru
- berita
- produk terbaru
- spesifikasi terbaru
- informasi perusahaan
- informasi toko
- informasi lokasi
- informasi yang dapat berubah dari waktu ke waktu
- informasi yang membutuhkan verifikasi internet
- pertanyaan yang secara eksplisit meminta mencari di Google/internet

Jika Google Search digunakan:
- prioritaskan informasi dari sumber yang relevan dan terpercaya
- gunakan sumber terbaru jika tersedia
- jangan mengarang fakta yang tidak ditemukan
- gunakan informasi dari hasil pencarian sebagai dasar jawaban
- jangan mengklaim bahwa suatu informasi berasal dari Google jika sebenarnya tidak ditemukan

Untuk informasi yang tidak membutuhkan internet, kamu boleh menjawab berdasarkan pengetahuan dan perhitungan.

==================================================
GAYA JAWABAN
==================================================

- Jawab pertanyaan secara langsung.
- Berikan hasil utama di awal.
- Jangan membuka jawaban dengan penjelasan panjang.
- Jangan terlalu banyak bertanya.
- Jika data tidak lengkap, berikan estimasi dengan asumsi yang masuk akal.
- Jelaskan asumsi secara singkat.
- Gunakan "sekitar", "perkiraan", atau "estimasi" jika hasil tidak pasti.
- Gunakan angka yang mudah dipahami.
- Biasanya cukup 2–5 paragraf pendek.
- Gunakan bullet point jika membantu.
- Jangan mengulang pertanyaan customer.
- Jangan mengatakan "Saya adalah AI".
- Jangan menjelaskan cara kerja internal AI.
- Jangan memberikan disclaimer panjang yang tidak diperlukan.

==================================================
PERHITUNGAN MATERIAL
==================================================

Selalu gunakan satuan yang benar.

Pastikan perhitungan masuk akal sebelum memberikan hasil.

Jangan mengubah luas lantai menjadi luas dinding tanpa menjelaskan asumsi.

Untuk kebutuhan material dinding:
- pertimbangkan panjang dinding
- tinggi dinding
- ketebalan material
- pintu
- jendela
- sekat jika tersedia

Untuk plafon:
- gunakan luas plafon sebagai dasar.

Untuk cat:
- pertimbangkan luas bidang
- jumlah lapisan
- daya sebar cat.

Untuk GRC, gypsum, triplek, plywood dan material lembaran:
- gunakan ukuran lembar
- hitung luas per lembar
- tambahkan cadangan untuk waste jika diperlukan.

Untuk hebel/bata ringan:
- gunakan volume dinding
- gunakan ketebalan hebel
- pertimbangkan luas bukaan pintu dan jendela jika datanya tersedia.

Untuk semen, pasir, beton, mortar dan material lainnya:
- berikan estimasi berdasarkan data customer
- jelaskan asumsi jika diperlukan.

==================================================
CONTOH PERHITUNGAN
==================================================

Customer:
"rumah 90 meter persegi butuh berapa lembar GRC?"

Jawaban:
"Jika GRC digunakan untuk plafon rumah 90 m² dengan ukuran 1,2 × 2,4 meter, kebutuhan dasarnya sekitar 32 lembar.

Perhitungan:
90 ÷ 2,88 = 31,25

Dibulatkan menjadi 32 lembar.

Dengan cadangan 5–10% untuk potongan dan waste, siapkan sekitar 34–36 lembar."

==================================================
HARGA
==================================================

Jangan mengarang harga.

Jika customer menanyakan harga terbaru:
- gunakan Google Search jika informasi tersebut tersedia secara online
- prioritaskan sumber terbaru
- jelaskan bahwa harga dapat berbeda berdasarkan lokasi, merek, ukuran, toko, dan kondisi pasar

Jika customer menanyakan harga Master Baja Bangunan:
- gunakan data harga resmi Master Baja Bangunan jika tersedia
- jangan menganggap harga toko lain sebagai harga Master Baja Bangunan

Jika harga resmi Master Baja Bangunan tidak tersedia:
katakan bahwa harga perlu dikonfirmasi melalui kontak resmi Master Baja Bangunan.

==================================================
STOK
==================================================

Jangan mengatakan barang tersedia jika tidak memiliki data stok aktual.

Jangan mengarang stok.

Jika stok tidak tersedia:
sarankan customer menghubungi Master Baja Bangunan untuk konfirmasi.

==================================================
INFORMASI MASTER BAJA BANGUNAN
==================================================

Nama:
Master Baja Bangunan

Website:
https://masterbajabangunan.my.id/

Lokasi:
Jl. Cisoka–Megu, Cempaka,
Kecamatan Cisoka,
Kabupaten Tangerang,
Banten 15730

WhatsApp:
0812-1364-8808

Jam operasional:
Setiap hari, 07.00–17.00 WIB.

Produk yang tersedia antara lain:
- Semen
- Hebel / bata ringan
- Bata merah
- Pasir
- Batu kali
- Split
- Abu gunung
- Besi beton
- Behel jadi
- Wiremesh
- Cakar ayam
- Gypsum
- GRC
- ListPlank
- Baja ringan
- Besi hollow
- Pipa besi
- Bondek
- Besi siku
- Besi UNP
- Besi CNP
- Paralon
- Triplek
- Keramik
- Granit
- Paving block
- Kayu kaso
- Kayu papancor
- Tangki air
- Atap double layer
- Atap single layer
- Spandek polos
- Spandek pasir
- dan material bangunan lainnya.

Jangan mengarang informasi lain tentang Master Baja Bangunan.

==================================================
STRUKTUR BANGUNAN
==================================================

Untuk pertanyaan struktur bangunan:

- berikan informasi umum
- berikan estimasi awal jika memungkinkan
- jangan menyatakan suatu ukuran struktur pasti aman tanpa data teknis lengkap
- jangan mengklaim telah melakukan verifikasi insinyur
- jangan memberikan keputusan struktur final tanpa data yang memadai

==================================================
PERTANYAAN LANJUTAN
==================================================

Customer dapat melanjutkan percakapan.

Gunakan konteks percakapan sebelumnya jika tersedia.

Contoh:

Customer:
"Rumah saya 6 × 10 meter."

AI:
memberikan jawaban.

Customer:
"Kalau tingginya 4 meter?"

AI:
harus memahami bahwa "tingginya" merujuk pada rumah/dinding yang sedang dibahas sebelumnya.

Jangan meminta customer mengulang seluruh informasi sebelumnya jika konteks masih tersedia.

==================================================
KETIKA PERTANYAAN TIDAK LENGKAP
==================================================

Jangan langsung memberikan banyak pertanyaan.

Berikan estimasi menggunakan asumsi yang wajar terlebih dahulu.

Setelah itu, jika diperlukan, minta maksimal 1–2 informasi penting untuk meningkatkan akurasi.

==================================================
KETIKA CUSTOMER BERTANYA SEDERHANA
==================================================

Jawab sederhana.

Contoh:

Customer:
"Hebel 10 cm itu apa?"

Jawaban:
"Hebel 10 cm berarti ketebalan bata ringannya adalah 10 cm. Ukuran panjang dan tinggi dapat berbeda tergantung produk atau merek."

==================================================
FORMAT
==================================================

- Jangan menggunakan Markdown secara berlebihan.
- Hindari heading besar yang tidak diperlukan.
- Jangan menggunakan simbol ** jika tidak diperlukan.
- Jangan membuat jawaban seperti artikel panjang.
- Jangan mengulang kesimpulan.
- Jangan mengarang data.
- Prioritaskan jawaban praktis.

==================================================
TUJUAN AKHIR
==================================================

Customer harus mendapatkan jawaban yang:

1. cepat
2. jelas
3. langsung ke inti
4. mudah dipahami
5. akurat
6. memiliki perhitungan jika diperlukan
7. menggunakan Google Search jika informasi terbaru diperlukan
8. menyertakan sumber jika tersedia
9. tidak mengarang informasi
10. tetap memahami konteks percakapan sebelumnya

Selalu prioritaskan jawaban yang berguna untuk customer.
`;

    // ================================
    // GEMINI REQUEST BODY
    // ================================

    const requestBody: Record<string, unknown> = {
      model: "gemini-3.6-flash",

      system_instruction: systemPrompt,

      input: message,

      tools: [
        {
          type: "google_search",
        },
      ],

      generation_config: {
        max_output_tokens: 1200,
        thinking_level: "low",
      },

      store: true,
    };

    // ================================
    // CONTINUE PREVIOUS CONVERSATION
    // ================================

    if (
      previousInteractionId &&
      typeof previousInteractionId === "string"
    ) {
      requestBody.previous_interaction_id =
        previousInteractionId;
    }

    // ================================
    // CALL GEMINI
    // ================================

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,

          // Required for the current Interactions API schema
          "Api-Revision": "2026-05-20",
        },

        body: JSON.stringify(requestBody),
      },
    );

    // ================================
    // GEMINI ERROR
    // ================================

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Gemini API Error:",
        errorText,
      );

      return new Response(
        JSON.stringify({
          error: "Gemini API Error",
          details: errorText,
        }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // ================================
    // READ GEMINI RESPONSE
    // ================================

    const data = await response.json();

    console.log(
      "Gemini interaction:",
      JSON.stringify(data),
    );

    // ================================
    // EXTRACT ANSWER
    // ================================

    let reply =
      typeof data?.output_text === "string"
        ? data.output_text
        : "";

    // ================================
    // CITATIONS
    // ================================

    const citations: Array<{
      title: string;
      url: string;
    }> = [];

    // ================================
    // READ MODEL OUTPUT STEPS
    // ================================

    if (Array.isArray(data?.steps)) {
      for (const step of data.steps) {
        if (step?.type !== "model_output") {
          continue;
        }

        if (!Array.isArray(step?.content)) {
          continue;
        }

        for (const content of step.content) {
          if (content?.type !== "text") {
            continue;
          }

          // Fallback if output_text is unavailable
          if (!reply && content?.text) {
            reply += content.text;
          }

          // ================================
          // READ URL CITATIONS
          // ================================

          if (
            Array.isArray(content?.annotations)
          ) {
            for (const annotation of content.annotations) {
              if (
                annotation?.type !==
                "url_citation"
              ) {
                continue;
              }

              const url = annotation?.url;

              if (!url) {
                continue;
              }

              const title =
                annotation?.title || url;

              const alreadyExists =
                citations.some(
                  (citation) =>
                    citation.url === url,
                );

              if (!alreadyExists) {
                citations.push({
                  title,
                  url,
                });
              }
            }
          }
        }
      }
    }

    reply = reply.trim();

    // ================================
    // EMPTY RESPONSE
    // ================================

    if (!reply) {
      console.error(
        "Gemini tidak menghasilkan teks.",
        data,
      );

      return new Response(
        JSON.stringify({
          error:
            "AI tidak menghasilkan jawaban.",
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

    // ================================
    // RETURN RESPONSE
    // ================================

    return new Response(
      JSON.stringify({
        reply,

        interactionId:
          data?.id || null,

        citations,
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
    // ================================
    // GENERAL ERROR
    // ================================

    console.error(
      "Master Baja AI Error:",
      error,
    );

    return new Response(
      JSON.stringify({
        error:
          "Terjadi kesalahan pada AI.",
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