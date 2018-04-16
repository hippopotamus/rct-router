/// <reference types="react" />
import * as React from 'react';
export declare type Promisable = () => Promise<any> | any;
export declare type RouteInject = {
    [key: string]: any;
};
export interface RouteProps {
    name: string;
    path: string;
    component: React.ComponentType<any>;
    template?: React.ComponentType<any>;
    beforeRender?: Promisable;
    inject?: RouteInject;
}
export declare type RouteParams = {
    [key: string]: any;
};
export interface InjectedRoute {
    urn: string;
    params: RouteParams;
    inject: RouteInject;
}
export declare class Route {
    name: string;
    path: string;
    Component: React.ComponentType<any>;
    templates: Array<React.ComponentType<any>>;
    beforeRender: Promisable;
    params: RouteParams;
    inject: RouteInject;
    urn: string;
    constructor(props: RouteProps);
    addTemplate(template: React.ComponentType<any>): this;
    addParams(params: RouteParams, url: string): this;
    inheritParentData(parent: Collection | RootCollection): this;
    formatForInject(): InjectedRoute;
}
export interface RootCollectionProps {
    path?: string;
    notFound?: React.ComponentType<any>;
    template?: React.ComponentType<any>;
}
export declare class RootCollection {
    name: string;
    path: string;
    templates: Array<React.ComponentType<any>>;
    routes: Array<Route>;
    collections: Array<Collection>;
    notFound: React.ComponentType<any>;
    urn: string;
    constructor(props: RootCollectionProps);
    addRoute(route: Route): this;
    addCollection(collection: Collection): this;
    build(): this;
}
export interface CollectionProps {
    name: string;
    path: string;
    template?: React.ComponentType<any>;
}
export declare class Collection {
    name: string;
    urn: string;
    path: string;
    templates: Array<React.ComponentType<any>>;
    routes: Array<Route>;
    collections: Array<Collection>;
    constructor(props: CollectionProps);
    addRoute(route: Route): this;
    addCollection(collection: Collection): this;
    addTemplate(template: React.ComponentType<any>): this;
    inheritParentData(parent: Collection | RootCollection): this;
}
export interface RouterProps {
    routes: RootCollection;
}
export interface RouterState {
    route: Route;
}
export interface TemplateProps {
    route: InjectedRoute;
}
export interface TemplateBuilderProps {
    route: InjectedRoute;
    templates: Array<React.ComponentType<TemplateProps>>;
    children: React.ReactElement<any>;
}
export interface RouteRendererProps {
    route: Route;
}
export interface RouteRendererState {
    route: Route | null;
}
export declare class Router extends React.Component<RouterProps, RouterState> {
    routes: RootCollection;
    constructor(props: RouterProps);
    routeTo(url: string, collection: Collection | RootCollection): Route;
    render(): JSX.Element;
}
export interface Go<E extends string> {
    (ptr: E, params: {
        [key: string]: any;
    }, e?: any): void;
}
export declare function createGo<E extends string>(routes: RootCollection): Go<E>;
