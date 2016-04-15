"use strict"

import React from 'react';
import once from 'once';
import ieXDomain from 'httpplease/plugins/oldiexdomain';

let httpplease = require('httpplease');

let InlineSVGError;
let Status;
let configurationError;
let createError;
let delay;
let getHash;
let isSupportedEnvironment;
let me;
let supportsInlineSVG;
let uniquifyIDs;
let unsupportedBrowserError;
const slice = [].slice;
const extend = (child, parent) =>
{
  for (let key in parent)
  {
    if (hasProp.call(parent, key))
    {
      child[key] = parent[key];
    }
  }
  function ctor()
  {
    this.constructor = child;
  }

  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
  child.__super__ = parent.prototype;
  return child;
};
var hasProp = {}.hasOwnProperty;


let PropTypes = React.PropTypes;
let span = React.DOM.span;
let http = httpplease.use(ieXDomain);

Status = {
  PENDING: 'pending',
  LOADING: 'loading',
  LOADED: 'loaded',
  FAILED: 'failed',
  UNSUPPORTED: 'unsupported'
};

supportsInlineSVG = once(() =>
{
  let div;
  if (!document)
  {
    return false;
  }
  div = document.createElement('div');
  div.innerHTML = '<svg />';
  return div.firstChild && div.firstChild.namespaceURI === 'http://www.w3.org/2000/svg';
});

delay = fn => function ()
{
  let args, newFunc;
  args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
  newFunc = () => fn.apply(null, args);
  setTimeout(newFunc, 0);
};

isSupportedEnvironment = once(() => ((typeof window !== "undefined" && window !== null ? window.XMLHttpRequest : void 0) || (typeof window !== "undefined" && window !== null ? window.XDomainRequest : void 0)) && supportsInlineSVG());

uniquifyIDs = ((() =>
{
  let idPattern, mkAttributePattern;
  mkAttributePattern = attr => `(?:(?:\\s|\\:)${attr})`;
  idPattern = RegExp(`(?:(${mkAttributePattern('id')})="([^"]+)")|(?:(${mkAttributePattern('href')}|${mkAttributePattern('role')}|${mkAttributePattern('arcrole')})="\\#([^"]+)")|(?:="url\\(\\#([^\\)]+)\\)")`, "g");
  return (svgText, svgID) =>
  {
    let uniquifyID;
    uniquifyID = id => `${id}___${svgID}`;
    return svgText.replace(idPattern, (m, p1, p2, p3, p4, p5) =>
    {
      if (p2)
      {
        return `${p1}="${uniquifyID(p2)}"`;
      }
      else if (p4)
      {
        return `${p3}="#${uniquifyID(p4)}"`;
      }
      else if (p5)
      {
        return `="url(#${uniquifyID(p5)})"`;
      }
    });
  };
}))();

getHash = str =>
{
  let chr, hash, i, j, ref;
  hash = 0;
  if (!str)
  {
    return hash;
  }
  for (i = j = 0, ref = str.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j)
  {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash = hash & hash;
  }
  return hash;
};

InlineSVGError = ((superClass =>
{
  extend(InlineSVGError, superClass);

  InlineSVGError.prototype.name = 'InlineSVGError';

  InlineSVGError.prototype.isSupportedBrowser = true;

  InlineSVGError.prototype.isConfigurationError = false;

  InlineSVGError.prototype.isUnsupportedBrowserError = false;

  function InlineSVGError(message1)
  {
    this.message = message1;
  }

  return InlineSVGError;

}))(Error);

createError = (message, attrs) =>
{
  let err, k, v;
  err = new InlineSVGError(message);
  for (k in attrs)
  {
    if (!hasProp.call(attrs, k))
    {
      continue;
    }
    v = attrs[k];
    err[k] = v;
  }
  return err;
};

unsupportedBrowserError = message =>
{
  if (message == null)
  {
    message = 'Unsupported Browser';
  }
  return createError(message, {
    isSupportedBrowser: false,
    isUnsupportedBrowserError: true
  });
};

