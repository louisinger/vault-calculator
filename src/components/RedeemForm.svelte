<script lang="ts">
import { Contract } from '@ionio-lang/ionio';

  import * as ecc from 'tiny-secp256k1'
  import { address, decodePset, getNetwork, UnblindedOutput } from 'ldk';
  import { detectProvider, Utxo } from 'marina-provider';

  const FEE = 450;

  $: coinToRedeem = null;
  $: contract = null;

  let recipient: string;
  let error: string;
  let txid: string | null = null;

  let a,
    b = 0;

  $: accountNamespace = getSelectedAccountUtxos();
  async function getSelectedAccountUtxos(): Promise<Utxo[]> {
    const marina = await detectProvider();
    const selectedAccount = await marina.getSelectedAccount();
    return marina.getCoins([selectedAccount]);
  }

  const onSelectCoin = async () => {
    const marina = await detectProvider();

    const addresses = await marina.getAddresses([await marina.getSelectedAccount()]);
    const addressOwningCoin = addresses.find((a) =>
      address
        .toOutputScript(a.confidentialAddress)
        .equals(coinToRedeem.prevout.script)
    );

    if (!addressOwningCoin) {
      throw new Error('address owning coin not found');
    }

    contract = addressOwningCoin['contract'];
  };

  $: signer = {
    signTransaction: async (psetb64) => {
      const marina = await detectProvider();
      console.log(decodePset(psetb64))
      const signed = await marina.signTransaction(psetb64);
      console.log(decodePset(signed))
      return signed
    },
  };

  const handleSubmit = async () => {
    try {
      const amount = parseInt(coinToRedeem.unblindData.value, 10);
      const marina = await detectProvider();

      const network = getNetwork(await marina.getNetwork());
      const contractCopy = new Contract(
        contract.artifact,
        contract.constructorArgs,
        network,
        ecc
      );

      const coin = coinToRedeem as UnblindedOutput;

      const tx = contractCopy.from(coin.txid, coin.vout, coin.prevout, coin.unblindData).functions
        .transferWithSum(a, b, signer)
        .withRecipient(recipient, amount - FEE, network.assetHash)
        .withFeeOutput(FEE);

      console.log(tx.psbt)

      const signed = await tx.unlock();
      const hex = signed.psbt.extractTransaction().toHex();
      const r = await marina.broadcastTransaction(hex);
      txid = r.txid;
    } catch (e) {
      handleError(e);
      throw e
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
  <button type="button" class="button" on:click={reloadCoins}
    >RELOAD COINS</button
  >

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
          <select
            class="select is-primary"
            bind:value={coinToRedeem}
            on:change={onSelectCoin}
          >
            {#each coins as utxo}
              <option value={utxo}>{utxo.unblindData.value} sats (L-BTC)</option
              >
            {/each}
          </select>
        {/await}
      </div>
      {#if contract != null}
        <h2>Sum must be {contract.constructorArgs[0]}</h2>
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
