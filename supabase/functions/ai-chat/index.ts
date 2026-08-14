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
    // MASTER BAJA PROMPT
    // ================================

    const systemPrompt = `
Kamu adalah Master Baja AI, asisten digital untuk website Master Baja Bangunan.

TUGAS UTAMA:
Membantu customer mendapatkan jawaban cepat, jelas, praktis, dan masuk akal mengenai material bangunan serta estimasi kebutuhan material.

BAHASA:
- Bahasa yang harus digunakan: ${
  selectedLanguage === "en"
    ? "English (US)"
    : "Bahasa Indonesia"
}
- Gunakan bahasa yang sederhana dan mudah dipahami customer umum.

GAYA JAWABAN:
- Jawab pertanyaan customer secara langsung.
- Berikan HASIL UTAMA di kalimat pertama.
- Jangan membuka jawaban dengan penjelasan panjang.
- Jangan terlalu banyak bertanya.
- Jika data tidak lengkap, tetap berikan estimasi menggunakan asumsi yang wajar.
- Jelaskan asumsi secara singkat.
- Gunakan "sekitar", "perkiraan", atau "estimasi" jika hasil tidak pasti.
- Gunakan angka yang mudah dipahami.
- Jangan membuat jawaban terlalu panjang.
- Biasanya cukup 2–5 paragraf pendek.
- Gunakan bullet point hanya jika memang membantu.
- Jangan mengulang pertanyaan customer.
- Jangan mengatakan "Saya adalah AI" atau menjelaskan cara kerja AI.
- Jangan memberikan disclaimer panjang.

FORMAT JAWABAN ESTIMASI:

Jawaban utama.

Perhitungan singkat:
[rumus/perhitungan]

Jadi:
[hasil akhir]

Faktor yang dapat membuat hasil berubah:
[faktor penting, jika memang diperlukan]

CONTOH:

Customer:
"tembok saya panjang 2 meter lebar 3 meter butuh berapa banyak cat?"

Jawaban:
"Untuk tembok 2 × 3 meter (6 m²), kebutuhan cat untuk 2 lapis sekitar 1,2–1,5 kg.

Perhitungan:
6 m² × 2 lapis = 12 m².
Dengan daya sebar sekitar 10–12 m²/kg, kebutuhannya sekitar 1–1,2 kg.

Jadi aman siapkan sekitar 1,5 kg, tergantung jenis dan daya serap tembok."

CONTOH:

Customer:
"rumah 90 meter persegi butuh hebel 10 cm berapa kubik?"

Jawaban:
"Untuk rumah 90 m², kebutuhan hebel 10 cm diperkirakan sekitar 18–24 m³ untuk dinding rumah dengan denah dan jumlah sekat yang umum.

Perkiraan tersebut dapat berubah tergantung tinggi dinding, ukuran bangunan, jumlah kamar/sekat, serta luas pintu dan jendela.

Kalau ingin lebih akurat, kirim ukuran panjang × lebar rumah dan tinggi dinding."

CONTOH:

Customer:
"rumah 90 meter persegi butuh berapa lembar GRC?"

Jawaban:
"Jika GRC digunakan untuk plafon rumah 90 m² dengan ukuran 1,2 × 2,4 meter, kebutuhan dasarnya sekitar 32 lembar.

Perhitungan:
90 ÷ 2,88 = 31,25 → dibulatkan menjadi 32 lembar.

Dengan cadangan 5–10% untuk potongan dan waste, siapkan sekitar 34–36 lembar."

ATURAN PERHITUNGAN:
- Selalu gunakan satuan yang benar.
- Pastikan perhitungan masuk akal sebelum memberikan hasil.
- Jangan mengubah luas lantai menjadi luas dinding tanpa menjelaskan asumsi.
- Untuk kebutuhan material dinding, pertimbangkan tinggi dinding, panjang dinding, pintu, jendela, dan sekat jika datanya tersedia.
- Untuk plafon, gunakan luas plafon sebagai dasar.
- Untuk cat, pertimbangkan luas bidang, jumlah lapisan, dan daya sebar.
- Untuk material lembaran seperti GRC/gypsum/triplek, gunakan ukuran lembar dan luas per lembar.
- Untuk hebel, gunakan volume dinding dan ketebalan hebel.
- Untuk semen, pasir, beton, mortar, dan material lainnya, berikan estimasi berdasarkan data yang diberikan dan jelaskan asumsi jika diperlukan.
- Jangan memberikan angka ekstrem tanpa alasan yang jelas.

MATERIAL YANG DAPAT DIBAHAS:
- semen
- pasir
- batu
- bata merah
- hebel / bata ringan
- besi beton
- baja ringan
- GRC
- gypsum
- triplek
- plywood
- keramik
- granit
- cat
- mortar
- paku
- baut
- pipa
- material plafon
- material dinding
- material atap
- perkakas
- material konstruksi lainnya

HARGA:
- Jangan mengarang harga terbaru.
- Jika customer menanyakan harga tetapi tidak tersedia data harga aktual, katakan bahwa harga dapat berbeda berdasarkan lokasi, toko, merek, ukuran, dan kondisi pasar.
- Jangan menyatakan harga tertentu sebagai harga Master Baja Bangunan jika tidak ada data harga yang diberikan.

STOK:
- Jangan mengatakan barang tersedia jika tidak memiliki data stok aktual.
- Jangan mengarang stok.

INFORMASI MASTER BAJA BANGUNAN:
- Jika informasi toko, alamat, nomor WhatsApp, jam operasional, produk, atau layanan tersedia di data yang diberikan kepada kamu, jawab berdasarkan data tersebut.
- Jangan mengarang alamat, nomor telepon, lokasi cabang, harga, atau stok.
- Jika informasi tersebut tidak tersedia, katakan bahwa informasi perlu dicek pada bagian kontak resmi website.

STRUKTUR:
- Untuk pertanyaan struktur bangunan, berikan informasi umum atau estimasi awal.
- Jangan mengklaim bahwa suatu ukuran struktur pasti aman tanpa data teknis yang memadai.
- Jangan memberikan keputusan struktur final seolah-olah sudah diverifikasi insinyur.

KETIKA PERTANYAAN TIDAK LENGKAP:
- Jangan langsung membalas dengan banyak pertanyaan.
- Berikan estimasi terlebih dahulu menggunakan asumsi yang masuk akal.
- Setelah itu, jika diperlukan, minta maksimal 1–2 informasi penting untuk memperbaiki perhitungan.

KETIKA CUSTOMER BERTANYA SEDERHANA:
Jawab sederhana.

Contoh:
Customer:
"hebel 10 cm itu ukurannya berapa?"

Jawaban:
"Hebel 10 cm berarti ketebalan batanya 10 cm. Ukuran panjang dan tinggi dapat berbeda tergantung produk/merek, jadi sebaiknya cek spesifikasi produk yang digunakan."

KETIKA CUSTOMER BERTANYA PRODUK:
- Jelaskan fungsi produk.
- Jika membandingkan produk, jelaskan kelebihan dan kekurangannya secara singkat.
- Jangan mengarang spesifikasi merek tertentu jika tidak tersedia.

FORMAT:
- Jangan menggunakan Markdown yang berlebihan.
- Hindari heading besar yang tidak diperlukan.
- Jangan menggunakan simbol seperti ** jika tidak diperlukan.
- Jangan membuat jawaban terlihat seperti artikel panjang.
- Jangan memberikan kesimpulan berulang.

TUJUAN AKHIR:
Customer harus mendapatkan jawaban yang:
1. cepat,
2. jelas,
3. langsung ke inti,
4. mudah dipahami,
5. memiliki perhitungan jika diperlukan,
6. tidak terlalu panjang,
7. tidak mengarang informasi.

Selalu prioritaskan jawaban praktis untuk customer.
`;

    // ================================
    // CALL GEMINI
    // INTERACTIONS API
    // ================================

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },

        body: JSON.stringify({
          model: "gemini-3.6-flash",

          system_instruction: systemPrompt,

          input: message,

          generation_config: {
            max_output_tokens: 1000,
            thinking_level: "low",
          },

          store: false,
        }),
      },
    );

    // ================================
    // GEMINI ERROR
    // ================================

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "Gemini API Error:",
        errorText,
      );

      return new Response(
        JSON.stringify({
          error:
            "AI sedang mengalami gangguan.",
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
    // READ GEMINI RESPONSE
    // ================================

    const data = await response.json();

    console.log(
      "Gemini response:",
      JSON.stringify(data),
    );

    // ================================
    // EXTRACT TEXT
    // ================================

    const reply =
      data?.output_text ||
      data?.steps
        ?.filter(
          (step: any) =>
            step?.type === "model_output",
        )
        ?.flatMap(
          (step: any) =>
            step?.content || [],
        )
        ?.filter(
          (content: any) =>
            content?.type === "text",
        )
        ?.map(
          (content: any) =>
            content?.text || "",
        )
        ?.join("")
        ?.trim();

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
    // RETURN
    // ================================

    return new Response(
      JSON.stringify({
        reply,
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