#!/usr/bin/env node
import argv from "commander"
import * as fs from "fs"
import * as packageConfig from "./package.json"
import { TcpProxy, TcpProxyOptions } from "./tcp-proxy"

const t = argv
argv
    .usage("[options]")
    .version(packageConfig.version)
    .option("-p, --proxyPort <number>", "Proxy port number", parseInt)
    .option("-h, --hostname [name]", "Name or IP address of host")
    .option("-n, --serviceHost <name>",
        "Name or IP address of service host(s); " +
        "if this is a comma separated list, " +
        "proxy performs round-robin load balancing")
    .option("-s, --servicePort <number>", "Service port number(s); " +
        "if this a comma separated list," +
        "it should have as many entries as serviceHost")
    .option("-q, --q", "Be quiet")
    .option("-t, --tls [both]", "Use TLS 1.2 with clients; " +
        "specify both to also use TLS 1.2 with service", false)
    .option("-u, --rejectUnauthorized [value]",
        "Do not accept invalid certificate", false)
    .option("-c, --pfx [file]", "Private key file for proxy secure socket (https)")
    .option("-a, --passphrase [value]",
        "Passphrase to access private key file for secure socket (https)", "abcd")
    .option("-x, --pfx-client [file]", "Private key file for secure socket to service (client certificate)")
    .option("-z, --passphrase-client [value]",
        "Passphrase to access private key file for secure socket to service (client certificate)", "abcd")
        .action(() => {
            const xx = argv
            const options: TcpProxyOptions = {
                hostname: argv.hostname,
                passphrase: argv.passphrase,
                pfx: argv.pfx,
                quiet: argv.q,
                rejectUnauthorized: argv.rejectUnauthorized && argv.rejectUnauthorized !== "false",
                serviceClientPassphrase: argv.passphraseClient,
                serviceClientPfx: argv.pfxClient,
                tls: argv.tls,
            }

            const proxy = new TcpProxy(argv.proxyPort,
                argv.serviceHost, argv.servicePort, options)

            process.on("uncaughtException", (err) => {
            // tslint:disable-next-line: no-console
                console.error(err)
                proxy.end()
            })

            process.on("SIGINT", () => {
                proxy.end()
            })
                    })
    .parse(process.argv)
