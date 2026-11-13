# Synthetic test fixtures

**Everything in this directory is synthetic.** These files exist only to exercise the API
contract in automated tests. They are not measurements, do not describe real places, and
must never be served by a running API (records carry `"is_synthetic": true`, which the
results store rejects unless `allow_synthetic` is enabled by the tests).
