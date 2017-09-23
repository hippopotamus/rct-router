# rct-router
## Routing with React

### An example
```js
/** routes.js */
import { Collection, createGo, RootCollection, Route } from 'rct-router'

const router = new RootCollection({
    path: '/',
    template: Templates.Root,
    notFound: Views.NotFound,
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
```js
{
    path?: '/' or whatever you want the root to be,
    template?: Component with props.children,
    notFound?: Component,
}
```
use `addCollection` to add a collection of routes with the params
```js
{
    name: string,
    path: string,
    template?: Component with props.children,
}
```
the `addRoute` method on both RootCollection and Collection takes the parameters
```js
{
    name: string
    path: string
    component: React.ComponentType<any>
    template?: React.ComponentType<any>
    beforeRender?: Promise or function (it uses async/await)
    inject?: any object
}
```
