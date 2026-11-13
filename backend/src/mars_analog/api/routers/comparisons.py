from fastapi import APIRouter

from mars_analog.api.responses import APIError, Store, envelope
from mars_analog.api.routers.regions import require_region
from mars_analog.results_store import ResultsStore
from mars_analog.schemas import AciResult, Envelope

router = APIRouter(tags=["comparisons"])

ACI_VERSION = "0.1-experimental"
COMPARISON_LIMITATIONS = (
    "ACI_EXPERIMENTAL",
    "SCALE_DEPENDENCE",
    "DIFFERENT_VERTICAL_REFERENCES",
    "AOI_DEFINITION_DEPENDENCE",
    "MOLA_INTERPOLATED_BINS",
    "SRTM_VOID_FILL",
    "DEM_NOISE_FLAT_TERRAIN",
)


def _require_reference(store: ResultsStore, reference_id: str) -> None:
    region = require_region(store, reference_id)
    if region.properties.role != "reference":
        raise APIError(400, "not_a_reference_region", f"{reference_id!r} is not a reference region")


def _codes(results: list[AciResult]) -> list[str]:
    return [*COMPARISON_LIMITATIONS, *(code for r in results for code in r.limitations)]


@router.get("/comparisons", response_model=Envelope[list[AciResult]])
def list_comparisons(reference: str, store: Store):
    _require_reference(store, reference)
    results = store.comparisons(reference)
    return envelope(results, store, _codes(results), [r.provenance_id for r in results])


@router.get("/comparisons/{reference_id}/{candidate_id}", response_model=Envelope[AciResult])
def get_comparison(reference_id: str, candidate_id: str, store: Store):
    _require_reference(store, reference_id)
    candidate = require_region(store, candidate_id)
    if candidate.properties.role != "candidate":
        raise APIError(400, "not_a_candidate_region", f"{candidate_id!r} is not a candidate region")
    result = store.comparison(reference_id, candidate_id) or AciResult(
        aci_version=ACI_VERSION,
        reference_region_id=reference_id,
        candidate_region_id=candidate_id,
        status="not_computed",
    )
    return envelope(result, store, _codes([result]), [result.provenance_id])
