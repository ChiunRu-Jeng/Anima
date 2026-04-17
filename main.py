"""Anima – Ad Platform Integration Service

Unified API bridging Facebook Ads, Google Ads, and QDM website backend.
"""
import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.integrations.qdm_backend import qdm_client
from config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    qdm_client.close()


app = FastAPI(
    title="Anima Ad Integration API",
    description=(
        "串接 **Facebook 廣告後台**、**Google 關鍵字廣告後台** 及 **QDM 官網後台** 的統一 API 服務。"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")


@app.get("/health", tags=["System"])
def health():
    return {"status": "ok", "env": settings.app_env}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.app_port, reload=True)
