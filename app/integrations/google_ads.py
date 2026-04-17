"""Google Ads (Keyword Ads) integration."""
from __future__ import annotations

import logging
from typing import Optional

from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

from config import settings
from app.models.campaign import AdInsight, CampaignSummary, KeywordStat

logger = logging.getLogger(__name__)


def _build_client() -> GoogleAdsClient:
    credentials = {
        "developer_token": settings.google_ads_developer_token,
        "client_id": settings.google_ads_client_id,
        "client_secret": settings.google_ads_client_secret,
        "refresh_token": settings.google_ads_refresh_token,
        "use_proto_plus": True,
    }
    if settings.google_ads_login_customer_id:
        credentials["login_customer_id"] = settings.google_ads_login_customer_id
    return GoogleAdsClient.load_from_dict(credentials)


def _customer_id() -> str:
    return settings.google_ads_customer_id.replace("-", "")


def get_campaigns(customer_id: Optional[str] = None) -> list[CampaignSummary]:
    """Return all active/paused campaigns for the customer."""
    client = _build_client()
    ga_service = client.get_service("GoogleAdsService")
    cid = (customer_id or _customer_id()).replace("-", "")

    query = """
        SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign_budget.amount_micros,
            metrics.cost_micros,
            metrics.impressions,
            metrics.clicks,
            metrics.conversions,
            metrics.ctr,
            metrics.average_cpc
        FROM campaign
        WHERE campaign.status IN ('ENABLED', 'PAUSED')
        ORDER BY metrics.cost_micros DESC
        LIMIT 50
    """

    results: list[CampaignSummary] = []
    try:
        response = ga_service.search(customer_id=cid, query=query)
        for row in response:
            c = row.campaign
            m = row.metrics
            b = row.campaign_budget
            results.append(
                CampaignSummary(
                    platform="google",
                    campaign_id=str(c.id),
                    campaign_name=c.name,
                    status=c.status.name,
                    budget=b.amount_micros / 1_000_000,
                    spend=m.cost_micros / 1_000_000,
                    impressions=int(m.impressions),
                    clicks=int(m.clicks),
                    conversions=int(m.conversions),
                    ctr=round(m.ctr * 100, 2),
                    cpc=m.average_cpc / 1_000_000,
                )
            )
    except GoogleAdsException as ex:
        logger.error("Google Ads API error: %s", ex)
        raise
    return results


def get_keyword_stats(
    customer_id: Optional[str] = None,
    date_range: str = "LAST_7_DAYS",
) -> list[KeywordStat]:
    """Return keyword-level performance stats."""
    client = _build_client()
    ga_service = client.get_service("GoogleAdsService")
    cid = (customer_id or _customer_id()).replace("-", "")

    query = f"""
        SELECT
            ad_group_criterion.keyword.text,
            ad_group_criterion.keyword.match_type,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.average_cpc,
            ad_group_criterion.quality_info.quality_score
        FROM keyword_view
        WHERE segments.date DURING {date_range}
          AND ad_group_criterion.status != 'REMOVED'
        ORDER BY metrics.cost_micros DESC
        LIMIT 100
    """

    results: list[KeywordStat] = []
    try:
        response = ga_service.search(customer_id=cid, query=query)
        for row in response:
            kw = row.ad_group_criterion.keyword
            m = row.metrics
            qi = row.ad_group_criterion.quality_info
            results.append(
                KeywordStat(
                    keyword=kw.text,
                    match_type=kw.match_type.name,
                    impressions=int(m.impressions),
                    clicks=int(m.clicks),
                    spend=m.cost_micros / 1_000_000,
                    avg_cpc=m.average_cpc / 1_000_000,
                    quality_score=qi.quality_score if qi.quality_score else None,
                )
            )
    except GoogleAdsException as ex:
        logger.error("Google Ads API error: %s", ex)
        raise
    return results


def get_daily_insights(
    customer_id: Optional[str] = None,
    date_range: str = "LAST_7_DAYS",
) -> list[AdInsight]:
    """Return account-level daily insights."""
    client = _build_client()
    ga_service = client.get_service("GoogleAdsService")
    cid = (customer_id or _customer_id()).replace("-", "")

    query = f"""
        SELECT
            segments.date,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr,
            metrics.average_cpc
        FROM customer
        WHERE segments.date DURING {date_range}
        ORDER BY segments.date DESC
    """

    results: list[AdInsight] = []
    try:
        response = ga_service.search(customer_id=cid, query=query)
        for row in response:
            m = row.metrics
            results.append(
                AdInsight(
                    platform="google",
                    date=row.segments.date,
                    impressions=int(m.impressions),
                    clicks=int(m.clicks),
                    spend=m.cost_micros / 1_000_000,
                    conversions=int(m.conversions),
                    ctr=round(m.ctr * 100, 2),
                    cpc=m.average_cpc / 1_000_000,
                )
            )
    except GoogleAdsException as ex:
        logger.error("Google Ads API error: %s", ex)
        raise
    return results
