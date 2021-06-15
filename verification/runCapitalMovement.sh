certoraRun verification/AaveAssetManagerHarness.sol verification/DummyERC20.sol \
  --verify AaveAssetManagerHarness:verification/capitalMovements.spec \
  --solc solc7.6 \
  --optimistic_loop \
  --smt_timeout 300 \
  --staging \
  --msg "rule capital_out_decreases_investments with linked token"