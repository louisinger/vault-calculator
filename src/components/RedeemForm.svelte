<script lang="ts">
  import { address, bip341, decodePset, getNetwork } from 'ldk';
  import { detectProvider, Utxo } from 'marina-provider';
  import * as ecc from 'tiny-secp256k1';
  import { findRedeemLeaf } from '../utils';
  import artifact from '../calculator.json';
  import { Contract, Artifact } from '@ionio-lang/ionio';

  const FEE = 450;

  $: coinToRedeem = null

  let recipient: string;
  let error: string;
  let txid: string | null = null;

  let a, b = 0;

  $: accountNamespace = getSelectedAccountUtxos();
  $: leafData = {
    leaf: null,
    sum: 0,
    xonlypubkey: '',
  }

  async function getSelectedAccountUtxos(): Promise<Utxo[]> {
    const marina = await detectProvider();
    const selectedAccount = await marina.getSelectedAccount();
    return marina.getCoins([selectedAccount]);
  }

  const onSelectCoin = async () => {
    const marina = await detectProvider();

    const addresses = await marina.getAddresses();
    const addressOwningCoin = addresses.find((a) =>
      address
        .toOutputScript(a.confidentialAddress)
        .equals(coinToRedeem.prevout.script)
    );

    const tree = addressOwningCoin['taprootHashTree'] as bip341.HashTree;
    leafData = findRedeemLeaf(tree);
    leafData.xonlypubkey = addressOwningCoin.publicKey;
  };

  $: signer = ({
    signTransaction: async (psetb64) => {
      const marina = await detectProvider();
      const pset = decodePset(psetb64);
      const leafScriptHex = (leafData.leaf as bip341.HashTree).scriptHex

      // signal to marina the leaf choosen by the user
      pset.updateInput(0, {
        // @ts-ignore
        tapLeafScript: [{ leafVersion: 0, script: Buffer.from(leafScriptHex, 'hex'), controlBlock: Buffer.alloc(33) }]
      })

      return marina.signTransaction(pset.toBase64());
    }
  })

  const handleSubmit = async () => {
    try {
      const amount = parseInt(coinToRedeem.unblindData.value, 10);
      const marina = await detectProvider();
      
      const network = getNetwork(await marina.getNetwork());
      const contract = new Contract(
        artifact as Artifact,
        [leafData.sum, Buffer.from(leafData.xonlypubkey, 'hex')],
        network,
        ecc
      );

      const tx = contract.functions
        .transferWithSum(a, b, signer)
        .withUtxo(coinToRedeem)
        .withRecipient(recipient, amount - FEE, network.assetHash)
        .withFeeOutput(FEE);
      
      const signed = await tx.unlock();
      const hex = signed.psbt.extractTransaction().toHex();
      const r = await marina.broadcastTransaction(hex);
      txid = r.txid;
    } catch (e) {
      handleError(e);
    } finally {
      coinToRedeem = null;
    }
  };

  function handleError(err: unknown) {
    if (err instanceof Error) {
      error = err.message;
    } else {
      error = err.toString();
    }
  }

  async function reloadCoins() {
    const provider = await detectProvider('marina');
    await provider.reloadCoins([await provider.getSelectedAccount()]);
  }
</script>

<div class="box">
  <button type="button" class="button" on:click={reloadCoins}>RELOAD COINS</button>

  <form>
    <div class="field">
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="label">Recipient</label>
      <p class="control">
        <input
          class="input"
          type="text"
          placeholder="who should receive the coins?"
          bind:value={recipient}
          required
        />
      </p>
    </div>
    <div class="field">
      <div class="select">
        {#await accountNamespace then coins}
          <select class="select is-primary" bind:value={coinToRedeem} on:change={onSelectCoin}>
            {#each coins as utxo}
              <option value={utxo}>{utxo.unblindData.value} sats (L-BTC)</option
              >
            {/each}
          </select>
        {/await}
      </div>
      {#if coinToRedeem}
        <h2>Sum must be {leafData.sum}</h2>
        <p class="control">
          <input class="input" type="number" bind:value={a} required />
        </p>
        <h1>+</h1>
        <p class="control">
          <input class="input" type="number" bind:value={b} required />
        </p>
      {/if}
    </div>
    <button type="button" class="button" on:click={handleSubmit}>REDEEM</button>
    {#if error}
      <p class="error">{error}</p>
    {/if}
    {#if txid}
      <p>
       Send! {txid}
      </p>
    {/if}
  </form>
</div>
