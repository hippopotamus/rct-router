import * as React from 'react'
import * as UrlPattern from 'url-pattern'
import * as path from 'path'
import * as qs from 'qs'
import { ErrorView } from './ErrorView'
import { NotFound } from './NotFound'
import { EmptyTemplate } from './EmptyTemplate'

let w: any = window

export type Promisable = () => Promise<any> | any

export type RouteInject = { [key: string]: any }
export interface RouteProps {
    name: string
    path: string
    component: any
    template?: any
    beforeRender?: Array<(route: InjectedRoute) => Promise<any | void>>
    inject?: RouteInject
}

export type RouteParams = { [key: string]: any }
export interface InjectedRoute {
    urn: string
    params: RouteParams
    inject: RouteInject
}

export class RctRoute {
    name: string
    path: string
    Component: any
    templates: Array<any>
    beforeRender: Array<(route: InjectedRoute) => Promise<any | void>>
    params: RouteParams
    inject: RouteInject
    urn: string

    constructor(props: RouteProps) {
        this.name = props.name
        this.path = props.path
        this.Component = props.component
        this.templates = [props.template || EmptyTemplate]
        this.beforeRender = props.beforeRender || [async function () { }]
        this.inject = props.inject || {}
        this.urn = this.name
    }

    replaceInject(inject: RouteInject) {
        this.inject = inject
    }

    addTemplate(template: any) {
        this.templates.push(template)
        return this
    }

    addParams(p: RouteParams, url: string) {
        const queryStartIndex = url.indexOf('?')
        const queryParams = queryStartIndex !== -1 ? qs.parse(url.substring(queryStartIndex + 1, url.length)) : {}
        let params: any = {}
        for (const key of Object.keys(p)) {
            params[key] = decodeURI(p[key])
        }
        this.params = { ...queryParams, ...params }

        return this
    }

    inheritParentData(parent: Collection | RootCollection) {
        this.urn = parent.urn ? parent.urn + '.' + this.urn : this.urn
        this.path = path.join(parent.path, this.path)
        this.templates = [...parent.templates, ...this.templates]

        return this
    }

    formatForInject(): InjectedRoute {
        return {
            urn: this.urn,
            params: this.params,
            inject: this.inject,
        }
    }
}

export interface RootCollectionProps {
    error?: any
    notFound?: any
    path?: string
    template?: any
}

export class RootCollection {
    collections: Array<Collection>
    error: any
    name: string
    notFound: any
    path: string
    routes: Array<RctRoute>
    templates: Array<any>
    urn: string

    constructor(props: RootCollectionProps) {
        this.name = ''
        this.urn = ''
        this.path = props.path || ''
        this.templates = [props.template || EmptyTemplate]
        this.routes = []
        this.collections = []
        this.error = props.error || ErrorView
        this.notFound = props.notFound || NotFound
    }

    addRoute(route: RctRoute) {
        this.routes.push(route)
        return this
    }

    addCollection(collection: Collection) {
        this.collections.push(collection)
        return this
    }

    build() {
        for (const collection of this.collections) {
            collection.inheritParentData(this)
        }

        for (const route of this.routes) {
            route.inheritParentData(this)
        }

        return this
    }
}

export interface CollectionProps {
    name: string,
    path: string,
    template?: any
}

export class Collection {
    name: string
    urn: string
    path: string
    templates: Array<any>
    routes: Array<RctRoute>
    collections: Array<Collection>

    constructor(props: CollectionProps) {
        this.name = props.name
        this.urn = props.name
        this.path = props.path
        this.templates = [props.template || EmptyTemplate]
        this.routes = []
        this.collections = []
    }

    addRoute(route: RctRoute) {
        this.routes.push(route)
        return this
    }

    addCollection(collection: Collection) {
        this.collections.push(collection)
        return this
    }

    addTemplate(template: any) {
        this.templates.push(template)
        return this
    }

    inheritParentData(parent: Collection | RootCollection) {
        this.urn = parent.urn ? parent.urn + '.' + this.urn : this.urn
        this.path = path.join(parent.path, this.path)
        this.templates = [...parent.templates, ...this.templates]

        for (const collection of this.collections) {
            collection.inheritParentData(this)
        }

        for (const route of this.routes) {
            route.inheritParentData(this)
        }

        return this
    }
}


export interface RouterProps { routes: RootCollection }
export interface RouterState { route: RctRoute }

export interface TemplateProps {
    children: React.ReactElement<any>
    route: InjectedRoute
}

export interface TemplateBuilderProps {
    children: React.ReactElement<any>
    route: InjectedRoute
    templates: Array<React.ComponentClass<TemplateProps>>
}

const TemplateBuilder = (props:TemplateBuilderProps)  =>{
        let templates = props.templates
        const Template = templates[0]

        if (!Template) {
            return props.children
        } else if (0 < templates.length) {
            return (
                <Template route={props.route}>
                    <TemplateBuilder templates={templates.slice(1, templates.length)} route={props.route}>
                        {props.children}
                    </TemplateBuilder>
                </Template>
            )
        } else {
            return <Template route={props.route}>{props.children}</Template>
        }
}

export interface RouteRendererProps {
    route: RctRoute
    errorView: any
}

export interface RouteRendererState {
    route: RctRoute | null
}

class RouteRenderer extends React.Component<RouteRendererProps, RouteRendererState> {
    state: RouteRendererState = { route: null }

