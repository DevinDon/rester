import { IncomingMessage, ServerResponse } from 'http';
import { Route } from '../Router';

export interface HandlerOption {
  request: IncomingMessage;
  response: ServerResponse;
  route: Route;
}

export abstract class BaseHandler {

  protected args?: any[];
  protected request?: IncomingMessage;
  protected response?: ServerResponse;
  protected route?: Route;

  init(request?: IncomingMessage, response?: ServerResponse): this {
    this.request = request;
    this.response = response;
    return this;
  }

  async abstract handle(): Promise<string>;

}
