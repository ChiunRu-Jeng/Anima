"""QDM 官網後台 integration.

Connects to the QDM CMS/e-commerce backend via its REST API.
Supports token-based auth with automatic re-login on expiry.
"""
from __future__ import annotations

import logging
from typing import Any, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from config import settings
from app.models.campaign import QdmProduct

logger = logging.getLogger(__name__)

_token_cache: dict[str, str] = {}


class QdmClient:
    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = (base_url or settings.qdm_base_url).rstrip("/")
        self.api_key = api_key or settings.qdm_api_key
        self._token: str = ""
        self._client = httpx.Client(timeout=30)

    def close(self) -> None:
        self._client.close()

    # ── Auth ──────────────────────────────────────────────────────────────

    def _auth_headers(self) -> dict[str, str]:
        headers: dict[str, str] = {"Accept": "application/json"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        elif self._token:
            headers["Authorization"] = f"Bearer {self._token}"
        return headers

    def login(self) -> str:
        """Obtain a session token via username/password login."""
        resp = self._client.post(
            f"{self.base_url}/api/auth/login",
            json={"username": settings.qdm_username, "password": settings.qdm_password},
        )
        resp.raise_for_status()
        data = resp.json()
        self._token = data.get("token") or data.get("access_token", "")
        logger.info("QDM login successful")
        return self._token

    def _ensure_auth(self) -> None:
        if not self.api_key and not self._token:
            self.login()

    # ── Generic request ───────────────────────────────────────────────────

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=8))
    def _get(self, path: str, params: Optional[dict] = None) -> Any:
        self._ensure_auth()
        resp = self._client.get(
            f"{self.base_url}{path}",
            headers=self._auth_headers(),
            params=params,
        )
        if resp.status_code == 401:
            self._token = ""
            self.login()
            resp = self._client.get(
                f"{self.base_url}{path}",
                headers=self._auth_headers(),
                params=params,
            )
        resp.raise_for_status()
        return resp.json()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=8))
    def _post(self, path: str, payload: dict) -> Any:
        self._ensure_auth()
        resp = self._client.post(
            f"{self.base_url}{path}",
            headers={**self._auth_headers(), "Content-Type": "application/json"},
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()

    # ── Products ──────────────────────────────────────────────────────────

    def get_products(
        self,
        page: int = 1,
        per_page: int = 50,
        status: str = "active",
    ) -> list[QdmProduct]:
        """Fetch product list from QDM website backend."""
        data = self._get(
            "/api/products",
            params={"page": page, "per_page": per_page, "status": status},
        )
        items = data if isinstance(data, list) else data.get("data", data.get("items", []))
        return [
            QdmProduct(
                product_id=str(item.get("id") or item.get("product_id", "")),
                name=item.get("name") or item.get("title", ""),
                url=item.get("url") or item.get("permalink", ""),
                price=float(item["price"]) if item.get("price") is not None else None,
                stock=int(item["stock"]) if item.get("stock") is not None else None,
                status=item.get("status", "active"),
            )
            for item in items
        ]

    def get_product(self, product_id: str) -> QdmProduct:
        item = self._get(f"/api/products/{product_id}")
        return QdmProduct(
            product_id=str(item.get("id") or item.get("product_id", "")),
            name=item.get("name") or item.get("title", ""),
            url=item.get("url") or item.get("permalink", ""),
            price=float(item["price"]) if item.get("price") is not None else None,
            stock=int(item["stock"]) if item.get("stock") is not None else None,
            status=item.get("status", "active"),
        )

    # ── Orders / Reports ──────────────────────────────────────────────────

    def get_order_summary(self, start_date: str, end_date: str) -> dict:
        """Return order summary for a date range (YYYY-MM-DD)."""
        return self._get(
            "/api/orders/summary",
            params={"start_date": start_date, "end_date": end_date},
        )

    def get_traffic_stats(self, start_date: str, end_date: str) -> dict:
        """Return website traffic statistics for a date range."""
        return self._get(
            "/api/analytics/traffic",
            params={"start_date": start_date, "end_date": end_date},
        )

    # ── Site Settings ─────────────────────────────────────────────────────

    def get_site_info(self) -> dict:
        return self._get("/api/site/info")


# Module-level singleton
qdm_client = QdmClient()
