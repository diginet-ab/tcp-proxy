# tcp-proxy

A simple TCP proxy that may be used to access a service on another network. Supports client certificates.

Based on [node-tcp-proxy](https://github.com/tewarid/node-tcp-proxy), converted to TypeScript and with added support for client certificates.

To connect a local port to a remote (or local) service:

```bash
tcp-proxy  --proxyPort port [--hostname <name or IP>] --serviceHost host1,host2 --servicePort port1,port2 [--q] [--tls [both]] [--pfx file] [--passphrase secret]  [--pfx-client file] [--passphrase-client secret]
```

Optionally, `hostname` specifies the IP address to listen at. Node.js listens on unspecified IPv6 address `::` by default. If `serviceHost` and `servicePort` specify a comma separated list, the proxy will perform load balancing on a round-robin basis.

TLS can be enabled at the proxy port using the `tls` option. If followed by `both`, TLS is also used with the service. Use `pfx` option to specify server certificate, and `passphrase` to provide the password required to access it. Use `pfx-client` option to specify a client certificate for the service, and `passphrase-client` to provide the password required to access it.

## npm

Install node-tcp-proxy from [npm](https://www.npmjs.com/package/@diginet/tcp-proxy), thus
```
sudo npm install -g @diginet/tcp-proxy
```

## Programming Interface

To create a proxy in your own code

```typescript
import { TcpProxy, TcpProxyOptions } from "@diginet/tcp-proxy"
const newProxy = new TcPproxy(8080, "host", 10080)
```

To end the proxy

```typescript
newProxy.end()
```

`hostname` can be provided through an optional fourth parameter e.g. `{hostname: 0.0.0.0}` to `createProxy`. Console output may be silenced by adding `quiet: true` e.g. `{hostname: 0.0.0.0, quiet: true}`.

If you specify more than one service host and port pair, the proxy will perform round-robin load balancing

```typescript
const hosts = ["host1", "host2"]
const ports = [10080, 10080]
const newProxy = new TcpProxy(8080, hosts, ports)
// or const newProxy = new TcpProxy(8080, "host1,host2", "10080,10080")
```
