<script lang="ts">
  import { createAccount } from '../utils';

  let accountNamespace: string;

  const handleSubmit = async () => {
    await createAccount(accountNamespace);
  };
</script>

<form class="box">
  <!--  <h1 class="title">Mint & Sell your NFT</h1> -->
  <div>Create addition-locker account</div>
  <br />
  <div class="field">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="label">Account name</label>
    <p class="control">
      <input
        class="input"
        type="text"
        placeholder="eg. borrowAccount"
        bind:value={accountNamespace}
        required
      />
    </p>
  </div>

  <button type="button" class="button" on:click={handleSubmit}
    >CREATE ACCOUNT</button
  >
</form>
