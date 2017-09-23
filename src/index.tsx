import React, { Component } from 'react'
import UrlPattern from 'url-pattern'
import _ from 'lodash'
import path from 'path'
const qs = require('qs')
import NotFound from './notFound'
import EmptyTemplate from './emptyTemplate'

export type Promisable = () => Promise<any> | any

export type RouteInject = { [key: string]: any }
export interface RouteProps {
    name: string
    path: string
    component: React.ComponentType<any>
    template?: React.ComponentType<any>
    beforeRender?: Promisable
    inject?: RouteInject
}

export type RouteParams = { [key: string]: any }
export interface InjectedRoute {
    urn: string
    params: RouteParams
    inject: RouteInject
}

export class Route {
    name: string
    path: string
    Component: React.ComponentType<any>
    templates: Array<React.ComponentType<any>>
    beforeRender: Promisable
    params: RouteParams
    inject: RouteInject
    urn: string

    constructor(props: RouteProps) {
        this.name = props.name
        this.path = props.path
        this.Component = props.component
        this.templates = [props.template || EmptyTemplate]
        this.beforeRender = props.beforeRender || function () { }
        this.inject = props.inject || {}
        this.urn = this.name
    }

    addTemplate(template: React.ComponentType<any>) {
        this.templates.push(template)
        return this
    }

    addParams(params: RouteParams, url: string) {
        const queryStartIndex = url.indexOf('?')
        const queryParams = queryStartIndex !== -1 ? qs.parse(url.substring(queryStartIndex, url.length)) : {}

        this.params = { ...this.params, ...queryParams, ...params }

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
    path?: string,
    notFound?: React.ComponentType<any>,
    template?: React.ComponentType<any>,
}

export class RootCollection {
    name: string
    path: string
    templates: Array<React.ComponentType<any>>
    routes: Array<Route>
    collections: Array<Collection>
    notFound: React.ComponentType<any>
    urn: string

    constructor(props: RootCollectionProps) {
        this.name = ''
        this.urn = ''
        this.path = props.path || ''
        this.templates = [props.template || EmptyTemplate]
        this.routes = []
        this.collections = []
        this.notFound = props.notFound || NotFound
    }

    addRoute(route: Route) {
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
    template?: React.ComponentType<any>
}

export class Collection {
    name: string
    urn: string
    path: string
    templates: Array<React.ComponentType<any>>
    routes: Array<Route>
    collections: Array<Collection>

    constructor(props: CollectionProps) {
        this.name = props.name
        this.urn = props.name
        this.path = props.path
        this.templates = [props.template || EmptyTemplate]
        this.routes = []
        this.collections = []
    }

    addRoute(route: Route) {
        this.routes.push(route)
        return this
    }

    addCollection(collection: Collection) {
        this.collections.push(collection)
        return this
    }

    addTemplate(template: React.ComponentType<any>) {
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
export interface RouterState { route: Route }

export interface TemplateProps {
    route: InjectedRoute,
}

export interface TemplateBuilderProps {
    route: InjectedRoute,
    templates: Array<React.ComponentType<TemplateProps>>,
    children: React.ReactElement<any>,
}

class TemplateBuilder extends Component<TemplateBuilderProps> {
    render(): any {
        let templates = this.props.templates
        const Template = templates[0]

        if (!Template) {
            return this.props.children
        } else if (0 < templates.length) {
            return (
                <Template route={this.props.route}>
                    <TemplateBuilder templates={_.tail(templates)} route={this.props.route}>
                        {this.props.children}
                    </TemplateBuilder>
                </Template>
            )
        } else {
            return <Template route={this.props.route}>{this.props.children}</Template>
        }
    }
}

export interface RouteRendererProps {
    route: Route
}

export interface RouteRendererState {
    route: Route | null
}

class RouteRenderer extends Component<RouteRendererProps, RouteRendererState> {
    state: RouteRendererState = { route: null }

    async beforeRender(props: RouteRendererProps) {
        await props.route.beforeRender()
        this.setState({ route: props.route })
    }

    componentWillMount() {
        this.beforeRender(this.props)
    }

    componentWillReceiveProps(newProps: RouteRendererProps) {
        if (newProps.route.path !== this.props.route.path) {
            this.beforeRender(newProps)
        }
    }

    render() {
        const route = this.state.route
        if (!route) {
            return null
        }

        const ComponentToRender = route.Component
        return <TemplateBuilder templates={route.templates} route={route.formatForInject()}><ComponentToRender route={route.formatForInject()} /></TemplateBuilder>
    }
}

export class Router extends React.Component<RouterProps, RouterState> {
    routes: RootCollection

    constructor(props: RouterProps) {
        super(props)
        this.routes = props.routes

        let w: any = window
        this.state = { route: this.routeTo(new URL(w.location.href).pathname, this.routes) }

        w.onpopstate = () => {
            this.setState({ route: this.routeTo(new URL(w.location.href).pathname, this.routes) })
        }

        w.onpushstate = () => {
            this.setState({ route: this.routeTo(new URL(w.location.href).pathname, this.routes) })
        }
    }

    routeTo(url: string, collection: Collection | RootCollection): Route {
        url = 1 < url.length && url[url.length - 1] === '/' ? url.substring(0, url.length - 1) : url
        for (const route of collection.routes) {
            const routePath = route.path
            const uri = 1 < routePath.length && routePath[routePath.length - 1] === '/' ? routePath.substring(0, routePath.length - 1) : routePath

            const pattern = new UrlPattern(uri)
            const params = pattern.match(url)

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

        return new Route({ name: 'notFound', path: '/not-found', component: this.routes.notFound })
    }

    render() {
        return <RouteRenderer route={this.state.route} />
    }
}

const getRouteFromPtr = (ptrArr: Array<string>, collection: Collection | RootCollection): Route | false => {
    const ptr = ptrArr[0]
    const tail = _.tail(ptrArr)

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

/* go to a view from a route */
export const createGo = (routes: RootCollection) => {
    return (ptr: string, params: { [key: string]: any }, e?: any) => {
        if (e) {
            e.preventDefault()
        }

        const route = getRouteFromPtr(ptr.split('.'), routes)

        if (route) {
            const pattern = new UrlPattern(route.path)
            let urlWithParams = pattern.stringify(params)

            const queryKeys = _.difference(_.keys(params), _.keys(urlWithParams))
            if (queryKeys.length) {
                urlWithParams += '?' + qs.stringify(_.pick(params, queryKeys))
            }

            let w: any = window
            w.history.pushState(params, '', urlWithParams)
            w.onpushstate(params)
        } else {
            console.log(`Route ${ptr} not found!`)
        }
    }
}
