function _assert_this_initialized(self) {
    if (self === void 0) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self;
}
function _call_super(_this, derived, args) {
    derived = _get_prototype_of(derived);
    return _possible_constructor_return(_this, _is_native_reflect_construct() ? Reflect.construct(derived, args || [], _get_prototype_of(_this).constructor) : derived.apply(_this, args));
}
function _class_call_check(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _construct(Parent, args, Class) {
    if (_is_native_reflect_construct()) {
        _construct = Reflect.construct;
    } else {
        _construct = function construct(Parent, args, Class) {
            var a = [
                null
            ];
            a.push.apply(a, args);
            var Constructor = Function.bind.apply(Parent, a);
            var instance = new Constructor();
            if (Class) _set_prototype_of(instance, Class.prototype);
            return instance;
        };
    }
    return _construct.apply(null, arguments);
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _get_prototype_of(o) {
    _get_prototype_of = Object.setPrototypeOf ? Object.getPrototypeOf : function getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _get_prototype_of(o);
}
function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of(subClass, superClass);
}
function _is_native_function(fn) {
    return Function.toString.call(fn).indexOf("[native code]") !== -1;
}
function _possible_constructor_return(self, call) {
    if (call && (_type_of(call) === "object" || typeof call === "function")) {
        return call;
    }
    return _assert_this_initialized(self);
}
function _set_prototype_of(o, p) {
    _set_prototype_of = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of(o, p);
}
function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
function _wrap_native_super(Class) {
    var _cache = typeof Map === "function" ? new Map() : undefined;
    _wrap_native_super = function wrapNativeSuper(Class) {
        if (Class === null || !_is_native_function(Class)) return Class;
        if (typeof Class !== "function") {
            throw new TypeError("Super expression must either be null or a function");
        }
        if (typeof _cache !== "undefined") {
            if (_cache.has(Class)) return _cache.get(Class);
            _cache.set(Class, Wrapper);
        }
        function Wrapper() {
            return _construct(Class, arguments, _get_prototype_of(this).constructor);
        }
        Wrapper.prototype = Object.create(Class.prototype, {
            constructor: {
                value: Wrapper,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        return _set_prototype_of(Wrapper, Class);
    };
    return _wrap_native_super(Class);
}
function _is_native_reflect_construct() {
    try {
        var result = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
    } catch (_) {}
    return (_is_native_reflect_construct = function() {
        return !!result;
    })();
}
import { spawn } from "node:child_process";
var _process_env_SYSTEM_AUDIO_RECORDER_BINARY_PATH;
var BINARY_PATH = (_process_env_SYSTEM_AUDIO_RECORDER_BINARY_PATH = process.env.SYSTEM_AUDIO_RECORDER_BINARY_PATH) !== null && _process_env_SYSTEM_AUDIO_RECORDER_BINARY_PATH !== void 0 ? _process_env_SYSTEM_AUDIO_RECORDER_BINARY_PATH : require.resolve("./bin/SystemAudioRecorder");
var AUDIO_DETAILS_START = "Audio format details: ";
var SystemAudioRecorderError = /*#__PURE__*/ function(Error1) {
    "use strict";
    _inherits(SystemAudioRecorderError, Error1);
    function SystemAudioRecorderError(message) {
        _class_call_check(this, SystemAudioRecorderError);
        var _this;
        _this = _call_super(this, SystemAudioRecorderError, [
            message
        ]);
        _this.name = "SystemAudioRecorderError";
        return _this;
    }
    return SystemAudioRecorderError;
}(_wrap_native_super(Error));
var SystemAudioRecorderNotStartedError = /*#__PURE__*/ function(SystemAudioRecorderError) {
    "use strict";
    _inherits(SystemAudioRecorderNotStartedError, SystemAudioRecorderError);
    function SystemAudioRecorderNotStartedError() {
        _class_call_check(this, SystemAudioRecorderNotStartedError);
        var _this;
        _this = _call_super(this, SystemAudioRecorderNotStartedError, [
            "System Audio Recorder not started"
        ]);
        _this.name = "SystemAudioRecorderNotStartedError";
        return _this;
    }
    return SystemAudioRecorderNotStartedError;
}(SystemAudioRecorderError);
var SystemAudioRecorderSubprocessError = /*#__PURE__*/ function(SystemAudioRecorderError) {
    "use strict";
    _inherits(SystemAudioRecorderSubprocessError, SystemAudioRecorderError);
    function SystemAudioRecorderSubprocessError(message, subprocessStderr) {
        _class_call_check(this, SystemAudioRecorderSubprocessError);
        var _this;
        _this = _call_super(this, SystemAudioRecorderSubprocessError, [
            "System Audio Recorder subprocess error: " + message
        ]), _define_property(_this, "subprocessStderr", void 0);
        _this.name = "SystemAudioRecorderSubprocessError";
        _this.subprocessStderr = subprocessStderr;
        return _this;
    }
    return SystemAudioRecorderSubprocessError;
}(SystemAudioRecorderError);
export var SystemAudioRecorder = /*#__PURE__*/ function() {
    "use strict";
    function SystemAudioRecorder() {
        _class_call_check(this, SystemAudioRecorder);
        _define_property(this, "childProcess", null);
        _define_property(this, "audioDetails", null);
        _define_property(this, "stderrBuffer", "");
        _define_property(this, "isStopped", true);
    }
    _create_class(SystemAudioRecorder, [
        {
            key: "spawnChildProcess",
            value: function spawnChildProcess() {
                var childProcess = spawn(BINARY_PATH, [], {
                    stdio: [
                        "inherit",
                        "pipe",
                        "pipe"
                    ]
                });
                this.childProcess = childProcess;
            }
        },
        {
            key: "handleStderr",
            value: function handleStderr() {
                var _this = this;
                this.audioDetails = new Promise(function(resolve) {
                    if (!_this.childProcess) throw new SystemAudioRecorderNotStartedError();
                    var foundAudioDetails = false;
                    _this.childProcess.stderr.on("data", function(data) {
                        _this.stderrBuffer += data;
                        if (foundAudioDetails) return;
                        if (!_this.stderrBuffer.includes(AUDIO_DETAILS_START)) return;
                        var maybeAudioDetails = _this.stderrBuffer.split(AUDIO_DETAILS_START)[1];
                        if (!maybeAudioDetails.includes("\n")) return;
                        var audioDetailsText = maybeAudioDetails.split("\n")[0];
                        var audioDetails = JSON.parse(audioDetailsText);
                        foundAudioDetails = true;
                        resolve(audioDetails);
                    });
                });
            }
        },
        {
            key: "handleError",
            value: function handleError() {
                var _this = this;
                if (!this.childProcess) throw new SystemAudioRecorderNotStartedError();
                this.childProcess.on("error", function(error) {
                    throw new SystemAudioRecorderSubprocessError(String(error), _this.stderrBuffer);
                });
            }
        },
        {
            key: "start",
            value: function start() {
                this.spawnChildProcess();
                this.handleStderr();
                this.handleError();
                this.isStopped = false;
            }
        },
        {
            key: "stop",
            value: function stop() {
                if (!this.childProcess) return;
                this.childProcess.kill();
                this.isStopped = true;
            }
        },
        {
            key: "getAudioDetails",
            value: function getAudioDetails() {
                if (!this.childProcess || this.audioDetails === null) {
                    throw new SystemAudioRecorderNotStartedError();
                }
                return this.audioDetails;
            }
        },
        {
            key: "getStream",
            value: function getStream() {
                if (!this.childProcess || this.isStopped) {
                    throw new SystemAudioRecorderNotStartedError();
                }
                return this.childProcess.stdout;
            }
        }
    ]);
    return SystemAudioRecorder;
}();
