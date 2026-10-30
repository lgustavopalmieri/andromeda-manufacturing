export interface HttpSuccessResponseInterface<Data> {
  error: false;
  data: Data;
}

export interface HttpErrorResponseInterface {
  error: true;
  message: string;
}

export type HttpResponseInterface<Data> =
  | HttpSuccessResponseInterface<Data>
  | HttpErrorResponseInterface;
