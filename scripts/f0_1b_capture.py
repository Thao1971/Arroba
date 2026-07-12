"""Captura ZIP + implementación + overlay directo con Playwright.

Se ejecuta con: `python3 /app/scripts/f0_1b_capture.py`.
Requiere `playwright` instalado (ya presente por el proyecto de tests).
"""
import asyncio
import subprocess
from pathlib import Path

from playwright.async_api import async_playwright

OUT = Path("/app/memory/sources/empresa_v1/F0_1b_REFERENCE")
OUT.mkdir(parents=True, exist_ok=True)

ZIP_URL = "http://127.0.0.1:8765/Empresa.html"
IMPL_ROOT = "https://musing-hellman-9.preview.emergentagent.com"
IMPL_URL = f"{IMPL_ROOT}/empresa-f01/B47820150"


async def capture():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # -------- ZIP --------
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, ignore_https_errors=True)
        page = await ctx.new_page()
        await page.goto(ZIP_URL, wait_until="domcontentloaded", timeout=45000)
        await page.wait_for_timeout(6000)
        await page.screenshot(path=str(OUT / "zip_viewport_1440x900.png"), full_page=False)
        await page.screenshot(path=str(OUT / "zip_fullpage.png"), full_page=True)
        print("zip capturado")
        await ctx.close()

        # -------- Implementación --------
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, ignore_https_errors=True)
        page = await ctx.new_page()
        # login
        await page.goto(IMPL_ROOT, wait_until="domcontentloaded", timeout=30000)
        await page.evaluate(
            """async () => {
                await fetch('/api/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email:'buyer@arroba.com', password:'Arroba2026!'}), credentials:'include'});
            }"""
        )
        await page.goto(IMPL_URL, wait_until="domcontentloaded", timeout=45000)
        await page.wait_for_selector('[data-testid="ficha-f01-root"]', timeout=20000)
        await page.wait_for_timeout(2500)
        await page.evaluate("window.scrollTo(0,0)")
        await page.screenshot(path=str(OUT / "impl_viewport_1440x900.png"), full_page=False)
        await page.screenshot(path=str(OUT / "impl_fullpage.png"), full_page=True)
        print("impl capturado")
        await ctx.close()
        await browser.close()


async def main():
    await capture()


if __name__ == "__main__":
    asyncio.run(main())