configurationError = message => createError(message, {
  isConfigurationError: true
});

let getRequestsByUrl = {};
let loadedIcons = {};

let createGetOrUseCacheForUrl = (url, callback) => {
  if( loadedIcons[url] )
  {
    let params = loadedIcons[url];

    delay(() => callback(params[0], params[1]))();
  }

  if( !getRequestsByUrl[url] )
  {
    getRequestsByUrl[url] = [];

    http.get(url, (err, res) => {
      getRequestsByUrl[url].forEach(function(callback)
      {
        loadedIcons[url] = [err, res];
        callback(err, res);
      })
    });
  }

  getRequestsByUrl[url].push(callback);
}

export default React.createClass({
  statics: {
    getRequestsByUrl,
    createGetOrUseCacheForUrl,
    Status
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
    uniquifyIDs: PropTypes.bool,
    cacheGetRequests: PropTypes.bool
  },
  getDefaultProps() {
    return {
      wrapper: span,
      supportTest: isSupportedEnvironment,
      uniquifyIDs: true,
      cacheGetRequests: true
    };
  },
  getInitialState() {
    return {
      status: Status.PENDING
    };
  },
  componentDidMount() {
    if (this.state.status !== Status.PENDING)
    {
      return;
    }
    if (this.props.supportTest())
    {
      if (this.props.src)
      {
        return this.setState({
          status: Status.LOADING
        }, this.load);
      }
      else
      {
        return delay(((_this => () => _this.fail(configurationError('Missing source'))))(this))();
      }
    }
    else
    {
      return delay(((_this => () => _this.fail(unsupportedBrowserError())))(this))();
    }
  },
  fail(error) {
    let status;
    status = error.isUnsupportedBrowserError ? Status.UNSUPPORTED : Status.FAILED;
    return this.setState({
      status
    }, ((_this => () =>
    {
      let base;
      return typeof (base = _this.props).onError === "function" ? base.onError(error) : void 0;
    }))(this));
  },
  handleLoad(err, res) {
    if (err)
    {
      return this.fail(err);
    }
    if (!this.isMounted())
    {
      return;
    }
    return this.setState({
      loadedText: res.text,
      status: Status.LOADED
    }, ((_this => () =>
    {
      let base;
      return typeof (base = _this.props).onLoad === "function" ? base.onLoad() : void 0;
    }))(this));
  },
  load() {
    let m, text;
    if (m = this.props.src.match(/data:image\/svg[^,]*?(;base64)?,(.*)/))
    {
      text = m[1] ? atob(m[2]) : decodeURIComponent(m[2]);
      return this.handleLoad(null, {
        text
      });
    }
    else
    {
      if (this.props.cacheGetRequests)
      {
        return createGetOrUseCacheForUrl(
            this.props.src,
            this.handleLoad
        )
      }
      else
      {
        return http.get(this.props.src, this.handleLoad);
      }
    }
  },
  getClassName() {
    let className;
    className = `isvg ${this.state.status}`;
    if (this.props.className)
    {
      className += ` ${this.props.className}`;
    }
    return className;
  },
  render() {
    return this.props.wrapper({
      className: this.getClassName(),
      dangerouslySetInnerHTML: this.state.loadedText ? {
        __html: this.processSVG(this.state.loadedText)
      } : void 0
    }, this.renderContents());
  },
  processSVG(svgText) {
    if (this.props.uniquifyIDs)
    {
      return uniquifyIDs(svgText, getHash(this.props.src));
    }
    else
    {
      return svgText;
    }
  },
  renderContents() {
    switch (this.state.status)
    {
      case Status.UNSUPPORTED:
        return this.props.children;
      case Status.PENDING:
      case Status.LOADING:
        if (this.props.preloader)
        {
          return new this.props.preloader;
        }
    }
  }
});
