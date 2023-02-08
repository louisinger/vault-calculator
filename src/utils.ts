import { Artifact, Parameter, replaceArtifactConstructorWithArguments, templateString } from "@ionio-lang/ionio";
import { bip341, networks, script } from "liquidjs-lib";
import { AccountType, detectProvider } from "marina-provider";
import artifactJSON from './calculator.json';

export async function createAccount(namespace: string) {
  console.log('createAccount', namespace)
  const marina = await detectProvider('marina');
  let ok = false;
  try {
    ok = await marina.useAccount(namespace);
  } catch {
    ok = false;
  }

  if (!ok) {
    await marina.createAccount(namespace, AccountType.Ionio);
    await marina.useAccount(namespace);
  }
}

// send some marina coins to another account
// a send-to-wallet - fees pset
export async function transferLBTCToAccount(namespace: string, amount: number, sum: number): Promise<string> {
  const marina = await detectProvider('marina');
  if (await marina.getSelectedAccount() !== namespace) throw new Error('wrong account');
  const network = await marina.getNetwork();
  const asset = networks[network].assetHash;
  // change the pubkey argument name and replace it by the account namespace in order to let marina injects the right pubkey in the artifact
  const artifact = replaceArtifactConstructorWithArguments(
    artifactJSON as Artifact, 
    [templateString('sum'), templateString(namespace)]
  );

  const tx = await marina.sendTransaction([{
    address: (await marina.getNextAddress({ artifact, args: { sum } })).confidentialAddress,
    value: amount,
    asset,
  }]);

  console.log(tx)
  return tx.txid;
}

export function findRedeemLeaf(tree: bip341.HashTree): { leaf: bip341.HashTree, sum: number, xonlypubkey: string } | undefined {
  if (!tree.scriptHex) {
    if (!tree.left && !tree.right) {
      return undefined;
    }

    const left = findRedeemLeaf(tree.left);
    if (left) {
      return left;
    }
    return findRedeemLeaf(tree.right);
  }

  const s = Buffer.from(tree.scriptHex, 'hex');

  const opcodes = script.toASM(s).split(' ');

  const result = {
    leaf: tree,
    sum: 0,
    xonlypubkey: '',
  }

  for (let i = 0; i < opcodes.length; i++) {
    if (opcodes[i] === 'OP_ADD') {
      console.log(opcodes[i - 1], opcodes[i + 1]);
      result.sum = parseInt(opcodes[i + 1].slice(3));
    }

    if (opcodes[i] === 'OP_CHECKSIG') {
      result.xonlypubkey = opcodes[i - 1];
    }
  }

  return result;
}