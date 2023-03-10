<script lang="ts">
  import { getSelectedAccount, transferLBTCToAccount } from '../utils';

  let transferAmount: number;
  let transferError: string | null = null;
  let sum: number;

  async function transferToSelectedAccount() {
    try {
      transferError = null;
      const currentMarinaAccount = await getSelectedAccount();
      await transferLBTCToAccount(currentMarinaAccount, transferAmount, sum);
    } catch (e) {
      transferError = e instanceof Error ? e.message : e.toString();
      console.error(e);
    } finally {
      transferAmount = 0;
    }
  }
</script>

<div>
  <h2>Lock some of your mainAccount funds to selected account</h2>
  <br />

  <form>
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
    <div class="field">
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="label">The "lock" sum</label>
      <p class="control">
        <input
          class="input"
          type="number"
          placeholder="6"
          bind:value={sum}
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
