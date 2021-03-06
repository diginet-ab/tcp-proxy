import * as fs from "fs"
import * as net from "net"
import * as tls from "tls"

export interface TcpProxyOptions {
    quiet?: boolean,
    passphrase?: string,
    tls?: false | "both" | "tls"
    pfx?: string,
    serviceClientPfx?: string,
    serviceClientKey?: string,
    serviceClientCert?: string,
    serviceClientPassphrase?: string,
    serviceCaCert?: string,
    serviceCaPassphrase?: string,
    rejectUnauthorized?: boolean,
    hostname?: string
}

interface ProxyContext {
    buffers: Buffer[],
    connected: boolean,
    proxySocket: net.Socket
    serviceSocket?: net.Socket
}

export class TcpProxy {
    public serviceHosts: string[] = []
    public servicePorts: number[] = []
    public serviceHostIndex = -1
    public proxyTlsOptions?: tls.TlsOptions
    public serviceTlsOptions?: tls.ConnectionOptions
    public proxySockets: { [key: string]: net.Socket } = {}
    public server?: net.Server

    constructor(public proxyPort: number, serviceHost: string | string[], servicePort: number | number[], public options: TcpProxyOptions = { quiet: false }) {
        if (proxyPort && serviceHost && servicePort) {
            this.serviceHosts = parseString(serviceHost)
            this.servicePorts = parseNumber(servicePort)
            this.proxyTlsOptions = {
                passphrase: this.options.passphrase,
                secureProtocol: "TLSv1_2_method",
            }
            if (this.options.tls !== undefined && this.options.tls !== false && this.options.pfx) {
                this.proxyTlsOptions.pfx = fs.readFileSync(this.options.pfx)
                if (this.options.serviceCaCert)
                    this.proxyTlsOptions.ca = fs.readFileSync(this.options.serviceCaCert)
            }

            this.serviceTlsOptions = {
                cert: this.options.serviceClientCert ? fs.readFileSync(this.options.serviceClientCert) : undefined,
                key: this.options.serviceClientKey ? fs.readFileSync(this.options.serviceClientKey) : undefined,
                passphrase: this.options.serviceClientPassphrase,
                pfx: this.options.serviceClientPfx ? fs.readFileSync(this.options.serviceClientPfx) : undefined,
                rejectUnauthorized: this.options.rejectUnauthorized,
                secureProtocol: "TLSv1_2_method",
            }
            this.createListener()
        } else
// tslint:disable-next-line: no-console
            console.log("Missing arguments")
    }

    public end() {
        if (this.server)
            this.server.close()
        for (const key in this.proxySockets) {
            if (key)
                this.proxySockets[key].destroy()
        }
        if (this.server)
            this.server.unref()
    }

    protected createListener = () => {
        if (this.options.tls !== undefined && this.options.tls !== false) {
            this.server = tls.createServer(this.proxyTlsOptions!, (socket) => {
                this.handleClient(socket)
            })
        } else {
            this.server = net.createServer((socket) => {
                this.handleClient(socket)
            })
        }
        this.server.listen(this.proxyPort, this.options.hostname, () => this.log("Listening on " + (this.options.hostname ? this.options.hostname : "0.0.0.0") + ":" + this.proxyPort + " while proxying " + this.serviceHosts.toString() + ":" + this.servicePorts.toString()))
    }

    protected handleClient = (proxySocket: net.Socket) => {
        const key = uniqueKey(proxySocket)
        this.proxySockets[key] = proxySocket
        const context: ProxyContext = {
            buffers: [],
            connected: false,
            proxySocket,
        }
        this.createServiceSocket(context)
        proxySocket.on("data", (data) => {
            this.log("Received data from proxy. Length " + data.length)
            if (context.serviceSocket) {
                if (context.connected) {
                    context.serviceSocket.write(data)
                } else {
                    context.buffers[context.buffers.length] = data
                }
            }
        })
        proxySocket.on("close", (hadError) => {
            delete this.proxySockets[uniqueKey(proxySocket)]
            if (context.serviceSocket)
                context.serviceSocket.destroy()
        })
    }

    protected createServiceSocket = (context: ProxyContext) => {
        const i = this.getServiceHostIndex()
        if (this.options.tls === "both") {
            context.serviceSocket = tls.connect(this.servicePorts[i],
                this.serviceHosts[i], this.serviceTlsOptions, () => {
                    this.writeBuffer(context)
                })
        } else {
            context.serviceSocket = new net.Socket()
            context.serviceSocket.connect(this.servicePorts[i],
                this.serviceHosts[i], () => {
                    this.writeBuffer(context)
                })
        }
        if (context.serviceSocket) {
            context.serviceSocket.on("data", (data) => {
                this.log("Received data from service. Length " + data.length)
                context.proxySocket.write(data)
            })
            context.serviceSocket.on("close", (hadError) => {
                context.proxySocket.destroy()
            })
            context.serviceSocket.on("error", (e) => {
                context.proxySocket.destroy()
            })
        }
    }

    protected getServiceHostIndex = () => {
        this.serviceHostIndex++
        if (this.serviceHostIndex === this.serviceHosts.length) {
            this.serviceHostIndex = 0
        }
        return this.serviceHostIndex
    }

    protected writeBuffer(context: ProxyContext) {
        context.connected = true
        for (const buf of context.buffers) {
            if (context.serviceSocket)
                context.serviceSocket.write(buf)
        }
    }
    protected counter = 0
    protected log(msg: string) {
        this.counter++;
        if (!this.options.quiet) {
            // tslint:disable-next-line: no-console
            console.log(this.counter.toString() + " " + msg)
        }
    }
}

function uniqueKey(socket: net.Socket) {
    const key = socket.remoteAddress + ":" + socket.remotePort
    return key
}

function parseString(o: string | string[]) {
    if (typeof o === "string") {
        return o.split(",")
    } else if (Array.isArray(o)) {
        return o
    } else {
        throw new Error("cannot parse object: " + o)
    }
}

function parseNumber(o: string | number | number[]) {
    if (typeof o === "string") {
        return o.split(",").map(value => parseInt(value, 10))
    } else if (typeof o === "number") {
        return [o]
    } else if (Array.isArray(o)) {
        return o
    } else {
        throw new Error("cannot parse object: " + o)
    }
}
