from fastapi import APIRouter

from mars_analog.api.responses import APIError, Store, envelope
from mars_analog.schemas import Dataset, Envelope

router = APIRouter(tags=["datasets"])


@router.get("/datasets", response_model=Envelope[list[Dataset]])
def list_datasets(store: Store):
    items = store.datasets()
    codes = [code for d in items for code in d.known_limitations]
    return envelope(items, store, codes)


@router.get("/datasets/{dataset_id}", response_model=Envelope[Dataset])
def get_dataset(dataset_id: str, store: Store):
    item = store.dataset(dataset_id)
    if item is None:
        raise APIError(404, "dataset_not_found", f"Dataset {dataset_id!r} not found")
    return envelope(item, store, item.known_limitations)
