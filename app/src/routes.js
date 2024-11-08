import {Home, NotFound, MyDay, Auth as AuthPage, About, Meditation} from './Pages';
import {wrap} from 'svelte-spa-router/wrap';
import {Auth, Errors} from './lib';

const guard = (component) => {
    return wrap({
        component: component,
        conditions: [async (detail) => {
            try {
                await Auth.fetchUser();
                return true;
            } catch(e) {
                if (!(e instanceof Errors.UserUnauthenticatedError) && !(e instanceof Errors.HttpError && e.status === 404)) {
                    // Failed to fetch user, but not because user is unauthenticated.
                    console.error(e);
                    alert(`Error: ${e.message}`);
    
                    // Refresh the page
                    window.location.reload();
                } else {
                    return false;
                }
            }
        }]
    });
};

const routes = {
    '/': guard(Home),
    '/myday': guard(MyDay),
    '/about': guard(About),
    '/meditation/:type?': guard(Meditation),
    '/auth': AuthPage,
    '*': NotFound,
};

export default routes;