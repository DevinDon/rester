import { MetadataKey, Method } from '../@types';
import { ParamInjection, ParamInjectionType } from '../decorator/Controller';
import { HTTP404Exception, HTTP500Exception } from '../Exception';
import { Mapping, Router, Route } from '../Router';
import { BaseHandler } from './BaseHandler';

/**
 * Core handler.
 */
export class CoreHandler extends BaseHandler {

  /** Param injectors, function. */
  private paramInjectors: { [index in ParamInjectionType]: Function } = {
    PARAM$HTTP$REQUEST: () => this.request!,
    PARAM$HTTP$RESPONSE: () => this.response!,
    PARAM$PATH$QUERY: () => '',
    PARAM$PATH$VARIABLE: (name: string, route: Route, mapping: Mapping) => Router.formatToArray(mapping)[route.mapping.array.indexOf(`{{${name}}}`)],
    PARAM$REQUEST$BODY: () => '',
    PARAM$REQUEST$HEADER: (value: string) => this.request!.headers[value.toLowerCase()]
  };

  /**
   * Core handle method.
   *
   * @returns {string} Stringify HTTP response.
   */
  handle(): string {
    try {
      // content-type default to application/json
      this.response!.setHeader('content-type', 'application/json');
      const mapping: Mapping = {
        method: this.request!.method! as Method,
        path: this.request!.url!,
        array: []
      };
      const route = Router.get(mapping);
      if (route) {
        // get params type array
        const params: ParamInjection[] | undefined = Reflect.getMetadata(MetadataKey.Parameter, route.target.prototype, route.name);
        const args = params ? params.map(v => this.paramInjectors[v.type](v.value, route, mapping)) : [];
        // TODO: use JSON schema instead of JSON stringify
        return JSON.stringify(route.controller[route.name](...args));
      }
    } catch (error) {
      // server exception
      throw new HTTP500Exception(error, { request: this.request!, response: this.response! });
    }
    // router not found
    throw new HTTP404Exception(`CAN'T ${this.request!.method!.toUpperCase()} ${this.request!.url!}`, { request: this.request!, response: this.response! });
  }

}
