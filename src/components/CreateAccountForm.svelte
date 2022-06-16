<script lang="ts">
  import { createAccount } from '../utils';
  import {
    toDescriptor,
    transformArtifact,
    TemplateString,
    Artifact,
  } from '@ionio-lang/ionio';
  import artifact from '../calculator.json';

  let sum: number;
  let accountNamespace: string;

  const handleSubmit = async () => {
    console.log(artifact);
    const transformedArtifact = transformArtifact(artifact as Artifact, [
      undefined,
      TemplateString(accountNamespace),
    ]);
    await createAccount(
      accountNamespace,
      toDescriptor(transformArtifact(transformedArtifact, [sum]))
    );
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

  <button type="button" class="button" on:click={handleSubmit}
    >CREATE ACCOUNT</button
  >
</form>
