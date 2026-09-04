import { parseAbi } from 'viem';

const ServiceRewardsActorABI = parseAbi([
  'event OrchestratorAdmitted(address indexed orch, address wallet)',
  'event OrchestratorRemoved(address indexed orch)',
  'event OrchestratorWalletReplaced(address indexed oldOrch, address indexed newWallet)',
  'event BindingDeclared(address indexed payer, address indexed operator, address indexed orchestrator)',
  'event BindingReassigned(address indexed payer, address indexed operator, address indexed orchestrator, bool inherit)',
  'event BindingCanceled(address indexed payer, address indexed operator, address indexed orchestrator)',
  'event AdmittedListsUpdated(address[] stablecoins, address[] filecoinPayContracts)',
  'event PricingParamsUpdated(uint256 minLotFloor, uint256 minLotAlphaNum, uint256 minLotAlphaDen, uint256 priceBand, uint256 registrationCutoff)',
  'event SharesSubmitted(uint64 indexed q, uint256 recipientCount, uint256 totalUsd)',
]);

export default ServiceRewardsActorABI;
