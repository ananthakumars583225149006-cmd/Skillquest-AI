"""
Re-export courses router for compatibility with app/routers/ path.
"""
from ..routes.courses import router

__all__ = ["router"]
