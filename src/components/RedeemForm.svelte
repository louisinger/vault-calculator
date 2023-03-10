<script lang="ts">
  import { Contract } from '@ionio-lang/ionio';
  import * as ecc from 'tiny-secp256k1';
  import zkpLib from '@vulpemventures/secp256k1-zkp';
  import { detectProvider, isIonioScriptDetails, Utxo } from 'marina-provider';
  import { AssetHash, Extractor, networks } from 'liquidjs-lib';

  const FEE = 380;

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
    const { scriptDetails } = coinToRedeem as Utxo;
    const marina = await detectProvider();
    const network = await marina.getNetwork();

    if (isIonioScriptDetails(scriptDetails)) {
      contract = new Contract(
        scriptDetails.artifact,
        scriptDetails.params,
        networks[network],
        { ecc, zkp: await zkpLib() }
      );
    } else {
      throw new Error('Coin is not a Ionio contract');
    }
  };

  $: signer = {
    signTransaction: async (psetb64) => {
      const marina = await detectProvider();
      const signed = await marina.signTransaction(psetb64);
      return signed;
    },
  };

  const handleSubmit = async () => {
    try {
      const marina = await detectProvider();

      const coin = coinToRedeem as Utxo;
      const amount = coin.blindingData.value;

      const tx = (contract as Contract)
        .from(coin.txid, coin.vout, coin.witnessUtxo, {
          asset: AssetHash.fromHex(coin.blindingData.asset).bytesWithoutPrefix,
          value: coin.blindingData.value.toString(10),
          assetBlindingFactor: Buffer.from(
            coin.blindingData.assetBlindingFactor,
            'hex'
          ),
          valueBlindingFactor: Buffer.from(
            coin.blindingData.valueBlindingFactor,
            'hex'
          ),
        })
        .functions.transferWithSum(a, b, signer)
        .withRecipient(recipient, amount - FEE, coin.blindingData.asset, 0)
        .withFeeOutput(FEE);

      const signed = await tx.unlock();
      const transaction = Extractor.extract(signed.pset);
      const hex = transaction.toHex();
      const r = await marina.broadcastTransaction(hex);
      txid = r.txid;
    } catch (e) {
      console.error(e);
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
</script>

<div>
  <h2>Redeem coins</h2>
  <br />
  <form>
    <div class="columns">
      <div class="column field">
        <!-- svelte-ignore a11y-label-has-associated-control -->
        <label class="label">Coin to redeem</label>
        <div class="select">
          {#await accountNamespace then coins}
            <select
              class="select is-primary"
              bind:value={coinToRedeem}
              on:change={onSelectCoin}
            >
              {#each coins as utxo}
                <option value={utxo}
                  >{utxo.blindingData.value} sats (L-BTC)</option
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
      <div class="column field">
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
