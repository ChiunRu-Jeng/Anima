"""Unified API routes for all platform integrations."""
from __future__ import annotations

import asyncio
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.concurrency import run_in_threadpool

from app.integrations import facebook_ads, google_ads, qdm_backend
from app.models.campaign import (
    AdInsight,
    CampaignSummary,
    DashboardReport,
    KeywordStat,
    QdmProduct,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Facebook Ads ──────────────────────────────────────────────────────────────

@router.get("/facebook/campaigns", response_model=list[CampaignSummary], tags=["Facebook Ads"])
def fb_campaigns(account_id: Optional[str] = Query(None, description="覆蓋預設廣告帳號 ID")):
    try:
        return facebook_ads.get_campaigns(account_id=account_id)
    except Exception as e:
        logger.exception("FB campaigns error")
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/facebook/insights", response_model=list[AdInsight], tags=["Facebook Ads"])
def fb_insights(
    date_preset: str = Query("last_7d", description="例如 last_7d / last_30d / this_month"),
    account_id: Optional[str] = Query(None),
):
    try:
        return facebook_ads.get_insights(date_preset=date_preset, account_id=account_id)
    except Exception as e:
        logger.exception("FB insights error")
        raise HTTPException(status_code=502, detail=str(e))


@router.get(
    "/facebook/campaigns/{campaign_id}/spend",
    response_model=AdInsight,
    tags=["Facebook Ads"],
)
def fb_campaign_spend(
    campaign_id: str,
    date_preset: str = Query("last_7d"),
):
    try:
        return facebook_ads.get_campaign_spend(campaign_id, date_preset)
    except Exception as e:
        logger.exception("FB campaign spend error")
        raise HTTPException(status_code=502, detail=str(e))


# ── Google Ads ────────────────────────────────────────────────────────────────

@router.get("/google/campaigns", response_model=list[CampaignSummary], tags=["Google Ads"])
def google_campaigns(customer_id: Optional[str] = Query(None, description="覆蓋預設 Customer ID")):
    try:
        return google_ads.get_campaigns(customer_id=customer_id)
    except Exception as e:
        logger.exception("Google campaigns error")
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/google/keywords", response_model=list[KeywordStat], tags=["Google Ads"])
def google_keywords(
    date_range: str = Query("LAST_7_DAYS", description="GAQL 日期範圍，例如 LAST_7_DAYS / LAST_30_DAYS"),
    customer_id: Optional[str] = Query(None),
):
    try:
        return google_ads.get_keyword_stats(customer_id=customer_id, date_range=date_range)
    except Exception as e:
        logger.exception("Google keywords error")
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/google/insights", response_model=list[AdInsight], tags=["Google Ads"])
def google_insights(
    date_range: str = Query("LAST_7_DAYS"),
    customer_id: Optional[str] = Query(None),
):
    try:
        return google_ads.get_daily_insights(customer_id=customer_id, date_range=date_range)
    except Exception as e:
        logger.exception("Google insights error")
        raise HTTPException(status_code=502, detail=str(e))


# ── QDM Backend ───────────────────────────────────────────────────────────────

@router.get("/qdm/products", response_model=list[QdmProduct], tags=["QDM Backend"])
def qdm_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    status: str = Query("active"),
):
    try:
        return qdm_backend.qdm_client.get_products(page=page, per_page=per_page, status=status)
    except Exception as e:
        logger.exception("QDM products error")
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/qdm/products/{product_id}", response_model=QdmProduct, tags=["QDM Backend"])
def qdm_product(product_id: str):
    try:
        return qdm_backend.qdm_client.get_product(product_id)
    except Exception as e:
        logger.exception("QDM product error")
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/qdm/orders/summary", tags=["QDM Backend"])
def qdm_order_summary(
    start_date: str = Query(..., description="YYYY-MM-DD"),
    end_date: str = Query(..., description="YYYY-MM-DD"),
):
    try:
        return qdm_backend.qdm_client.get_order_summary(start_date, end_date)
    except Exception as e:
        logger.exception("QDM order summary error")
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/qdm/traffic", tags=["QDM Backend"])
def qdm_traffic(
    start_date: str = Query(..., description="YYYY-MM-DD"),
    end_date: str = Query(..., description="YYYY-MM-DD"),
):
    try:
        return qdm_backend.qdm_client.get_traffic_stats(start_date, end_date)
    except Exception as e:
        logger.exception("QDM traffic error")
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/qdm/site-info", tags=["QDM Backend"])
def qdm_site_info():
    try:
        return qdm_backend.qdm_client.get_site_info()
    except Exception as e:
        logger.exception("QDM site info error")
        raise HTTPException(status_code=502, detail=str(e))


# ── Unified Dashboard ─────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardReport, tags=["Dashboard"])
async def dashboard(
    fb_date_preset: str = Query("last_7d"),
    google_date_range: str = Query("LAST_7_DAYS"),
):
    """Aggregate data from all three platforms into a single report (parallel fetch)."""
    fb_result, google_result, qdm_result = await asyncio.gather(
        run_in_threadpool(facebook_ads.get_campaigns),
        run_in_threadpool(google_ads.get_campaigns),
        run_in_threadpool(qdm_backend.qdm_client.get_products),
        return_exceptions=True,
    )

    report = DashboardReport(date_range=fb_date_preset)

    if isinstance(fb_result, Exception):
        logger.warning("Facebook fetch failed: %s", fb_result)
    else:
        report.facebook = fb_result

    if isinstance(google_result, Exception):
        logger.warning("Google fetch failed: %s", google_result)
    else:
        report.google = google_result

    if isinstance(qdm_result, Exception):
        logger.warning("QDM fetch failed: %s", qdm_result)
    else:
        report.qdm_products = qdm_result

    all_campaigns = report.facebook + report.google
    report.total_spend = round(sum(c.spend or 0 for c in all_campaigns), 2)
    report.total_impressions = sum(c.impressions or 0 for c in all_campaigns)
    report.total_clicks = sum(c.clicks or 0 for c in all_campaigns)
    report.total_conversions = sum(c.conversions or 0 for c in all_campaigns)

    return report
