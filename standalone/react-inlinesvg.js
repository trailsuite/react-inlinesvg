"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _once = require('once');

var _once2 = _interopRequireDefault(_once);

var _oldiexdomain = require('httpplease/plugins/oldiexdomain');

var _oldiexdomain2 = _interopRequireDefault(_oldiexdomain);

var _atob = require('atob');

var _atob2 = _interopRequireDefault(_atob);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

global.atob = _atob2.default;

var httpplease = require('httpplease');

var InlineSVGError = void 0;
var Status = void 0;
var configurationError = void 0;
var createError = void 0;
var delay = void 0;
var getHash = void 0;
var isSupportedEnvironment = void 0;
var me = void 0;
var supportsInlineSVG = void 0;
var uniquifyIDs = void 0;
var unsupportedBrowserError = void 0;
var slice = [].slice;
var extend = function extend(child, parent) {
  for (var key in parent) {
    if (hasProp.call(parent, key)) {
      child[key] = parent[key];
    }
  }
  function ctor() {
    this.constructor = child;
  }

  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
  child.__super__ = parent.prototype;
  return child;
};
var hasProp = {}.hasOwnProperty;

var PropTypes = _react2.default.PropTypes;
var span = _react2.default.DOM.span;
var http = httpplease.use(_oldiexdomain2.default);

Status = {
  PENDING: 'pending',
  LOADING: 'loading',
  LOADED: 'loaded',
  FAILED: 'failed',
  UNSUPPORTED: 'unsupported'
};

supportsInlineSVG = (0, _once2.default)(function () {
  var div = void 0;
  if (!document) {
    return false;
  }
  div = document.createElement('div');
  div.innerHTML = '<svg />';
  return div.firstChild && div.firstChild.namespaceURI === 'http://www.w3.org/2000/svg';
});

delay = function delay(fn) {
  return function () {
    var args = void 0,
        newFunc = void 0;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    newFunc = function newFunc() {
      return fn.apply(null, args);
    };
    setTimeout(newFunc, 0);
  };
};

isSupportedEnvironment = (0, _once2.default)(function () {
  return ((typeof window !== "undefined" && window !== null ? window.XMLHttpRequest : void 0) || (typeof window !== "undefined" && window !== null ? window.XDomainRequest : void 0)) && supportsInlineSVG();
});

uniquifyIDs = function () {
  var idPattern = void 0,
      mkAttributePattern = void 0;
  mkAttributePattern = function mkAttributePattern(attr) {
    return '(?:(?:\\s|\\:)' + attr + ')';
  };
  idPattern = RegExp('(?:(' + mkAttributePattern('id') + ')="([^"]+)")|(?:(' + mkAttributePattern('href') + '|' + mkAttributePattern('role') + '|' + mkAttributePattern('arcrole') + ')="\\#([^"]+)")|(?:="url\\(\\#([^\\)]+)\\)")', "g");
  return function (svgText, svgID) {
    var uniquifyID = void 0;
    uniquifyID = function uniquifyID(id) {
      return id + '___' + svgID;
    };
    return svgText.replace(idPattern, function (m, p1, p2, p3, p4, p5) {
      if (p2) {
        return p1 + '="' + uniquifyID(p2) + '"';
      } else if (p4) {
        return p3 + '="#' + uniquifyID(p4) + '"';
      } else if (p5) {
        return '="url(#' + uniquifyID(p5) + ')"';
      }
    });
  };
}();

getHash = function getHash(str) {
  var chr = void 0,
      hash = void 0,
      i = void 0,
      j = void 0,
      ref = void 0;
  hash = 0;
  if (!str) {
    return hash;
  }
  for (i = j = 0, ref = str.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash = hash & hash;
  }
  return hash;
};

InlineSVGError = function (superClass) {
  extend(InlineSVGError, superClass);

  InlineSVGError.prototype.name = 'InlineSVGError';

  InlineSVGError.prototype.isSupportedBrowser = true;

  InlineSVGError.prototype.isConfigurationError = false;

  InlineSVGError.prototype.isUnsupportedBrowserError = false;

  function InlineSVGError(message1) {
    this.message = message1;
  }

  return InlineSVGError;
}(Error);

