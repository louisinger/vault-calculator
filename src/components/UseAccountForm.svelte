<script lang="ts">
  import { AccountID, Balance, detectProvider } from 'marina-provider';
  import { current_component } from 'svelte/internal';
  import { transferLBTCToAccount } from '../utils';

  let selectedNamespace: string;
  let useAccountError: string | null = null;

  let transferAmount: number;
  let transferError: string | null = null;
  let txid: string | null = null;

  $: currentNamespace = getSelectedAccount();

  const useAccount = async () => {
    try {
      if (!selectedNamespace) {
        throw new Error('Please select an account namespace');
      }

      if (selectedNamespace === 'mainAccount') {
        throw new Error('You cannot use the mainAccount');
      }

      useAccountError = null;
      const marina = await detectProvider();
      if ((await marina.getSelectedAccount()) !== selectedNamespace) {
        const ok = await marina.useAccount(selectedNamespace);
        if (!ok) throw new Error('Account not found');
      }
      currentNamespace = Promise.resolve(selectedNamespace);
    } catch (e) {
      useAccountError = handleError(e);
    } finally {
      selectedNamespace = '';
    }
  };

  function handleError(err: unknown): string {
    if (err instanceof Error) {
      return err.message;
    } else {
      return err.toString();
    }
  }

  async function allAccounts(): Promise<AccountID[]> {
    const marina = await detectProvider();
    return marina.getAccountsIDs();
  }

  async function getSelectedAccount() {
    return detectProvider().then((marina) => marina.getSelectedAccount());
  }

  async function transferToSelectedAccount() {
    try {
      transferError = null;
      txid = null;
      const currentMarinaAccount = await getSelectedAccount();
      txid = await transferLBTCToAccount(currentMarinaAccount, transferAmount);
    } catch (e) {
      transferError = handleError(e);
    } finally {
      transferAmount = 0;
    }
  }
</script>

<div class="box">
  <form>
    {#await currentNamespace}
      <p>...waiting</p>
    {:then currentSelectedAccount}
      <p>selected account: {currentSelectedAccount}</p>
    {:catch error}
      <p>{error}</p>
    {/await}
    <div />
    <div class="field">
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="label" />
      <p class="control">
        {#await allAccounts()}
          <p>...waiting</p>
        {:then allAccounts}
          <select class="select is-primary" bind:value={selectedNamespace}>
            {#each allAccounts as account}
              <option value={account}>{account}</option>
            {/each}
          </select>
        {:catch error}
          <p>{error}</p>
        {/await}
      </p>
    </div>

    <button type="button" class="button" on:click={useAccount}>USE</button>
    {#if useAccountError}
      <p class="error">{useAccountError}</p>
    {/if}
  </form>

  <form>
    <h2>Transfer some of your funds to selected account</h2>
    <div class="field">
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="label">Amount</label>
      <p class="control">
        <input
          class="input"
          type="number"
          placeholder="eg. 100"
          bind:value={transferAmount}
          required
        />
      </p>
    </div>
    <button type="button" class="button" on:click={transferToSelectedAccount}
      >SEND</button
    >
    {#if transferError}
      <p class="error">{transferError}</p>
    {/if}
  </form>
</div>
