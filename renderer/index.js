const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "screenshots");
const BASE_URL = "http://bbussell.com/ScenicCity.html?scroll_speed=0&night=";
const STEPS = 12;

(async () => {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 5120, height: 2880 }); // 5k (going for an award on that one site)

  for (let i = 0; i < STEPS; i++) {
    const nightValue = (i / (STEPS - 1)).toFixed(2);
    const url = `${BASE_URL}${nightValue}`;
    await page.goto(url, { waitUntil: "networkidle2" });

    
    await page.waitForTimeout(500); 

    const filename = `wallpaper_${i.toString().padStart(2, "0")}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    await page.screenshot({ path: filepath });
    console.log(`✔ Saved ${filename} from ${url}`);
  }

  await browser.close();
})();