from fastapi import APIRouter

from mars_analog.api.responses import APIError, Store, envelope
from mars_analog.schemas import Envelope, Provenance

router = APIRouter(tags=["provenance"])


@router.get("/provenance/{provenance_id}", response_model=Envelope[Provenance])
def get_provenance(provenance_id: str, store: Store):
    record = store.provenance(provenance_id)
    if record is None:
        raise APIError(404, "provenance_not_found", f"Provenance {provenance_id!r} not found")
    return envelope(record, store, provenance_ids=[record.provenance_id])
