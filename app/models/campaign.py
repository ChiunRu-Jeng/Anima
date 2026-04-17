from __future__ import annotations
from pydantic import BaseModel
from typing import Optional


class CampaignSummary(BaseModel):
    platform: str
    campaign_id: str
    campaign_name: str
    status: str
    budget: Optional[float] = None
    spend: Optional[float] = None
    impressions: Optional[int] = None
    clicks: Optional[int] = None
    conversions: Optional[int] = None
    ctr: Optional[float] = None
    cpc: Optional[float] = None
    currency: str = "TWD"


class AdInsight(BaseModel):
    platform: str
    date: str
    impressions: int = 0
    clicks: int = 0
    spend: float = 0.0
    conversions: int = 0
    ctr: float = 0.0
    cpc: float = 0.0


class KeywordStat(BaseModel):
    keyword: str
    match_type: str
    impressions: int = 0
    clicks: int = 0
    spend: float = 0.0
    avg_cpc: float = 0.0
    quality_score: Optional[int] = None


class QdmProduct(BaseModel):
    product_id: str
    name: str
    url: str
    price: Optional[float] = None
    stock: Optional[int] = None
    status: str = "active"


class DashboardReport(BaseModel):
    date_range: str
    facebook: list[CampaignSummary] = []
    google: list[CampaignSummary] = []
    qdm_products: list[QdmProduct] = []
    total_spend: float = 0.0
    total_impressions: int = 0
    total_clicks: int = 0
    total_conversions: int = 0
