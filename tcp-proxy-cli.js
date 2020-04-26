#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = __importDefault(require("commander"));
var packageConfig = __importStar(require("./package.json"));
var tcp_proxy_1 = require("./tcp-proxy");
var t = commander_1.default;
commander_1.default
    .usage("[options]")
    .version(packageConfig.version)
    .option("-p, --proxyPort <number>", "Proxy port number", parseInt)
    .option("-h, --hostname [name]", "Name or IP address of host")
    .option("-n, --serviceHost <name>", "Name or IP address of service host(s); " +
    "if this is a comma separated list, " +
    "proxy performs round-robin load balancing")
    .option("-s, --servicePort <number>", "Service port number(s); " +
    "if this a comma separated list," +
    "it should have as many entries as serviceHost")
    .option("-q, --q", "Be quiet")
    .option("-t, --tls [both]", "Use TLS 1.2 with clients; " +
    "specify both to also use TLS 1.2 with service", false)
    .option("-u, --rejectUnauthorized [value]", "Do not accept invalid certificate", false)
    .option("-c, --pfx [file]", "Private key file for proxy secure socket (https)")
    .option("-a, --passphrase [value]", "Passphrase to access private key file for secure socket (https)", "abcd")
    .option("-x, --pfx-client [file]", "Private key file for secure socket to service (client certificate)")
    .option("-z, --passphrase-client [value]", "Passphrase to access private key file for secure socket to service (client certificate)", "abcd")
    .option("-k, --ca-cert [file]", "Private chain key file for secure socket (https)")
    .option("-j, --passphrase-ca [value]", "Passphrase to access private chain key file for secure socket (https)", "abcd")
    .action(function () {
    var xx = commander_1.default;
    var options = {
        hostname: commander_1.default.hostname,
        passphrase: commander_1.default.passphrase,
        pfx: commander_1.default.pfx,
        quiet: commander_1.default.q,
        rejectUnauthorized: commander_1.default.rejectUnauthorized && commander_1.default.rejectUnauthorized !== "false",
        serviceCaCert: commander_1.default.caCert,
        serviceClientPassphrase: commander_1.default.passphraseClient,
        serviceClientPfx: commander_1.default.pfxClient,
        tls: commander_1.default.tls,
    };
    var proxy = new tcp_proxy_1.TcpProxy(commander_1.default.proxyPort, commander_1.default.serviceHost, commander_1.default.servicePort, options);
    process.on("uncaughtException", function (err) {
        // tslint:disable-next-line: no-console
        console.error(err);
        proxy.end();
        proxy = new tcp_proxy_1.TcpProxy(commander_1.default.proxyPort, commander_1.default.serviceHost, commander_1.default.servicePort, options);
    });
    process.on("SIGINT", function () {
        proxy.end();
    });
})
    .parse(process.argv);
//# sourceMappingURL=tcp-proxy-cli.js.map