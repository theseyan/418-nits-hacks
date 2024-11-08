import {Home, NotFound, MyDay, Auth as AuthPage, About, Meditation, SAT, GAD7, PHQ9, UCLA} from './Pages';
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
    '/sat': guard(SAT),
    '/sat/gad-7': guard(GAD7),
    '/sat/phq-9': guard(PHQ9),
    '/sat/ucla': guard(UCLA),
    '/auth': AuthPage,
    '*': NotFound,
};

export default routes;