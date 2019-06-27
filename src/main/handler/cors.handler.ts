import { MetadataKey, Method, Route } from '../@types';
import { HandlerType } from '../decorator';
import { Rester } from '../rester';
import { BaseHandler } from './base.handler';
import { RouterHandler } from './router.handler';

/**
 * CORS config.
 */
export interface CORSConfig {
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Methods': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Max-Age': number;
}

/**
 * CORS handler, require RouterHandler.
 */
export class CORSHandler extends BaseHandler {

  static config(rester: Rester, config?: CORSConfig): HandlerType {
    rester.zone.cors = config || {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': 86400
    };
    return CORSHandler;
  }

  /**
   * Config & init CORS handler of rester instance.
   *
   * @param rester Rester instance.
   */
  static init(rester: Rester, config?: CORSConfig): HandlerType {
    // CORS config
    CORSHandler.config(rester, config);
    /** If CORS handler on global. */
    const allCORS = rester.configHandlers.get().includes(CORSHandler);
    // map all controllers
    rester.configControllers.get()
      .forEach(controller => {
        const handlersOnController: HandlerType[] = Reflect.getMetadata(MetadataKey.Handler, controller) || [];
        /** If CORS handler on controller. */
        const allCORSOnController = handlersOnController.includes(CORSHandler);
        /** Get routes. */
        const routes: Route[] = Reflect.getMetadata(MetadataKey.Controller, controller) || [];
        // for each & set OPTIONS mapping
        routes
          .filter(route => allCORS || allCORSOnController || route.handlers.includes(CORSHandler))
          .filter((route, index, array) => index === array.findIndex(v => v.mapping.path === route.mapping.path))
          .map(route => ({
            controller: undefined as any,
            handlers: route.handlers,
            mapping: {
              method: Method.OPTIONS,
              path: route.mapping.path
            },
            name: undefined as any,
            target: undefined as any
          }))
          .forEach(route => RouterHandler.set(route, rester.zone.router));
      });
    return CORSHandler;
  }

  handle(next: () => Promise<any>): Promise<any> {
    for (const header in this.rester.zone.cors) {
      if (this.rester.zone.cors.hasOwnProperty(header)) {
        this.response.setHeader(header, this.rester.zone.cors[header]);
      }
    }
    return next();
  }

}