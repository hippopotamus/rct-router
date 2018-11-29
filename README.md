# rct-router
## Routing in React with the HTML5 History API
NOTE: This won't work with browsers that don't support the HTML5 History API

### An example
```js
/** routes.js */
import { Collection, createGo, RootCollection, Route } from 'rct-router'

const router = new RootCollection({
    error: Views.Error,
    notFound: Views.NotFound,
    path: '/',
    template: Templates.Root,
}).addRoute(new Route({
    name: 'home',
    path: '/',
    component: Views.Login,
})).addRoute(new Route({
    name: 'login',
    path: '/login',
    component: Views.Login,
})).addCollection(
    new Collection({
        name: 'dashboard',
        path: '/dashboard',
        template: Templates.Dashboard,
    }).addRoute(new Route({
        name: 'home',
        path: '/',
        component: Views.Dashboard.Home,
        beforeRender: authenticateAnd(['admin']),
        inject: {
            ...injectBreadCrumbs([
                { name: 'home', urn: route.dashboard },
            ])
        }
    })).addCollection(
        new Collection({
            name: 'profile',
            path: '/profile',
        }).addRoute(new Route({
            name: 'home',
            path: '/',
            component: Views.Dashboard.Profile.Home,
            beforeRender: authenticateAnd(['admin']),
            inject: {
                ...injectBreadCrumbs([
                    { name: 'home', urn: route.dashboard },
                    { name: 'profile', urn: route.profile },
                ])
            }
        })))).build()

export const routes = router
export const go = createGo(router)

/** app.js */
import { Router } from 'rct-router'
import { routes } from './routes'

ReactDOM.render(
    <Router routes={routes} />,
    document.getElementById('root')
)
```

### How to use
Start with RootCollection, which takes the parameters "template", "notFound", and "path"... notFound is the optional component to render when a route isn't found
error is an optional component which should follow the [react 16 error handler pattern](https://reactjs.org/blog/2017/07/26/error-handling-in-react-16.html).
there is a default ugly one provided in this package.
```js
new RootCollection({
    path?: '/' or whatever you want the root to be,
    template?: Component with props.children,
    notFound?: Component,
    error?: Component
})
```
use `addCollection` to add a collection of routes with the params. this method also exists on collections
```js
new Collection({
    name: string,
    path: string,
    template?: Component with props.children,
})
```
the `addRoute` method on both RootCollection and Collection takes the parameters
```js
new Route({
    name: string
    path: string
    component: React.ComponentType<any>
    template?: React.ComponentType<any>
    beforeRender?: Promise or function (it uses async/await)
    inject?: any object
})
```
* Routes and templates inherit their parent templates
* `beforeRender` is for middleware, authentication and things of the sort can be done there. The view won't render until the function completes
* `inject` lets you inject props into the view

Call the method `build` on the `RootCollection` when you're done adding routes to create the end routes class.

use the helper `createGo` to create a function (I call it 'go') for routing. The arguments for 'go' are:
```js
go(
    pointer, // names of parent collections and name of the route joined with periods,
    params, // an object of params needed for the route.
    event?, // optionally pass in event from click events or whatever, and it will call preventDefault for you
)

// How I use it
/** routes.ts */

export enum route {
    home = 'home',
    login = 'login',
    dashboard = 'dashboard.home',
    profile = 'dashboard.profile.home',
}

export const go = createGo(router)

/** dashboard/home.tsx */
import { route, go } from '../../routes'

class Dashboard extends Component<Props, State> {
    /** ... */
    onClick = (e) => {
        go(route.profile, { personId: this.props.person.id }, e)
    }
    /** ... */
}
```

If you have any questions, feel free to reach out to me <3
