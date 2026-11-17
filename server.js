// Route Optimizer yerel sunucusu.
// - index.html'i http://localhost:8765 adresinde sunar.
// - /api/optimizeTours isteklerini, bu klasördeki servis hesabı anahtarıyla (JSON) Google Route
//   Optimization API'ye iletir. Route Optimization API anahtarı kabul etmediği için bu gerekir.
// Çalıştırma: node server.js   (ya da Baslat.bat)
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = 8765;
const ROOT = __dirname;
const SERVED = {".html":"text/html; charset=utf-8", ".xlsx":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"};

// Klasördeki servis hesabı anahtarını bulur: içinde "type": "service_account" olan ilk .json dosyası.
function loadServiceAccount() {
  for (const name of fs.readdirSync(ROOT)) {
    if (!name.toLowerCase().endsWith(".json")) continue;
    try {
      const data = JSON.parse(fs.readFileSync(path.join(ROOT, name), "utf8"));
      if (data.type === "service_account" && data.private_key && data.client_email) return data;
    } catch (e) { /* JSON değil, geç */ }
  }
  return null;
}

let cachedToken = null;
async function getAccessToken(account) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.email === account.client_email && cachedToken.expires > now + 60) return cachedToken.value;
  const tokenUri = account.token_uri || "https://oauth2.googleapis.com/token";
  const encode = function(obj){ return Buffer.from(JSON.stringify(obj)).toString("base64url"); };
  const unsigned = encode({alg:"RS256", typ:"JWT"}) + "." + encode({
    iss:account.client_email, scope:"https://www.googleapis.com/auth/cloud-platform",
    aud:tokenUri, iat:now, exp:now + 3600
  });
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(account.private_key).toString("base64url");
  const response = await fetch(tokenUri, {
    method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer", assertion:unsigned + "." + signature})
  });
  const payload = await response.json().catch(function(){ return {}; });
  if (!response.ok || !payload.access_token) throw new Error("Google erişim belirteci alınamadı: " + (payload.error_description || payload.error || response.status));
  cachedToken = {email:account.client_email, value:payload.access_token, expires:now + (payload.expires_in || 3600)};
  return cachedToken.value;
}

function sendJson(res, status, body) {
  res.writeHead(status, {"Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store"});
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise(function(resolve, reject){
    const chunks = [];
    req.on("data", function(c){ chunks.push(c); });
    req.on("end", function(){ resolve(Buffer.concat(chunks).toString("utf8")); });
    req.on("error", reject);
  });
}

http.createServer(async function(req, res){
  const url = decodeURIComponent(req.url.split("?")[0]);
  try {
    if (url === "/api/status") {
      const account = loadServiceAccount();
      sendJson(res, 200, {configured:!!account, projectId:account ? account.project_id : ""});
      return;
    }
    if (url === "/api/optimizeTours" && req.method === "POST") {
      const account = loadServiceAccount();
      if (!account) {
        sendJson(res, 503, {error:{message:"Servis hesabı anahtarı bulunamadı. JSON anahtar dosyasını uygulama klasörüne koyun."}});
        return;
      }
      const body = await readBody(req);
      const token = await getAccessToken(account);
      const upstream = await fetch("https://routeoptimization.googleapis.com/v1/projects/" + encodeURIComponent(account.project_id) + ":optimizeTours", {
        method:"POST",
        headers:{"Content-Type":"application/json", "Authorization":"Bearer " + token},
        body:body
      });
      sendJson(res, upstream.status, await upstream.text());
      return;
    }
    // Statik dosyalar: yalnızca klasörün kökündeki .html ve .xlsx (anahtar dosyası asla sunulmaz).
    const rel = url.replace(/^\/+/, "") || "index.html";
    const type = SERVED[path.extname(rel).toLowerCase()];
    if (!type || rel.includes("/") || rel.includes("\\") || rel.startsWith(".")) { res.writeHead(404); res.end("Not found"); return; }
    fs.readFile(path.join(ROOT, rel), function(err, data){
      if (err) { res.writeHead(404); res.end("Not found"); return; }
      res.writeHead(200, {"Content-Type":type, "Cache-Control":"no-store"});
      res.end(data);
    });
  } catch (err) {
    sendJson(res, 500, {error:{message:err && err.message ? err.message : String(err)}});
  }
}).on("error", function(err){
  if (err.code === "EADDRINUSE") console.log("Sunucu zaten çalışıyor: http://localhost:" + PORT);
  else console.error(err.message);
  process.exit(err.code === "EADDRINUSE" ? 0 : 1);
}).listen(PORT, "127.0.0.1", function(){
  console.log("Route Optimizer: http://localhost:" + PORT);
  console.log(loadServiceAccount() ? "Servis hesabı anahtarı bulundu." : "UYARI: Servis hesabı anahtarı (JSON) bu klasörde bulunamadı.");
});
