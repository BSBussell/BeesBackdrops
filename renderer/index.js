const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "screenshots");
const BASE_URL = "http://localhost:8081/ScenicCity.html?scroll_speed=0&night=";
const STEPS = 12;

(async () => {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 5120, height: 2880 }); // 5k (going for an award on that one site)

  const dynamicEntries = [];

  for (let i = 0; i < STEPS; i++) {
    const nightValue = (i / (STEPS - 1)).toFixed(2);
    const url = `${BASE_URL}${nightValue}`;
    await page.goto(url, { waitUntil: "networkidle2" });

    
    await new Promise(resolve => setTimeout(resolve, 2000));

    const filename = `wallpaper_${i.toString().padStart(2, "0")}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    await page.screenshot({ path: filepath });
    console.log(`✔ Saved ${filename} from ${url}`);

    // Map night (0.0 to 1.0) to time of day using:
    // 12PM (0.0), 6PM (0.5), 12AM (1.0), 6AM (0.5), 12PM (0.0)
    const night = i / (STEPS - 1);
    const morningHour = Math.round((12 - night * 12 + 24) % 24); // 12PM → 6AM → 12AM
    const eveningHour = Math.round((12 + night * 12) % 24);      // 12PM → 6PM → 12AM

    const morningTimeISO = `2020-01-01T${morningHour.toString().padStart(2, "0")}:00:00Z`;
    const eveningTimeISO = `2020-01-01T${eveningHour.toString().padStart(2, "0")}:00:00Z`;

    if (i === 0) {
      dynamicEntries.push({
        fileName: filename,
        time: morningTimeISO,
        isPrimary: true,
        isForLight: true
      });
    } else if (i === STEPS - 1) {
      dynamicEntries.push({
        fileName: filename,
        time: eveningTimeISO,
        isForDark: true
      });
    } else {
      dynamicEntries.push(
        {
          fileName: filename,
          time: morningTimeISO
        },
        {
          fileName: filename,
          time: eveningTimeISO
        }
      );
    }
  }

  await browser.close();

  const dynamicJson = {
    solar: false,
    images: dynamicEntries
  };
  const DYNAMIC_JSON_PATH = path.join(__dirname, "dynamic.json");
  fs.writeFileSync(DYNAMIC_JSON_PATH, JSON.stringify(dynamicJson, null, 2));
  console.log(`✔ Generated dynamic.json with ${STEPS} entries`);
})();