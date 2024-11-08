<script>
    import "./app.css";
    import Router, {push} from 'svelte-spa-router';
    import routes from './routes';

    // Route guard (auth)
    const onConditionsFailed = async (evt) => {
        // Navigate to auth page
        push('/auth');
    };
</script>

<Router {routes} on:conditionsFailed={onConditionsFailed} />