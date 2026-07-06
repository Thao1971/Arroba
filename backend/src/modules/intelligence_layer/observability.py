"""Observabilidad del intelligence_layer — Prometheus registry aislado.

Métricas canónicas (Decisión 0.1.3). Nombres finales, no renombrar sin bump de contrato:

    intelligence_layer_requests_total{provider,engine,method,status}       Counter
    intelligence_layer_request_duration_seconds{provider,engine,method}   Histogram
    intelligence_layer_cache_hits_total{engine,layer}                     Counter
    intelligence_layer_cache_misses_total{engine,layer}                   Counter
    intelligence_layer_circuit_breaker_state{provider,engine}             Gauge
    intelligence_layer_errors_total{provider,engine,error_class}          Counter
    intelligence_layer_deduplication_hits_total{engine}                   Counter

El estado del breaker se codifica como Gauge: 0=closed · 1=half_open · 2=open.
"""
from __future__ import annotations

from prometheus_client import (
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)

# Registry aislado (no contamina el default global; el endpoint /metrics
# expone SOLO estas métricas, no las de otros collectors del proceso).
REGISTRY = CollectorRegistry()

# ---------- Latencia / throughput ----------
requests_total = Counter(
    "intelligence_layer_requests_total",
    "Peticiones totales a un motor del intelligence_layer.",
    labelnames=("provider", "engine", "method", "status"),
    registry=REGISTRY,
)

request_duration_seconds = Histogram(
    "intelligence_layer_request_duration_seconds",
    "Latencia end-to-end de una petición a un motor (incluye caché).",
    labelnames=("provider", "engine", "method"),
    # Buckets pensados para APIs de 50ms-30s (Master <300ms, Financial <1s...)
    buckets=(0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0),
    registry=REGISTRY,
)

# ---------- Caché ----------
cache_hits_total = Counter(
    "intelligence_layer_cache_hits_total",
    "Hits de caché por motor y capa (memory|mongo).",
    labelnames=("engine", "layer"),
    registry=REGISTRY,
)

cache_misses_total = Counter(
    "intelligence_layer_cache_misses_total",
    "Misses de caché por motor y capa.",
    labelnames=("engine", "layer"),
    registry=REGISTRY,
)

deduplication_hits_total = Counter(
    "intelligence_layer_deduplication_hits_total",
    "Peticiones que se pegaron a un in-flight existente (single-flight).",
    labelnames=("engine",),
    registry=REGISTRY,
)

# ---------- Errores ----------
errors_total = Counter(
    "intelligence_layer_errors_total",
    "Errores de motor clasificados por tipo.",
    labelnames=("provider", "engine", "error_class"),
    registry=REGISTRY,
)

# ---------- Circuit Breaker ----------
circuit_breaker_state = Gauge(
    "intelligence_layer_circuit_breaker_state",
    "Estado del breaker: 0=closed, 1=half_open, 2=open.",
    labelnames=("provider", "engine"),
    registry=REGISTRY,
)

# Mapeo canónico estado→número (usado por circuit_breaker.py).
BREAKER_STATE_CODE = {"closed": 0, "half_open": 1, "open": 2}


def render_metrics() -> tuple[bytes, str]:
    """Devuelve (body, content_type) listos para responder el endpoint."""
    return generate_latest(REGISTRY), CONTENT_TYPE_LATEST


__all__ = [
    "REGISTRY",
    "BREAKER_STATE_CODE",
    "requests_total",
    "request_duration_seconds",
    "cache_hits_total",
    "cache_misses_total",
    "deduplication_hits_total",
    "errors_total",
    "circuit_breaker_state",
    "render_metrics",
]
