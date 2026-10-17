"""The pilot is deliberately fixed to one county."""

COUNTY_FIPS = "12086"
COUNTY_NAME = "Miami-Dade County, Florida"
TIMEZONE = "America/New_York"
MODEL_VERSION = "illustrative-baseline-v1"
NOTICE = (
    "Synthetic demonstration only. Relative risk estimates are unvalidated, "
    "not flood depths or probabilities. Follow official NWS and local emergency guidance."
)


def require_county(fips: str) -> None:
    if fips != COUNTY_FIPS:
        raise ValueError("This pilot supports Miami-Dade County (12086) only.")
