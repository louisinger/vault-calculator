<script lang="ts">
  import { createAccount } from '../utils';

  let accountNamespace: string;

  const handleSubmit = async () => {
    await createAccount(accountNamespace);
  };
</script>

<form>
  <h2>Create new Ionio account</h2>
  <br />
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label class="label">Account name</label>
  <div class="columns field">
    <div class="column">
      <input
        class="input"
        type="text"
        placeholder="eg. 'vault'"
        bind:value={accountNamespace}
        required
      />
    </div>
    <div class="column">
      <button type="button" class="button" on:click={handleSubmit}>
        CREATE
      </button>
    </div>
  </div>
</form>
