# Route Optimizer

Field visit planning and route optimization for one staff member over a planning period, using the [Google Route Optimization API](https://developers.google.com/maps/documentation/route-optimization). You prepare points, visit rules and work days in Excel; the app spreads the visits over the days and asks Google for the best order within each day. The interface is available in **Turkish and English**.

[Türkçe açıklama aşağıda ↓](#türkçe)

## Features

- Visit rules: one-off, daily, weekly, monthly (N times a month or on fixed days), every N days; time windows (hard or soft), visit duration, priority, mandatory/optional visits, allowed staff.
- Work days per staff member, half days, Turkish public holidays (built in for 2026–2027) and custom leave days.
- Visits without a fixed day are grouped by proximity into as few days as possible, up to a daily fill target.
- One single-vehicle request per work day (billed as Single Vehicle Routing). Solved days are cached in the browser, so unchanged days are not sent (or billed) again.
- Driving or walking routes, optional start point and return, parking time per stop, lunch break.
- Google Maps view with the route of each day, result tables and Excel export.
- Turkish / English interface and light / dark theme.

## How it connects to Google

The Route Optimization API **does not accept API keys**; it needs OAuth. There are two ways to run the app:

### 1. Local server (recommended)

Requires [Node.js](https://nodejs.org/) 18 or newer.

1. In Google Cloud, enable the **Route Optimization API**, create a **service account** with an IAM role that allows calling it, and download its JSON key.
2. Put the JSON key file in the app folder (next to `server.js`). It is ignored by git (`/*.json` in `.gitignore`) and is never served to the browser.
3. Start the app with `Baslat.bat` (Windows) or `node server.js`, then open http://localhost:8765.

`server.js` signs requests with the service account and forwards them to Google; nothing else leaves your computer.

### 2. Browser only (e.g. GitHub Pages)

Open `index.html` from any static host, then in **API Settings** enter your Google Cloud **project ID** and an access token from:

```
gcloud auth print-access-token
```

The token is valid for about one hour and is never stored. It goes straight from your browser to Google; the page has no server of its own.

A token printed for your own Google account carries **all of your Cloud permissions** for that hour. A safer option is a service account that is only allowed to call the Route Optimization API (for example with the *Route Optimization Editor* role), with your account given *Service Account Token Creator* on it:

```
gcloud auth print-access-token --impersonate-service-account=NAME@PROJECT_ID.iam.gserviceaccount.com
```

If such a token leaks, it can only be used for route requests, and only until it expires.

### Map

The map is optional and uses the Google Maps JavaScript API with a separate **API key** (entered in API Settings and optionally remembered in the browser). Restrict that key to your site's HTTP referrers in the Google Cloud Console.

## Excel file

Click **Download Template** to get an example workbook in the active language. Sheet and column names are read in either language:

| Sheet (TR / EN) | Required | Contents |
|---|---|---|
| `POI_LISTESI` / `POINTS` | yes | Points with latitude/longitude, assigned staff, duration, visit hours, monthly visit count or visit days |
| `ZIYARET_KURALLARI` / `VISIT_RULES` | no | Detailed rules; when a point has a row here, its visit columns on the points sheet are ignored |
| `PERSONEL_ARACLAR` / `RESOURCES` | yes | Staff/vehicles: work days, work hours, travel mode (`ARAC`/`DRIVING`, `YAYA`/`WALKING`) |
| `TATILLER` / `HOLIDAYS` | no | Extra days off or half days, for everyone or one staff member |

Coordinates are required: the app does not geocode addresses.

## Costs

Every visit sent to the Route Optimization API is billed, and the app asks for confirmation before sending. Set a quota or budget alert in the Google Cloud Console. See [pricing](https://developers.google.com/maps/billing-and-pricing/pricing).

## License

[MIT](LICENSE)

---

## Türkçe

Bir personelin bir dönemdeki saha ziyaretlerini planlayan ve her günün rotasını [Google Route Optimization API](https://developers.google.com/maps/documentation/route-optimization) ile optimize eden uygulama. Noktaları, ziyaret kurallarını ve çalışma günlerini Excel'de hazırlarsınız. Uygulama ziyaretleri günlere dağıtır, her günün en iyi sırasını Google'dan alır. Arayüz Türkçe ve İngilizce kullanılabilir.

### Özellikler

- Ziyaret kuralları: tek seferlik, günlük, haftalık, aylık (ayda N kez ya da belirli günler), N günde bir. Saat aralığı (zorunlu ya da esnek), ziyaret süresi, öncelik, zorunlu/isteğe bağlı ziyaret, izinli personel tanımlanabilir.
- Personel bazında çalışma günleri, yarım günler, Türkiye resmî tatilleri (2026–2027 tanımlı) ve özel izin günleri.
- Günü belirtilmemiş ziyaretler, yakınlığa göre ve günlük doluluk hedefini aşmadan mümkün olan en az güne toplanır.
- Her çalışma günü için tek araçlı ayrı bir istek gönderilir (Single Vehicle Routing olarak ücretlendirilir). Çözülen günler tarayıcıda saklanır; değişmeyen günler yeniden gönderilmez ve ücretlendirilmez.
- Araçlı veya yaya rotalar, isteğe bağlı başlangıç noktası ve dönüş, nokta başı park süresi, öğle molası.
- Günlük rotaları gösteren Google haritası, sonuç tabloları ve Excel'e aktarma.

### Google bağlantısı

Route Optimization API **API anahtarı kabul etmez**, OAuth gerektirir. İki kullanım yolu var:

1. **Yerel sunucu (önerilen):** [Node.js](https://nodejs.org/) 18 veya üstü gerekir.
   - Google Cloud'da Route Optimization API'yi etkinleştirin.
   - Bu API'yi çağırma yetkisi olan bir **servis hesabı** oluşturun ve JSON anahtarını indirin.
   - JSON dosyasını uygulama klasörüne (`server.js`'in yanına) koyun. Bu dosya git'e girmez ve tarayıcıya hiç gönderilmez.
   - `Baslat.bat` ile başlatın ve http://localhost:8765 adresini açın.
2. **Yalnızca tarayıcı (ör. GitHub Pages):** API Ayarları'na Google Cloud proje kimliğinizi ve `gcloud auth print-access-token` komutuyla aldığınız belirteci girin. Belirteç yaklaşık 1 saat geçerlidir ve saklanmaz. Tarayıcıdan doğrudan Google'a gider; sayfanın kendine ait bir sunucusu yoktur.
   - Kendi Google hesabınızla alınan belirteç, o bir saat boyunca hesabınızdaki **tüm Cloud yetkilerini** taşır. Daha güvenlisi, yalnızca Route Optimization API'yi çağırabilen bir servis hesabıdır (ör. *Route Optimization Editor* rolü). Kendi hesabınıza bu servis hesabı üzerinde *Service Account Token Creator* yetkisi verip belirteci şöyle alın:
     ```
     gcloud auth print-access-token --impersonate-service-account=AD@PROJE_KIMLIGI.iam.gserviceaccount.com
     ```
     Böyle bir belirteç sızsa bile yalnızca rota isteği için ve süresi dolana kadar kullanılabilir.

Harita isteğe bağlıdır ve ayrı bir Google Maps JavaScript API anahtarıyla çalışır. Bu anahtarı Google Cloud Console'da kendi site adresinize (HTTP referrer) kısıtlayın.

### Excel dosyası ve maliyet

- **Şablon İndir** düğmesi, seçili dilde örnek bir dosya üretir. Sayfa ve sütun adları iki dilde de okunur (yukarıdaki tabloya bakın).
- Koordinat zorunludur; uygulama adresten koordinat bulmaz.
- Route Optimization API'ye gönderilen her ziyaret ücretlendirilir. Uygulama göndermeden önce onay ister. Google Cloud Console'da kota veya bütçe uyarısı tanımlamanızı öneririz.

### Lisans

[MIT](LICENSE)
