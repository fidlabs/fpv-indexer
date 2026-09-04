import { parseAbi } from 'viem';

const ERC20ABI = parseAbi([
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
]);

export default ERC20ABI;
