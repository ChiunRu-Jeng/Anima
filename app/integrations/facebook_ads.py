"""Facebook Ads (Meta Marketing API) integration."""
from __future__ import annotations

import logging
from typing import Optional

from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.adobjects.adset import AdSet
from facebook_business.adobjects.campaign import Campaign
from facebook_business.api import FacebookAdsApi

from config import settings
from app.models.campaign import AdInsight, CampaignSummary

logger = logging.getLogger(__name__)


def _init_api() -> None:
    FacebookAdsApi.init(
        app_id=settings.fb_app_id,
        app_secret=settings.fb_app_secret,
        access_token=settings.fb_access_token,
    )


def get_campaigns(account_id: Optional[str] = None) -> list[CampaignSummary]:
    """Return all campaigns for the given ad account."""
    _init_api()
    acct_id = account_id or settings.fb_ad_account_id
    account = AdAccount(acct_id)

    fields = [
        Campaign.Field.id,
        Campaign.Field.name,
        Campaign.Field.status,
        Campaign.Field.daily_budget,
        Campaign.Field.lifetime_budget,
    ]
    campaigns = account.get_campaigns(fields=fields)

    results: list[CampaignSummary] = []
    for c in campaigns:
        results.append(
            CampaignSummary(
                platform="facebook",
                campaign_id=c.get(Campaign.Field.id, ""),
                campaign_name=c.get(Campaign.Field.name, ""),
                status=c.get(Campaign.Field.status, ""),
                budget=float(c.get(Campaign.Field.daily_budget) or c.get(Campaign.Field.lifetime_budget) or 0) / 100,
            )
        )
    return results


def get_insights(
    date_preset: str = "last_7d",
    account_id: Optional[str] = None,
) -> list[AdInsight]:
    """Return daily ad insights for the account."""
    _init_api()
    acct_id = account_id or settings.fb_ad_account_id
    account = AdAccount(acct_id)

    params = {
        "date_preset": date_preset,
        "time_increment": 1,
        "level": "account",
    }
    fields = ["date_start", "impressions", "clicks", "spend", "actions", "ctr", "cpc"]

    insights = account.get_insights(fields=fields, params=params)

    results: list[AdInsight] = []
    for row in insights:
        actions = row.get("actions", [])
        conversions = sum(
            int(a.get("value", 0))
            for a in actions
            if a.get("action_type") in ("offsite_conversion.fb_pixel_purchase", "purchase")
        )
        results.append(
            AdInsight(
                platform="facebook",
                date=row.get("date_start", ""),
                impressions=int(row.get("impressions", 0)),
                clicks=int(row.get("clicks", 0)),
                spend=float(row.get("spend", 0)),
                conversions=conversions,
                ctr=float(row.get("ctr", 0)),
                cpc=float(row.get("cpc", 0)),
            )
        )
    return results


def get_campaign_spend(
    campaign_id: str,
    date_preset: str = "last_7d",
) -> AdInsight:
    """Return aggregated spend insight for a single campaign."""
    _init_api()
    campaign = Campaign(campaign_id)
    params = {"date_preset": date_preset, "level": "campaign"}
    fields = ["impressions", "clicks", "spend", "ctr", "cpc"]
    rows = list(campaign.get_insights(fields=fields, params=params))
    if not rows:
        return AdInsight(platform="facebook", date=date_preset)
    row = rows[0]
    return AdInsight(
        platform="facebook",
        date=date_preset,
        impressions=int(row.get("impressions", 0)),
        clicks=int(row.get("clicks", 0)),
        spend=float(row.get("spend", 0)),
        ctr=float(row.get("ctr", 0)),
        cpc=float(row.get("cpc", 0)),
    )
