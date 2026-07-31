const API_URL =
  "https://plfhmdtjubgrpoqrhdwo.supabase.co/functions/v1/visitor-counter";

async function loadVisitors() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Gagal mengambil data visitor");
    }

    const data = await response.json();

    const total = document.getElementById("totalVisitors");
    const today = document.getElementById("todayVisitors");
    const online = document.getElementById("onlineVisitors");

    if (total) total.textContent = data.total;
    if (today) today.textContent = data.today;
    if (online) online.textContent = data.online;
  } catch (err) {
    console.error(err);
  }
}

loadVisitors();
setInterval(loadVisitors, 30000);
