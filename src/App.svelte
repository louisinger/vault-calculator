<script type="ts">
  import classNames from 'classnames';
  import Connect, { marinaStore, MarinaStore } from 'svelte-marina-button';
  import CreateAccountForm from './components/CreateAccountForm.svelte';
  import RedeemForm from './components/RedeemForm.svelte';
  import UseAccountForm from './components/LockForm.svelte';
  import { getSelectedAccount } from './utils';
  import { AccountID, AccountType, detectProvider } from 'marina-provider';

  $: currentNamespace = getSelectedAccount();
  let useAccountDropdownOpen = false;
  let useAccountError: string | null = null;

  const useAccount = async (selectedNamespace: string) => {
    try {
      if (!selectedNamespace) {
        throw new Error('Please select an account namespace');
      }

      useAccountError = null;
      const marina = await detectProvider();
      if ((await marina.getSelectedAccount()) !== selectedNamespace) {
        const ok = await marina.useAccount(selectedNamespace);
        if (!ok) throw new Error('Account not found');
        const infos = await marina.getAccountInfo(selectedNamespace);
        if (infos.type !== AccountType.Ionio)
          throw new Error('Account is not an Ionio account');
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

  // You can subscribe to marina status changes
  marinaStore.subscribe((s: MarinaStore) => {
    console.log(`Marina is attached to the ${s.network} network`);
  });
</script>

<div class="container is-widescreen">
  <div class="box">
    <div class="columns">
      <div class="column is-9">
        <h1 class="title">Vault calculator</h1>
      </div>

      <div class="column is-2">
        <div
          class={classNames('dropdown', 'is-primary', {
            'is-active': useAccountDropdownOpen,
          })}
        >
          <div class="dropdown-trigger">
            <button
              class="button"
              aria-haspopup="true"
              aria-controls="dropdown-menu"
              on:click={() => {
                useAccountDropdownOpen = !useAccountDropdownOpen;
              }}
              id="use-account-dropdown"
            >
              <span>
                {#await currentNamespace}
                  <p>...waiting</p>
                {:then currentSelectedAccount}
                  <p>{currentSelectedAccount}</p>
                {:catch error}
                  <p>{error}</p>
                {/await}
              </span>
              <span class="icon is-small">
                <i class="fas fa-angle-down" aria-hidden="true" />
              </span>
            </button>
          </div>
          <div class="dropdown-menu" id="dropdown-menu" role="menu">
            {#await allAccounts()}
              <p>loading...</p>
            {:then allAccounts}
              <div class="dropdown-content">
                {#each allAccounts as account}
                  <!-- svelte-ignore a11y-invalid-attribute -->
                  <a
                    href="#"
                    class="dropdown-item"
                    on:click={async () => {
                      await useAccount(account);
                      useAccountDropdownOpen = false;
                    }}>{account}</a
                  >
                  <hr class="dropdown-divider" />
                {/each}
              </div>
            {:catch error}
              <p>{error}</p>
            {/await}
          </div>
        </div>
      </div>

      {#if useAccountError}
        <div class="column is-1">
          <div class="notification is-danger">
            <button
              class="delete"
              on:click={() => {
                useAccountError = null;
              }}
            />
            {useAccountError}
          </div>
        </div>
      {/if}

      <div class="column is-1">
        <Connect cssClass="button is-danger is-outlined is-rounded" />
      </div>
    </div>

    <div class="box">
      <CreateAccountForm />
    </div>
    <div class="box">
      <UseAccountForm />
    </div>
    <div class="box">
      <RedeemForm />
    </div>
  </div>
</div>

<style src="./scss/main.scss" lang="scss" global>
</style>
