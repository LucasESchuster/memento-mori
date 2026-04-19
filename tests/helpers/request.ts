export function makeJsonRequest(
  url: string,
  method: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Request {
  const init: RequestInit = {
    method,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  return new Request(url, init);
}

export function makeRawRequest(
  url: string,
  method: string,
  body?: BodyInit,
  headers: Record<string, string> = {},
): Request {
  const init: RequestInit = {
    method,
    headers,
  };
  if (body !== undefined) init.body = body;
  return new Request(url, init);
}

export function makeFormRequest(
  url: string,
  method: string,
  body: Record<string, string>,
  headers: Record<string, string> = {},
): Request {
  const params = new URLSearchParams(body);
  return new Request(url, {
    method,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      ...headers,
    },
    body: params.toString(),
  });
}
