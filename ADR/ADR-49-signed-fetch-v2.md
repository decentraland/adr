---
layout: doc
adr: 49
date: 2022-01-26
title: Signed Fetch V2
authors:
- 2fd
- cazala
- nachomazzara
status: Draft
type: Standards Track
spdx-license: CC0-1.0
---

This document describe an improved mechanism to communicate Users with Decentraland Services over HTTP messages. This mechanism support all previously use case and includes new security features and follow common and well proved standards:

## Summary

Preserved features include:

- The ability to generate signed request on front end application
- Sign request's method and pathname
- Sign metadata
- Support `decentraland-crypto` as signature generator

New features include:

- Sign `Host` and `Content-Type` headers and query to prevent request re-utilization between services and/or environments
- Sign arbitrary headers that Services can trust that were provide by Users
- Sign request's body to prevent manipulation between Users and Services
- Use `Authorization` header to take advantage of default behavior of caching for private content (see: [1](https://greenbytes.de/tech/webdav/rfc7234.html#rfc.section.3), [2](https://www.w3.org/Protocols/HTTP/Issues/cache-authentication.html))
- Support `multipart/form-data` requests
- Support `PersonalSign` as signature generator
- Self contain expiration

> Although this new mechanism is not backward compatible it doesn't include any incompatibility which means that a Service could accept request signed with either of the two mechanisms

## Sign a Request

In this mechanism the `Authorization` header is used to transport the signature of the request:

### Authorization

The [Authorization](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#authorization_and_proxy-authorization_headers) request headers contain the credentials to authenticate a User with a Service. Here, the `Type` is used to differentiate the format on which the `Credentials` is encode/encrypted.

```ts
  Authorization = Type + ' ' + Credentials
```

In mechanism `Type` is compose of 3 component:

```ts
  Type = SignAlgorithm + '+' + HashAlgorithm [ + '+' + SignEncoding ]
```

- `SignAlgorithm`: Defines how user generates the signature of the request
  - `DCL`: when the signature was generated using [`decentraland-crypto`](https://github.com/decentraland/decentraland-crypto)
  - `SIGN`: when the signature was generated using a [`eth_sign`](https://eth.wiki/json-rpc/API#eth_sign) call

> Note: Other methods can be added into this list, like `DCL2` for future versions of `decentraland-crypto` or the algorithm change and `TYPED4` if `signTypedData_v4` is use to generate the signature

- `HashAlgorithm`: Defines the algorithm used to hash the request, since [some algorithms as not consider secure](https://en.wikipedia.org/wiki/Secure_Hash_Algorithms) any more, `SHA256` is support as minimum
  - `SHA256`: at the moment consider [secure against collision attack](https://en.wikipedia.org/wiki/Secure_Hash_Algorithms) and with the most extended support

> Note: Other Hash methods can be added into this list, like `SHA512` and `SHA3-256`

- `SignEncoding`: An optional extra component that defines how Credentials are encoded
  - `BASE64`: If credentials should be decoded using [`Base64`](https://datatracker.ietf.org/doc/html/rfc4648)
  - **None**: denoting that credentias were sent in plain text

> Example:
>
> ```ts
>  Authorization = 'DCL+SHA256' + ' ' + Credentials
>  Authorization = 'DCL+SHA256+BASE64' + ' ' + Credentials
>  Authorization = 'SIGN+SHA256' + ' ' + Credentials
>```

Meanwhile `Credentials` is the user signature of the request (called `CanonicalRequest`) using [`decentraland-crypto`](https://github.com/decentraland/decentraland-crypto) or [`eth_sign`](https://eth.wiki/json-rpc/API#eth_sign) as appropriate

```ts
  // Hash the request
  Payload = SHA256(CanonicalRequest)

  // Generate User AuthLink (Signature)
  AuthLink = Authenticator.signPayload(<Identity>, Payload)

  // Stringify AuthLink to get the credentials
  Credentials = JSON.stringify(AuthLink)
```

```ts
  // Hash the request
  Payload = SHA256(CanonicalRequest)

  // Generate User Signature
  Credentials = Eth.signMessage(Payload)
```

> Example:
>
> ```ts
>  'Authorization': 'DCL+SHA256 [{"type":"SIGNER","payload":"0x978561a2fcf322d668906a30e561ec3e70756208","signature":""},{"type":"ECDSA_EPHEMERAL","payload":"Decentraland Login\\nEphemeral address: 0x0F7254618741D2FbBAaa2187195B241be2B06BB7\\nExpiration: 2022-01-07T19:38:17.741Z","signature":"0x29b5f488411f059b45b22eff66debb716b0617408e5d648f21d8ded12a15089e7232a591cad5a82f41b6020c779ed4427c8f6d84e4cd4b8be5e26c82eec374b71b"},{"type":"ECDSA_SIGNED_ENTITY","payload":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","signature":"0x5b3cf13b6e21b41df56bbd5b8fb4ef6241306c666bb4136205a15ff74b698d5b10f2c1eab94306ae83d8b61350e19856cc6a610da135dd1b8601beac855e3d321b"}]'
>
>  'Authorization': 'DCL+SHA256+BASE64 W3sidHlwZSI6IlNJR05FUiIsInBheWxvYWQiOiIweDk3ODU2MWEyZmNmMzIyZDY2ODkwNmEzMGU1NjFlYzNlNzA3NTYyMDgiLCJzaWduYXR1cmUiOiIifSx7InR5cGUiOiJFQ0RTQV9FUEhFTUVSQUwiLCJwYXlsb2FkIjoiRGVjZW50cmFsYW5kIExvZ2luXFxuRXBoZW1lcmFsIGFkZHJlc3M6IDB4MEY3MjU0NjE4NzQxRDJGYkJBYWEyMTg3MTk1QjI0MWJlMkIwNkJCN1xcbkV4cGlyYXRpb246IDIwMjItMDEtMDdUMTk6Mzg6MTcuNzQxWiIsInNpZ25hdHVyZSI6IjB4MjliNWY0ODg0MTFmMDU5YjQ1YjIyZWZmNjZkZWJiNzE2YjA2MTc0MDhlNWQ2NDhmMjFkOGRlZDEyYTE1MDg5ZTcyMzJhNTkxY2FkNWE4MmY0MWI2MDIwYzc3OWVkNDQyN2M4ZjZkODRlNGNkNGI4YmU1ZTI2YzgyZWVjMzc0YjcxYiJ9LHsidHlwZSI6IkVDRFNBX1NJR05FRF9FTlRJVFkiLCJwYXlsb2FkIjoiZTNiMGM0NDI5OGZjMWMxNDlhZmJmNGM4OTk2ZmI5MjQyN2FlNDFlNDY0OWI5MzRjYTQ5NTk5MWI3ODUyYjg1NSIsInNpZ25hdHVyZSI6IjB4NWIzY2YxM2I2ZTIxYjQxZGY1NmJiZDViOGZiNGVmNjI0MTMwNmM2NjZiYjQxMzYyMDVhMTVmZjc0YjY5OGQ1YjEwZjJjMWVhYjk0MzA2YWU4M2Q4YjYxMzUwZTE5ODU2Y2M2YTYxMGRhMTM1ZGQxYjg2MDFiZWFjODU1ZTNkMzIxYiJ9XQ=='
>
>  'Authorization': 'SIGN+SHA256 0x5b3cf13b6e21b41df56bbd5b8fb4ef6241306c666bb4136205a15ff74b698d5b10f2c1eab94306ae83d8b61350e19856cc6a610da135dd1b8601beac855e3d321b'
> ```

### CanonicalRequest

To create a signature that includes information from your request a standardized (canonical) format is required. This ensures that when a Service receives the request, it calculates the same signature that you calculated.

```ts
  CanonicalRequest =
    HTTPRequestMethod + ' ' + CanonicalURI + CanonicalQueryString + '\n' +
    CanonicalHeaders + '\n' +
    BodyHashPayload
```

### 1. HTTPRequestMethod

> Required: always *MUST* be included

The [HTTP method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) that will be use to send the request.

```ts
  HTTPRequestMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH'
```

### 2. CanonicalURI

> Required: *MUST* be always included

Normalized URI pathname according with [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986)

```ts
  CanonicalURI = '/' | '/path/to/resource' | '/wiki/%C3%91'
```

> Note: In Javascript the URL API encodes the pathname using [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986) as follow:
>
> ```ts
>   const url = new URL('https://en.wikipedia.org/wiki/Ñ')
>   url.pathname === '/wiki/%C3%91'
> ```

### 3. CanonicalQueryString

> Required if: the request includes any query string

Normalized URI query string according with [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986)

```ts
  CanonicalURI = '?order=asc' | '?q=%C3%B1'
```

> Note: In Javascript URL API and URLS encodes the query string using [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986) as follow:
>
> ```ts
>   const url = new URL('https://www.google.com/search?q=ñ')
>   url.search === '?q=%C3%B1'
> ```
>
> ```ts
>   const params = new URLSearchParams('?q=ñ')
>   params.toString() === '?q=%C3%B1'
> ```

### 4. CanonicalHeaders

The canonical headers consist of a list of all the HTTP headers that you are including with the signed request.

```ts
  CanonicalHeaders =
    'host:' + Host + '\n' +
    ContentType + '\n' +
    'x-identity-expiration:' + Expiration + '\n' +
    'x-identity-metadata:' + Metadata + '\n' +
    ExtraHeaders
```

#### 4.1. Host

> Required: *MUST* be always included

Host encoded using [RFC 3492](https://datatracker.ietf.org/doc/html/rfc3492) and port number, if a non standard `http` or `https` port is used, of the server to which the request will be send.

```ts
  Host = 'decentraland.org' | 'xn--fiqs8s.asia' | 'localhost:8000'
```

#### 4.2 ContentType

> Required if: the request includes some body content it *MUST* be present, otherwise it *MUST* be omitted

Indicate the original [Media Type](https://developer.mozilla.org/en-US/docs/Glossary/MIME_type) of the resource.

```ts
  ContentType = 'application/json'
```

If the `Content-Type` header includes the `charset` directive it *MUST* be also prensent in lowercase:

```ts
  ContentType = 'application/json; charset=utf-8'
```

If the `Content-Type` header is `multipart/form-data` the `boundary` *MUST NOT* be present :

```ts
  ContentType = 'multipart/form-data'
```

#### 4.3. X-Identity-Expiration

> Required: always *MUST* be included

The moment at which this signature is considered invalid (encoded with [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3339))

```ts
  Expiration = `2020-01-01T00:00:00Z`
```

#### 4.4 X-Identity-Metadata

> Required if: the request includes `X-Identity-Metadata` header

Extra metadata sent to the server (encoded as [JSON](https://datatracker.ietf.org/doc/html/rfc4627))

```ts
  Metadata = `{"catalyst": "peer.decentraland.org"}`
```

#### 4.5. ExtraHeaders

> Optional

To sign other headers not listed previously Users can include them using `X-Identity-Headers`, which is a list separated by semicolons. If this header is present, all extra headers listed *MUST* be included in the signature as well in the same order they were listed

```ts
  ExtraHeaders = "x-identity-headers:" +
    LOWERCASE(SIGNED_HEADER_1) + ';' + LOWERCASE(SIGNED_HEADER_2) + ';' + LOWERCASE(SIGNED_HEADER_N) + '\n' +
    LOWERCASE(SIGNED_HEADER_1)  + ':' + TRIM(Headers[SIGNED_HEADER_1]) + '\n' +
    LOWERCASE(SIGNED_HEADER_2)  + ':' + TRIM(Headers[SIGNED_HEADER_2]) + '\n' +
    LOWERCASE(SIGNED_HEADER_N)  + ':' + TRIM(Headers[SIGNED_HEADER_N])
```

> Example: sign `Accept` and `Cookie` headers
>
> ```ts
>   ExtraHeaders = 'x-identity-headers:accept;cookie\n' +
>     'accept:application/json\n' +
>     'cookie:lang=en'
> ```

### 5. BodyHashPayload

> Required if: the request includes some body content it *MUST* be present, otherwise it *MUST* be omitted

For almost every case this is the result of hashing the content of the body, but for [`multipart/form-data` request](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type#content-type_in_html_forms) a different approach is needed in order to be used on web applications

When `ContentType != 'multipart/form-data'`

### 5.1 ContentType != multipart/form-data

Just hash the entire body

```ts
  BodyHashPayload = SHA265(REQUEST_BODY)
```

### 5.2 ContentType == multipart/form-data

The ordered list of all fields in the request, each field *MUST* be normalized as well

```ts
  BodyHashPayload = SORT(CanonicalField1, CanonicalField2 /*, ... */)
```

Each field *MUST* include `name` and `size` directives as prefix of the content hash

```ts
  CanonicalFieldX = 'name="description";' +
    'size=50;' +
    SHA256(FieldContent)
```

Additionally if some fields are files they *MUST* also include `filename` and `type` directives

```ts
  CanonicalFieldX = 'name="description";' +
    'filename="image.png";' +
    'type="image/png";' +
    'size=99999999999;' +
    SHA256(FieldContent)

```

### Canonical Request Examples

#### `GET https://decentraland.org/api/status`

```txt
GET /api/status
host:decentraland.org
x-identity-expiration:2020-01-01T00:00:00Z
```

#### `GET https://decentraland.org/api/status` with metadata

```txt
GET /api/status
host:decentraland.org
x-identity-expiration:2020-01-01T00:00:00Z
x-identity-metadata:{"service":"market.decentraland.org"}
```

#### `POST https://decentraland.org/api/status?filter=asc` with metadata

```txt
POST /api/status?filter=asc
host:decentraland.org
x-identity-expiration:2020-01-01T00:00:00Z
x-identity-metadata:{"service":"market.decentraland.org"}
```

#### `POST https://decentraland.org/api/status` with metadata and extra headers

```txt
POST /api/status
host:decentraland.org
x-identity-expiration:2020-01-01T00:00:00Z
x-identity-metadata:{"service":"market.decentraland.org"}
x-identity-headers:accept;cookie
accept:*/*
cookie:eu_cn=1;
```

#### `POST https://decentraland.org/api/status` with json data

```txt
POST /api/status
host:decentraland.org
content-type:application/json; charset=utf-8
x-identity-expiration:2020-01-01T00:00:00Z
0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

#### `POST https://decentraland.org/api/status` with multipart data

```txt
POST /api/status
host:decentraland.org
content-type:multipart/form-data
x-identity-expiration:2020-01-01T00:00:00Z
name="avatar";filename="avatar.png";type="application/png";0x585460e3d01c950dd755f4c369bbf2edb9e6025fa88db029c02bfe6a89e5ec7f
name="email";size=22;0xfefe75065b68e4fb6ef79e1e5f542b84cfe6b8050b01f4ba05a64060131d534b
```

## References

- [`decentraland-crypto`](https://github.com/decentraland/decentraland-crypto)
- [Elements of an AWS Signature Version 4 request](https://docs.aws.amazon.com/general/latest/gr/sigv4_elements.html)
- [HTTP Authentication schemes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#authentication_schemes)
- [HTTP Authorization](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization)
- [HTTP Content-Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type)
- [HTTP Message Signatures](https://httpwg.org/http-extensions/draft-ietf-httpbis-message-signatures.html)
- [HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)
- [Media Type](https://developer.mozilla.org/en-US/docs/Glossary/MIME_type)
- [Javascript URL API](https://developer.mozilla.org/en-US/docs/Web/API/URL)
- [RFC3339: Date and Time on the Internet](https://datatracker.ietf.org/doc/html/rfc3339)
- [RFC3492: Internationalized Domain Names](https://datatracker.ietf.org/doc/html/rfc3492)
- [RFC3986: Uniform Resource Identifier](https://datatracker.ietf.org/doc/html/rfc3986)
- [RFC4627: JavaScript Object Notation](https://datatracker.ietf.org/doc/html/rfc4627)
- [RFC4648: The Base16, Base32, and Base64 Data Encodings](https://datatracker.ietf.org/doc/html/rfc4648)
- [Secure Hash Algorithms](https://en.wikipedia.org/wiki/Secure_Hash_Algorithms)
