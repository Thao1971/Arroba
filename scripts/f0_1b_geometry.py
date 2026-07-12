"""Extrae geometrías reales de zonas clave en ZIP e impl para F0.1b.

Reporta bounding boxes (x, y, w, h) de:
 - Topbar completo
 - Company header block completo
 - Deal banner completo
 - Section-nav (sidebar)
 - Content column
 - Deal panel (derecha)
 - Composer stub (impl) / composer widget (zip)

Se ejecuta con `python3 /app/scripts/f0_1b_geometry.py`.
"""
import asyncio
import json
from pathlib import Path

from playwright.async_api import async_playwright

ZIP_URL = "http://127.0.0.1:8765/Empresa.html"
IMPL_ROOT = "https://musing-hellman-9.preview.emergentagent.com"
IMPL_URL = f"{IMPL_ROOT}/empresa-f01/B47820150"


async def zip_metrics(page):
    """Selectores del ZIP: derivan del ce-app.jsx (structural children de #root > div)."""
    return await page.evaluate("""() => {
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height)};
      };
      const outer = document.getElementById('root')?.firstElementChild;
      if (!outer) return {};
      const nav = outer.querySelector('nav');
      const kids = Array.from(outer.children);
      // outer.children:  [nav topbar, div company-header, div deal-banner, div main-grid]
      const companyHeader = kids[1] || null;
      const dealBanner = kids[2] || null;
      const mainGrid = kids[3] || null;
      let sidebar = null, content = null, dealPanel = null;
      if (mainGrid) {
        sidebar = mainGrid.children[0] || null;
        content = mainGrid.children[1] || null;
        dealPanel = mainGrid.children[2] || null;
      }
      // Composer widget: buscar cualquier fixed elem visible
      const composer = document.querySelector('.arroba-composer, [class*="composer"], #composer, [data-composer]');
      return {
        topbar: rect(nav),
        companyHeader: rect(companyHeader),
        dealBanner: rect(dealBanner),
        mainGrid: rect(mainGrid),
        sidebar: rect(sidebar),
        content: rect(content),
        dealPanel: rect(dealPanel),
        composer: rect(composer),
        gridComputedCols: mainGrid ? getComputedStyle(mainGrid).gridTemplateColumns : null,
        gridComputedGap: mainGrid ? getComputedStyle(mainGrid).gap : null,
      };
    }""")


async def impl_metrics(page):
    return await page.evaluate("""() => {
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height)};
      };
      const grid = document.querySelector('[data-testid="ficha-main-grid"]');
      const kids = grid ? Array.from(grid.children) : [];
      return {
        topbar: rect(document.querySelector('[data-testid="ficha-topbar"]')),
        companyHeader: rect(document.querySelector('[data-testid="ficha-company-header"]')),
        dealBanner: rect(document.querySelector('[data-testid="ficha-deal-banner"]')),
        mainGrid: rect(grid),
        sidebar: rect(document.querySelector('[data-testid="ficha-section-nav"]')),
        content: rect(document.querySelector('[data-testid="ficha-content"]')),
        dealPanel: rect(document.querySelector('[data-testid="ficha-deal-panel"]')),
        composer: rect(document.querySelector('[data-testid="ficha-composer-stub"]')),
        gridComputedCols: grid ? getComputedStyle(grid).gridTemplateColumns : null,
        gridComputedGap: grid ? getComputedStyle(grid).gap : null,
      };
    }""")


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # ZIP
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, ignore_https_errors=True)
        page = await ctx.new_page()
        await page.goto(ZIP_URL, wait_until="domcontentloaded", timeout=45000)
        await page.wait_for_timeout(6000)
        zip_m = await zip_metrics(page)
        await ctx.close()
        # Impl
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, ignore_https_errors=True)
        page = await ctx.new_page()
        await page.goto(IMPL_ROOT, wait_until="domcontentloaded", timeout=30000)
        await page.evaluate(
            """async () => {
                await fetch('/api/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email:'buyer@arroba.com', password:'Arroba2026!'}), credentials:'include'});
            }"""
        )
        await page.goto(IMPL_URL, wait_until="domcontentloaded", timeout=45000)
        await page.wait_for_selector('[data-testid="ficha-f01-root"]', timeout=15000)
        await page.wait_for_timeout(2000)
        impl_m = await impl_metrics(page)
        await ctx.close()
        await browser.close()

        # Compute deltas
        print("=" * 72)
        print(f"{'Zone':<18}{'ZIP (x,y,w,h)':<28}{'IMPL (x,y,w,h)':<28}{'Δpos':<10}")
        print("=" * 72)
        rows = []
        for key in ["topbar", "companyHeader", "dealBanner", "mainGrid", "sidebar", "content", "dealPanel", "composer"]:
            z = zip_m.get(key)
            i = impl_m.get(key)
            def fmt(r):
                return f"({r['x']},{r['y']},{r['w']},{r['h']})" if r else "—"
            def delta(a, b):
                if not a or not b:
                    return "—"
                dx = abs(a['x'] - b['x'])
                dy = abs(a['y'] - b['y'])
                dw = abs(a['w'] - b['w'])
                dh = abs(a['h'] - b['h'])
                return f"Δx={dx} Δy={dy} Δw={dw} Δh={dh}"
            row = f"{key:<18}{fmt(z):<28}{fmt(i):<28}{delta(z,i):<10}"
            print(row)
            rows.append((key, z, i))
        print()
        print(f"ZIP grid cols:  {zip_m.get('gridComputedCols')}  gap={zip_m.get('gridComputedGap')}")
        print(f"IMPL grid cols: {impl_m.get('gridComputedCols')}  gap={impl_m.get('gridComputedGap')}")
        # Save JSON
        out = {"zip": zip_m, "impl": impl_m}
        Path("/app/memory/sources/empresa_v1/F0_1b_REFERENCE/geometry.json").write_text(json.dumps(out, indent=2))
        print("\nsaved geometry.json")


if __name__ == "__main__":
    asyncio.run(main())
