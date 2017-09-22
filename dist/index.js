import React, { Component } from 'react';
import UrlPattern from 'url-pattern';
import _ from 'lodash';
import path from 'path';
const qs = require('qs');
import NotFound from './notFound';
import EmptyTemplate from './emptyTemplate';
export class Route {
    constructor(props) {
        this.name = props.name;
        this.path = props.path;
        this.Component = props.component;
        this.templates = [props.template || EmptyTemplate];
        this.beforeRender = props.beforeRender || function () { };
        this.inject = props.inject || {};
        this.urn = this.name;
    }
    addTemplate(template) {
        this.templates.push(template);
        return this;
    }
    addParams(params, url) {
        const queryStartIndex = url.indexOf('?');
        const queryParams = queryStartIndex !== -1 ? qs.parse(url.substring(queryStartIndex, url.length)) : {};
        this.params = Object.assign({}, this.params, queryParams, params);
        return this;
    }
    inheritParentData(parent) {
        this.urn = parent.urn ? parent.urn + '.' + this.urn : this.urn;
        this.path = path.join(parent.path, this.path);
        this.templates = [...parent.templates, ...this.templates];
        return this;
    }
    formatForInject() {
        return {
            urn: this.urn,
            params: this.params,
            inject: this.inject,
        };
    }
}
export class RootCollection {
    constructor(props) {
        this.name = '';
        this.urn = '';
        this.path = props.path || '';
        this.templates = [props.template || EmptyTemplate];
        this.routes = [];
        this.collections = [];
        this.notFound = props.notFound || NotFound;
    }
    addRoute(route) {
        this.routes.push(route);
        return this;
    }
    addCollection(collection) {
        this.collections.push(collection);
        return this;
    }
    build() {
        for (const collection of this.collections) {
            collection.inheritParentData(this);
        }
        for (const route of this.routes) {
            route.inheritParentData(this);
        }
        return this;
    }
}
export class Collection {
    constructor(props) {
        this.name = props.name;
        this.urn = props.name;
        this.path = props.path;
        this.templates = [props.template || EmptyTemplate];
        this.routes = [];
        this.collections = [];
    }
    addRoute(route) {
        this.routes.push(route);
        return this;
    }
    addCollection(collection) {
        this.collections.push(collection);
        return this;
    }
    addTemplate(template) {
        this.templates.push(template);
        return this;
    }
    inheritParentData(parent) {
        this.urn = parent.urn ? parent.urn + '.' + this.urn : this.urn;
        this.path = path.join(parent.path, this.path);
        this.templates = [...parent.templates, ...this.templates];
        for (const collection of this.collections) {
            collection.inheritParentData(this);
        }
        for (const route of this.routes) {
            route.inheritParentData(this);
        }
        return this;
    }
}
class TemplateBuilder extends Component {
    render() {
        let templates = this.props.templates;
        const Template = templates[0];
        if (!Template) {
            return this.props.children;
        }
        else if (0 < templates.length) {
            return (React.createElement(Template, { route: this.props.route },
                React.createElement(TemplateBuilder, { templates: _.tail(templates), route: this.props.route }, this.props.children)));
        }
        else {
            return React.createElement(Template, { route: this.props.route }, this.props.children);
        }
    }
}
class RouteRenderer extends Component {
    constructor() {
        super(...arguments);
        this.state = { route: null };
    }
    async beforeRender(props) {
        await props.route.beforeRender();
        this.setState({ route: props.route });
    }
    componentWillMount() {
        this.beforeRender(this.props);
    }
    componentWillReceiveProps(newProps) {
        if (newProps.route.path !== this.props.route.path) {
            this.beforeRender(newProps);
        }
    }
    render() {
        const route = this.state.route;
        if (!route) {
            return null;
        }
        const ComponentToRender = route.Component;
        return React.createElement(TemplateBuilder, { templates: route.templates, route: route.formatForInject() },
            React.createElement(ComponentToRender, { route: route.formatForInject() }));
    }
}
export class Router extends React.Component {
    constructor(props) {
        super(props);
        this.routes = props.routes;
        let w = window;
        this.state = { route: this.routeTo(new URL(w.location.href).pathname, this.routes) };
        w.onpopstate = () => {
            this.setState({ route: this.routeTo(new URL(w.location.href).pathname, this.routes) });
        };
        w.onpushstate = () => {
            this.setState({ route: this.routeTo(new URL(w.location.href).pathname, this.routes) });
        };
    }
    routeTo(url, collection) {
        url = 1 < url.length && url[url.length - 1] === '/' ? url.substring(0, url.length - 1) : url;
        for (const route of collection.routes) {
            const routePath = route.path;
            const uri = 1 < routePath.length && routePath[routePath.length - 1] === '/' ? routePath.substring(0, routePath.length - 1) : routePath;
            const pattern = new UrlPattern(uri);
            const params = pattern.match(url);
            if (params) {
                return route.addParams(params, url);
            }
        }
        for (const subCollection of collection.collections) {
            const pattern = new UrlPattern(path.join(subCollection.path, '*'));
            const params = pattern.match(path.join(url, '/'));
            if (params) {
                return this.routeTo(url, subCollection);
            }
        }
        return new Route({ name: 'notFound', path: '/not-found', component: this.routes.notFound });
    }
    render() {
        return React.createElement(RouteRenderer, { route: this.state.route });
    }
}
const getRouteFromPtr = (ptrArr, collection) => {
    const ptr = ptrArr[0];
    const tail = _.tail(ptrArr);
    if (tail.length) {
        for (const subCollection of collection.collections) {
            if (ptr === subCollection.name) {
                return getRouteFromPtr(tail, subCollection);
            }
        }
    }
    else {
        for (const route of collection.routes) {
            if (ptr === route.name) {
                return route;
            }
        }
    }
    return false;
};
/* go to a view from a route */
export const createGo = (routes) => {
    return (ptr, params, e) => {
        if (e) {
            e.preventDefault();
        }
        const route = getRouteFromPtr(ptr.split('.'), routes);
        if (route) {
            const pattern = new UrlPattern(route.path);
            let urlWithParams = pattern.stringify(params);
            const queryKeys = _.difference(_.keys(params), _.keys(urlWithParams));
            if (queryKeys.length) {
                urlWithParams += '?' + qs.stringify(_.pick(params, queryKeys));
            }
            let w = window;
            w.history.pushState(params, '', urlWithParams);
            w.onpushstate(params);
        }
        else {
            console.log(`Route ${ptr} not found!`);
        }
    };
};
