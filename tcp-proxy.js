"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var net = __importStar(require("net"));
var tls = __importStar(require("tls"));
var TcpProxy = /** @class */ (function () {
    function TcpProxy(proxyPort, serviceHost, servicePort, options) {
        if (options === void 0) { options = { quiet: false }; }
        var _this = this;
        this.proxyPort = proxyPort;
        this.options = options;
        this.serviceHostIndex = -1;
        this.proxySockets = {};
        this.createListener = function () {
            if (_this.options.tls !== false) {
                _this.server = tls.createServer(_this.proxyTlsOptions, function (socket) {
                    _this.handleClient(socket);
                });
            }
            else {
                _this.server = net.createServer(function (socket) {
                    _this.handleClient(socket);
                });
            }
            _this.server.listen(_this.proxyPort, _this.options.hostname);
        };
        this.handleClient = function (proxySocket) {
            var key = uniqueKey(proxySocket);
            _this.proxySockets[key] = proxySocket;
            var context = {
                buffers: [],
                connected: false,
                proxySocket: proxySocket,
            };
            _this.createServiceSocket(context);
            proxySocket.on("data", function (data) {
                _this.log("Data from client. Length: " + data.byteLength);
                if (context.serviceSocket) {
                    if (context.connected) {
                        context.serviceSocket.write(data);
                    }
                    else {
                        context.buffers[context.buffers.length] = data;
                    }
                }
            });
            proxySocket.on("close", function (hadError) {
                delete _this.proxySockets[uniqueKey(proxySocket)];
                if (context.serviceSocket)
                    context.serviceSocket.destroy();
            });
        };
        this.createServiceSocket = function (context) {
            var i = _this.getServiceHostIndex();
            if (_this.options.tls === "both") {
                context.serviceSocket = tls.connect(_this.servicePorts[i], _this.serviceHosts[i], _this.serviceTlsOptions, function () {
                    _this.writeBuffer(context);
                });
            }
            else {
                context.serviceSocket = new net.Socket();
                context.serviceSocket.connect(_this.servicePorts[i], _this.serviceHosts[i], function () {
                    _this.writeBuffer(context);
                });
            }
            context.serviceSocket.on("data", function (data) {
                context.proxySocket.write(data);
                _this.log("Data from host. Length: " + data.byteLength);
            });
            context.serviceSocket.on("close", function (hadError) {
                context.proxySocket.destroy();
            });
            context.serviceSocket.on("error", function (e) {
                context.proxySocket.destroy();
            });
        };
        this.getServiceHostIndex = function () {
            _this.serviceHostIndex++;
            if (_this.serviceHostIndex === _this.serviceHosts.length) {
                _this.serviceHostIndex = 0;
            }
            return _this.serviceHostIndex;
        };
        this.serviceHosts = parseString(serviceHost);
        this.servicePorts = parseNumber(servicePort);
        this.proxyTlsOptions = {
            passphrase: this.options.proxyPassphrase,
            secureProtocol: "TLSv1_2_method",
        };
        if (this.options.tls !== false && this.options.proxyPfx) {
            this.proxyTlsOptions.pfx = fs.readFileSync(this.options.proxyPfx);
        }
        this.serviceTlsOptions = {
            cert: this.options.serviceClientCert ? fs.readFileSync(this.options.serviceClientCert) : undefined,
            key: this.options.serviceClientKey ? fs.readFileSync(this.options.serviceClientKey) : undefined,
            passphrase: this.options.serviceClientPassphrase,
            pfx: this.options.serviceClientPfx ? fs.readFileSync(this.options.serviceClientPfx) : undefined,
            rejectUnauthorized: this.options.rejectUnauthorized,
            secureProtocol: "TLSv1_2_method",
        };
        this.createListener();
    }
    TcpProxy.prototype.end = function () {
        if (this.server)
            this.server.close();
        for (var key in this.proxySockets) {
            if (key)
                this.proxySockets[key].destroy();
        }
        if (this.server)
            this.server.unref();
    };
    TcpProxy.prototype.writeBuffer = function (context) {
        context.connected = true;
        if (context.buffers.length > 0) {
            for (var _i = 0, _a = context.buffers; _i < _a.length; _i++) {
                var buf = _a[_i];
                if (context.serviceSocket)
                    context.serviceSocket.write(buf);
            }
        }
    };
    TcpProxy.prototype.log = function (msg) {
        if (!this.options.quiet) {
            // tslint:disable-next-line: no-console
            console.log(msg);
        }
    };
    return TcpProxy;
}());
exports.TcpProxy = TcpProxy;
function uniqueKey(socket) {
    var key = socket.remoteAddress + ":" + socket.remotePort;
    return key;
}
function parseString(o) {
    if (typeof o === "string") {
        return o.split(",");
    }
    else if (Array.isArray(o)) {
        return o;
    }
    else {
        throw new Error("cannot parse object: " + o);
    }
}
function parseNumber(o) {
    if (typeof o === "number") {
        return [o];
    }
    else if (Array.isArray(o)) {
        return o;
    }
    else {
        throw new Error("cannot parse object: " + o);
    }
}
//# sourceMappingURL=tcp-proxy.js.map