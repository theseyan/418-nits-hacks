<script>
    import {Auth} from '../../lib';
    import {push} from 'svelte-spa-router';

    const logout = async () => {
        push('/auth');
        try {
            await Auth.logout();
        } catch(e) {
            console.error(e);
            alert("Could not log out due to an error. Please log in again.");
        }
    };
</script>

<header class="header">
    <div class="section"></div>
    <!-- svelte-ignore a11y-missing-content -->
    <a href="/" class="logo section"></a>
    <div class="section right">
        <button class="logout-btn" on:click={logout}>Log Out</button>
    </div>
</header>