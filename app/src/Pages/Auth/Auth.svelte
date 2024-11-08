<script>
    import * as Card from "$ui/components/ui/card";
    import {onMount} from 'svelte';
    import {Auth} from '../../lib';
    import {replace} from 'svelte-spa-router';

    onMount(() => {
        document.title = "Sign In — WellWave"
    });

    window.onGISCallback = (data) => {
        Auth.signInOrCreateAccount(data.credential).then(async () => {
            replace('/');
        }).catch(e => {
            console.error("Failed to sign in:", e);
            alert("There was an error while signing in. Please try again.");
        });
    };
</script>

<svelte:head>
    <script src="https://accounts.google.com/gsi/client" async></script>
</svelte:head>

<div class="auth">
    <div class="logo"></div>
    
    <Card.Root>
        <Card.Header>
            <Card.Title>Sign In</Card.Title>
            <Card.Description>Mental health for a better future.</Card.Description>
        </Card.Header>
        <Card.Content class="text-center">
            <div id="g_id_onload"
                data-client_id="631286411586-hkm1gmnkhp67angt3dgtckrc56thmehq.apps.googleusercontent.com"
                data-context="signin"
                data-ux_mode="popup"
                data-callback="onGISCallback"
                data-auto_prompt="false">
            </div>

            <div class="g_id_signin"
                data-type="standard"
                data-shape="rectangular"
                data-theme="outline"
                data-text="signin_with"
                data-size="large"
                data-logo_alignment="left">
            </div>
        </Card.Content>
    </Card.Root>
</div>