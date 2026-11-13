from fastapi import APIRouter

from mars_analog import limitations as catalog
from mars_analog.api.responses import Store, envelope
from mars_analog.schemas import Envelope, Limitation

router = APIRouter(tags=["limitations"])


@router.get("/limitations", response_model=Envelope[list[Limitation]])
def list_limitations(store: Store):
    return envelope(catalog.all_limitations(), store)
