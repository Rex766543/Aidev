from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.limiter import limiter
from app.routers import essentia, health
from app.routers import tracks, analyses, trial_history, styles

app = FastAPI(
    title="Essentia App API",
    description="Audio analysis API powered by Essentia",
    version="0.1.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(essentia.router, prefix="/essentia", tags=["essentia"])
app.include_router(tracks.router, prefix="/api/tracks", tags=["tracks"])
app.include_router(analyses.router, prefix="/api/analyses", tags=["analyses"])
app.include_router(trial_history.router, prefix="/api/my/history", tags=["history"])
app.include_router(styles.router, prefix="/api/styles", tags=["styles"])


@app.get("/")
async def root():
    return {"message": "Essentia App API is running"}
