"""Market Map module — Mapa Empresarial (inteligencia territorial + sectorial).

Proxies de solo lectura hacia los motores publicos de Intel: business-demography
(demografia nacional), geo-intelligence (territorio), sector-intelligence-v2
(sector) y cross-intelligence (cruce sector x territorio). Todos los endpoints
de Intel consumidos aqui son `/api/v1/public/*` - no requieren service-key ni
JWT en Intel, asi que este modulo se expone en Beta tambien sin autenticacion
(mismo criterio que `/resultados`: inteligencia de mercado de lectura, sin
datos de la organizacion del usuario).

Politica de error (R15 - empty honesto, mismo patron que
`copilot.intel_ficha_proxies`): timeout o fallo upstream -> `None`/lista vacia,
nunca 500. El front decide como degradar (badge "sin dato" / seccion oculta).

Endpoints canonicos:
  - GET /api/market-map/national                                KPIs + evolucion nacional
  - GET /api/market-map/territories                              ranking de territorios
  - GET /api/market-map/territory/{level}/{code}                 ficha de un territorio
  - GET /api/market-map/sectors                                  ranking de sectores
  - GET /api/market-map/sectors/emerging                         sectores emergentes (senal real, granularidad CNAE)
  - GET /api/market-map/cross/sectors-in/{geo_level}/{geo_code}   sectores que impulsan un territorio
  - GET /api/market-map/cross/territory-for/{cnae_section}        territorios donde un sector concentra
"""