createError = function createError(message, attrs) {
  var err = void 0,
      k = void 0,
      v = void 0;
  err = new InlineSVGError(message);
  for (k in attrs) {
    if (!hasProp.call(attrs, k)) {
      continue;
    }
    v = attrs[k];
    err[k] = v;
  }
  return err;
};

unsupportedBrowserError = function unsupportedBrowserError(message) {
  if (message == null) {
    message = 'Unsupported Browser';
  }
  return createError(message, {
    isSupportedBrowser: false,
    isUnsupportedBrowserError: true
  });
};

configurationError = function configurationError(message) {
  return createError(message, {
    isConfigurationError: true
  });
};

exports.default = _react2.default.createClass({
  statics: {
    Status: Status
  },
  displayName: 'InlineSVG',
  propTypes: {
    wrapper: PropTypes.func,
    src: PropTypes.string.isRequired,
    className: PropTypes.string,
    preloader: PropTypes.func,
    onLoad: PropTypes.func,
    onError: PropTypes.func,
    supportTest: PropTypes.func,
    uniquifyIDs: PropTypes.bool
  },
  getDefaultProps: function getDefaultProps() {
    return {
      wrapper: span,
      supportTest: isSupportedEnvironment,
      uniquifyIDs: true
    };
  },
  getInitialState: function getInitialState() {
    return {
      status: Status.PENDING
    };
  },
  componentDidMount: function componentDidMount() {
    if (this.state.status !== Status.PENDING) {
      return;
    }
    if (this.props.supportTest()) {
      if (this.props.src) {
        return this.setState({
          status: Status.LOADING
        }, this.load);
      } else {
        return delay(function (_this) {
          return function () {
            return _this.fail(configurationError('Missing source'));
          };
        }(this))();
      }
    } else {
      return delay(function (_this) {
        return function () {
          return _this.fail(unsupportedBrowserError());
        };
      }(this))();
    }
  },
  fail: function fail(error) {
    var status = void 0;
    status = error.isUnsupportedBrowserError ? Status.UNSUPPORTED : Status.FAILED;
    return this.setState({
      status: status
    }, function (_this) {
      return function () {
        var base = void 0;
        return typeof (base = _this.props).onError === "function" ? base.onError(error) : void 0;
      };
    }(this));
  },
  handleLoad: function handleLoad(err, res) {
    if (err) {
      return this.fail(err);
    }
    if (!this.isMounted()) {
      return;
    }
    return this.setState({
      loadedText: res.text,
      status: Status.LOADED
    }, function (_this) {
      return function () {
        var base = void 0;
        return typeof (base = _this.props).onLoad === "function" ? base.onLoad() : void 0;
      };
    }(this));
  },
  load: function load() {
    var m = void 0,
        text = void 0;
    if (m = this.props.src.match(/data:image\/svg[^,]*?(;base64)?,(.*)/)) {
      text = m[1] ? (0, _atob2.default)(m[2]) : decodeURIComponent(m[2]);
      return this.handleLoad(null, {
        text: text
      });
    } else {
      return http.get(this.props.src, this.handleLoad);
    }
  },
  getClassName: function getClassName() {
    var className = void 0;
    className = 'isvg ' + this.state.status;
    if (this.props.className) {
      className += ' ' + this.props.className;
    }
    return className;
  },
  render: function render() {
    return this.props.wrapper({
      className: this.getClassName(),
      dangerouslySetInnerHTML: this.state.loadedText ? {
        __html: this.processSVG(this.state.loadedText)
      } : void 0
    }, this.renderContents());
  },
  processSVG: function processSVG(svgText) {
    if (this.props.uniquifyIDs) {
      return uniquifyIDs(svgText, getHash(this.props.src));
    } else {
      return svgText;
    }
  },
  renderContents: function renderContents() {
    switch (this.state.status) {
      case Status.UNSUPPORTED:
        return this.props.children;
      case Status.PENDING:
      case Status.LOADING:
        if (this.props.preloader) {
          return new this.props.preloader();
        }
    }
  }
});
