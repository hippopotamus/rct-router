"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var UrlPattern = require("url-pattern");
var path = require("path");
var qs = require('qs');
var notFound_1 = require("./notFound");
var emptyTemplate_1 = require("./emptyTemplate");
var w = window;
if (w.process) { // for testing with jest
    w = {
        history: {
            pushState: function () { }
        },
        location: {
            href: 'http://localhost:3000/',
        },
        onpushstate: function () { },
        onpopstate: function () { },
    };
}
var Route = /** @class */ (function () {
    function Route(props) {
        this.name = props.name;
        this.path = props.path;
        this.Component = props.component;
        this.templates = [props.template || emptyTemplate_1.default];
        this.beforeRender = props.beforeRender || function () { };
        this.inject = props.inject || {};
        this.urn = this.name;
    }
    Route.prototype.addTemplate = function (template) {
        this.templates.push(template);
        return this;
    };
    Route.prototype.addParams = function (params, url) {
        var queryStartIndex = url.indexOf('?');
        var queryParams = queryStartIndex !== -1 ? qs.parse(url.substring(queryStartIndex + 1, url.length)) : {};
        this.params = __assign({}, this.params, queryParams, params);
        return this;
    };
    Route.prototype.inheritParentData = function (parent) {
        this.urn = parent.urn ? parent.urn + '.' + this.urn : this.urn;
        this.path = path.join(parent.path, this.path);
        this.templates = parent.templates.concat(this.templates);
        return this;
    };
    Route.prototype.formatForInject = function () {
        return {
            urn: this.urn,
            params: this.params,
            inject: this.inject,
        };
    };
    return Route;
}());
exports.Route = Route;
var RootCollection = /** @class */ (function () {
    function RootCollection(props) {
        this.name = '';
        this.urn = '';
        this.path = props.path || '';
        this.templates = [props.template || emptyTemplate_1.default];
        this.routes = [];
        this.collections = [];
        this.notFound = props.notFound || notFound_1.default;
    }
    RootCollection.prototype.addRoute = function (route) {
        this.routes.push(route);
        return this;
    };
    RootCollection.prototype.addCollection = function (collection) {
        this.collections.push(collection);
        return this;
    };
    RootCollection.prototype.build = function () {
        for (var _i = 0, _a = this.collections; _i < _a.length; _i++) {
            var collection = _a[_i];
            collection.inheritParentData(this);
        }
        for (var _b = 0, _c = this.routes; _b < _c.length; _b++) {
            var route = _c[_b];
            route.inheritParentData(this);
        }
        return this;
    };
    return RootCollection;
}());
exports.RootCollection = RootCollection;
var Collection = /** @class */ (function () {
    function Collection(props) {
        this.name = props.name;
        this.urn = props.name;
        this.path = props.path;
        this.templates = [props.template || emptyTemplate_1.default];
        this.routes = [];
        this.collections = [];
    }
    Collection.prototype.addRoute = function (route) {
        this.routes.push(route);
        return this;
    };
    Collection.prototype.addCollection = function (collection) {
        this.collections.push(collection);
        return this;
    };
    Collection.prototype.addTemplate = function (template) {
        this.templates.push(template);
        return this;
    };
    Collection.prototype.inheritParentData = function (parent) {
        this.urn = parent.urn ? parent.urn + '.' + this.urn : this.urn;
        this.path = path.join(parent.path, this.path);
        this.templates = parent.templates.concat(this.templates);
        for (var _i = 0, _a = this.collections; _i < _a.length; _i++) {
            var collection = _a[_i];
            collection.inheritParentData(this);
        }
        for (var _b = 0, _c = this.routes; _b < _c.length; _b++) {
            var route = _c[_b];
            route.inheritParentData(this);
        }
        return this;
    };
    return Collection;
}());
exports.Collection = Collection;
var TemplateBuilder = /** @class */ (function (_super) {
    __extends(TemplateBuilder, _super);
    function TemplateBuilder() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TemplateBuilder.prototype.render = function () {
        var templates = this.props.templates;
        var Template = templates[0];
        if (!Template) {
            return this.props.children;
        }
        else if (0 < templates.length) {
            return (React.createElement(Template, { route: this.props.route },
                React.createElement(TemplateBuilder, { templates: templates.slice(1, templates.length), route: this.props.route }, this.props.children)));
        }
        else {
            return React.createElement(Template, { route: this.props.route }, this.props.children);
        }
    };
    return TemplateBuilder;
}(React.Component));
var RouteRenderer = /** @class */ (function (_super) {
    __extends(RouteRenderer, _super);
    function RouteRenderer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = { route: null };
        return _this;
    }
    RouteRenderer.prototype.beforeRender = function (props) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, props.route.beforeRender()];
                    case 1:
                        _a.sent();
                        this.setState({ route: props.route });
                        return [2 /*return*/];
                }
            });
        });
    };
    RouteRenderer.prototype.componentWillMount = function () {
        this.beforeRender(this.props);
    };
    RouteRenderer.prototype.componentWillReceiveProps = function (newProps) {
        if (newProps.route.path !== this.props.route.path) {
            this.beforeRender(newProps);
        }
    };
    RouteRenderer.prototype.render = function () {
        var route = this.state.route;
        if (!route) {
            return null;
        }
        var ComponentToRender = route.Component;
        return React.createElement(TemplateBuilder, { templates: route.templates, route: route.formatForInject() },
            React.createElement(ComponentToRender, { route: route.formatForInject() }));
    };
    return RouteRenderer;
}(React.Component));
var buildUrl = function (href) {
    var url = new URL(href);
    var search = url.search || '';
    return url.pathname + search;
};
var Router = /** @class */ (function (_super) {
    __extends(Router, _super);
    function Router(props) {
        var _this = _super.call(this, props) || this;
        _this.routes = props.routes;
        _this.state = { route: _this.routeTo(buildUrl(w.location.href), _this.routes) };
        w.onpopstate = function () {
            _this.setState({ route: _this.routeTo(buildUrl(w.location.href), _this.routes) });
        };
        w.onpushstate = function (url) {
            _this.setState({ route: _this.routeTo(url, _this.routes) });
        };
        return _this;
    }
    Router.prototype.routeTo = function (url, collection) {
        url = 1 < url.length && url[url.length - 1] === '/' ? url.substring(0, url.length - 1) : url;
        for (var _i = 0, _a = collection.routes; _i < _a.length; _i++) {
            var route = _a[_i];
            var routePath = route.path;
            var uri = 1 < routePath.length && routePath[routePath.length - 1] === '/' ? routePath.substring(0, routePath.length - 1) : routePath;
            var pattern = new UrlPattern(uri);
            var urlToMatch = url.indexOf('?') !== -1 ? url.substring(0, url.indexOf('?')) : url;
            var params = pattern.match(urlToMatch);
            if (params) {
                return route.addParams(params, url);
            }
        }
        for (var _b = 0, _c = collection.collections; _b < _c.length; _b++) {
            var subCollection = _c[_b];
            var pattern = new UrlPattern(path.join(subCollection.path, '*'));
            var params = pattern.match(path.join(url, '/'));
            if (params) {
                return this.routeTo(url, subCollection);
            }
        }
        return new Route({ name: 'notFound', path: '/not-found', component: this.routes.notFound });
    };
    Router.prototype.render = function () {
        return React.createElement(RouteRenderer, { route: this.state.route });
    };
    return Router;
}(React.Component));
exports.Router = Router;
var getRouteFromPtr = function (ptrArr, collection) {
    var ptr = ptrArr[0];
    var tail = ptrArr.slice(1, ptrArr.length);
    if (tail.length) {
        for (var _i = 0, _a = collection.collections; _i < _a.length; _i++) {
            var subCollection = _a[_i];
            if (ptr === subCollection.name) {
                return getRouteFromPtr(tail, subCollection);
            }
        }
    }
    else {
        for (var _b = 0, _c = collection.routes; _b < _c.length; _b++) {
            var route = _c[_b];
            if (ptr === route.name) {
                return route;
            }
        }
    }
    return false;
};
/* go to a view from a route */
function createGo(routes) {
    return function (ptr, params, e) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        var route = getRouteFromPtr(ptr.split('.'), routes);
        if (route) {
            var pattern = new UrlPattern(route.path);
            var urlWithParams = pattern.stringify(params);
            var paramKeys = Object.keys(params);
            var queryKeys = [];
            var routeKeys = Object.keys(route.params);
            for (var i = 0; i < routeKeys.length; i++) {
                var key = routeKeys[i];
                if (paramKeys.indexOf(key) === -1) {
                    queryKeys.push(key);
                }
            }
            if (queryKeys.length) {
                var queryParams = {};
                for (var _i = 0, queryKeys_1 = queryKeys; _i < queryKeys_1.length; _i++) {
                    var key = queryKeys_1[_i];
                    queryParams[key] = route.params[key];
                }
                urlWithParams += '?' + qs.stringify(queryParams);
            }
            w.history.pushState(params, '', urlWithParams);
            w.onpushstate(urlWithParams);
        }
        else {
            console.log("Route " + ptr + " not found!");
        }
    };
}
exports.createGo = createGo;