    async beforeRender(route: RctRoute) {
        for (const fn of route.beforeRender) {
            const inject = await fn(route)
            if (inject) {
                route.replaceInject(inject)
            }
        }

        return route
    }

    async componentDidMount() {
        try {
            const route = await this.beforeRender(this.props.route)
            this.setState({ route })
        } catch { }
    }

    async componentDidUpdate(prevProps: RouteRendererProps) {
        if (prevProps.route.path !== this.props.route.path) {
            try {
                const route = await this.beforeRender(this.props.route)
                this.setState({ route })
            } catch { }
        }
    }

    render() {
        const ErrorView = this.props.errorView

        const route = this.state.route
        if (!route) {
            return null
        }

        const ComponentToRender = route.Component
        return (
            <ErrorView>
                <TemplateBuilder templates={route.templates} route={route.formatForInject()}>
                    <ComponentToRender route={route.formatForInject()} />
                </TemplateBuilder>
            </ErrorView>
        )
    }
}

const buildUrl = (href: string) => {
    const url = new URL(href)
    const search = url.search || ''
    return url.pathname + search
}

export class Router extends React.Component<RouterProps, RouterState> {
    routes: RootCollection

    constructor(props: RouterProps) {
        super(props)
        this.routes = props.routes
        this.state = { route: this.routeTo(buildUrl(w.location.href), this.routes) }

        w.onpopstate = () => {
            this.setState({ route: this.routeTo(buildUrl(w.location.href), this.routes) })
        }

        w.onpushstate = (url: string) => {
            this.setState({ route: this.routeTo(url, this.routes) })
        }
    }

    routeTo(url: string, collection: Collection | RootCollection): RctRoute {
        url = 1 < url.length && url[url.length - 1] === '/' ? url.substring(0, url.length - 1) : url

        for (const route of collection.routes) {
            const routePath = route.path
            const uri = 1 < routePath.length && routePath[routePath.length - 1] === '/' ? routePath.substring(0, routePath.length - 1) : routePath

            const pattern = new UrlPattern(uri + '(/)')

            const urlToMatch = url.indexOf('?') !== -1 ? url.substring(0, url.indexOf('?')) : url
            const params = pattern.match(urlToMatch)

            if (params) {
                return route.addParams(params, url)
            }
        }

        for (const subCollection of collection.collections) {
            const pattern = new UrlPattern(path.join(subCollection.path, '*'))
            const params = pattern.match(path.join(url, '/'))

            if (params) {
                return this.routeTo(url, subCollection)
            }
        }

        return new RctRoute({ name: 'notFound', path: '/not-found', component: this.routes.notFound })
    }

    render() {
        return <RouteRenderer errorView={this.routes.error} route={this.state.route} />
    }
}

const getRouteFromPtr = (ptrArr: Array<string>, collection: Collection | RootCollection): RctRoute | false => {
    const ptr = ptrArr[0]
    const tail = ptrArr.slice(1, ptrArr.length)

    if (tail.length) {
        for (const subCollection of collection.collections) {
            if (ptr === subCollection.name) {
                return getRouteFromPtr(tail, subCollection)
            }
        }
    } else {
        for (const route of collection.routes) {
            if (ptr === route.name) {
                return route
            }
        }
    }

    return false
}

export interface Go<E extends string> {
    (ptr: E, params: { [key: string]: any }, e?: any): void
}

/* go to a view from a route */
export function createGo<E extends string>(routes: RootCollection, defaultParams: () => any): Go<E> {
    return (ptr: E, params: { [key: string]: any }, e?: any) => {
        if (e && e.preventDefault) {
            e.preventDefault()
        }

        const route = getRouteFromPtr(ptr.split('.'), routes)
        if (route) {
            route.params = {}
            params = { ...defaultParams(), ...params }
            const pattern = new UrlPattern(route.path) as any
            let urlWithParams = pattern.stringify(params)

            const keys = Object.keys(params)

            let queryKeys: string[] = []
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]

                if (pattern.names.indexOf(key) === -1) {
                    queryKeys.push(key)
                }
            }

            if (queryKeys.length) {
                let queryParams = {} as any
                for (const key of queryKeys) {
                    queryParams[key] = params[key]
                }

                urlWithParams += '?' + qs.stringify(queryParams)
            }

            w.history.pushState(params, '', urlWithParams)

            w.onpushstate(urlWithParams)
        } else {
            console.log(`Route ${ptr} not found!`)
        }
    }
}

export function createGetUri<E extends string>(routes: RootCollection, defaultParams: () => any): Go<E> {
    return (ptr: E, params: { [key: string]: any }, e?: any) => {
        if (e && e.preventDefault) {
            e.preventDefault()
        }

        const route = getRouteFromPtr(ptr.split('.'), routes)
        if (route) {
            route.params = {}
            params = { ...defaultParams(), ...params }
            const pattern = new UrlPattern(route.path) as any
            let urlWithParams = pattern.stringify(params)

            const keys = Object.keys(params)

            let queryKeys: string[] = []
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]

                if (pattern.names.indexOf(key) === -1) {
                    queryKeys.push(key)
                }
            }

            if (queryKeys.length) {
                let queryParams = {} as any
                for (const key of queryKeys) {
                    queryParams[key] = params[key]
                }

                urlWithParams += '?' + qs.stringify(queryParams)
            }

            return urlWithParams
        } else {
            console.log(`Route ${ptr} not found!`)
        }
    }
}
