#!/bin/bash
# Claude Code status line — no jq dependency (parses the stdin JSON with node).
input=$(cat)

printf '%s' "$input" | node -e '
let raw = "";
process.stdin.on("data", c => raw += c);
process.stdin.on("end", () => {
  let d;
  try { d = JSON.parse(raw); } catch { console.log("Loading Claude session..."); return; }

  const model = (d.model && (d.model.display_name || d.model.id)) || d.model || "Claude";
  const costNum = Number((d.cost && d.cost.total_cost_usd) ?? d.total_cost ?? 0);
  const cost = isFinite(costNum) ? costNum.toFixed(2) : "0.00";
  const pct = v => (v == null || isNaN(Number(v))) ? "0" : String(Math.round(Number(v)));
  const ctx = pct(d.context_window && d.context_window.used_percentage);
  // rate_limits is absent for API-key users and before the first API response — show "--", not a fake 0%.
  // Each window (five_hour, seven_day) may be independently absent.
  const win = name => {
    const v = d.rate_limits && d.rate_limits[name] && d.rate_limits[name].used_percentage;
    return v == null ? "--" : pct(v) + "%";
  };

  // resets_at is Unix epoch seconds; render in local time as "Thu 14:00".
  // If it is 6+ days out, the weekday alone is ambiguous (could mean the same weekday next week), so add the date.
  const resetAt = name => {
    const t = Number(d.rate_limits && d.rate_limits[name] && d.rate_limits[name].resets_at);
    if (!t || !isFinite(t)) return "";
    const dt = new Date(t * 1000);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const hm = String(dt.getHours()).padStart(2, "0") + ":" + String(dt.getMinutes()).padStart(2, "0");
    const far = t - Date.now() / 1000 >= 6 * 86400;
    const day = far ? `${days[dt.getDay()]} ${dt.getDate()} ${months[dt.getMonth()]}` : days[dt.getDay()];
    return ` (resets ${day} ${hm})`;
  };

  console.log(`🤖 Model: ${model} | 💰 Cost: $${cost} | 📊 Context: ${ctx}% | 📅 7d: ${win("seven_day")}${resetAt("seven_day")}`);
});
' 2>/dev/null || echo "Loading Claude session..."
