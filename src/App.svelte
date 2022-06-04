<script type="ts">
  import Connect, { marinaStore, MarinaStore } from 'svelte-marina-button';
  import CreateAccountForm from './components/CreateAccountForm.svelte';
  import RedeemForm from './components/RedeemForm.svelte';
  import UseAccountForm from './components/UseAccountForm.svelte';
  import classnames from 'classnames';


  // You can subscribe to marina status changes
  marinaStore.subscribe((s: MarinaStore) => {
    console.log(`Marina is attached to the ${s.network} network`);
  });

  enum Tab {
    CreateAccount,
    Redeem,
    UseAccount,
  }
  let selectedTab = Tab.CreateAccount;

  const makeSelectFunc = (tab: Tab) => () => selectedTab = tab;

</script>

<div class="container is-widescreen">
  <div class="box">
    <h1 class="title">Hello friend!</h1>

    <Connect cssClass={'button'} />
    <div class="tabs is-center">
      <ul>
        <li
          class={classnames({
            'is-active': selectedTab === Tab.CreateAccount,
          })}
        >
          <a href="#" on:click={makeSelectFunc(Tab.CreateAccount)}>Create account</a>
        </li>
        <li
          class={classnames({
            'is-active': selectedTab === Tab.UseAccount,
          })}
        >
          <a href="#" on:click={makeSelectFunc(Tab.UseAccount)}>Use account</a>
        </li>
        <li
          class={classnames({
            'is-active': selectedTab === Tab.Redeem,
          })}
        >
          <a href="#" on:click={makeSelectFunc(Tab.Redeem)}>Redeem coin</a>
        </li>
      </ul>
    </div>

    <div class="tabs-content">
      {#if selectedTab === Tab.CreateAccount}
        <CreateAccountForm />
      {:else if selectedTab === Tab.UseAccount}
        <UseAccountForm />
      {:else if selectedTab === Tab.Redeem}
        <RedeemForm />
      {/if}
    </div>
  </div>
</div>

<style src="./scss/main.scss" lang="scss" global>
</style>
