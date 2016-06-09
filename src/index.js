import React from 'react';
import once from 'once';
import httpplease from 'httpplease';
import ieXDomain from 'httpplease/plugins/oldiexdomain';
import { shouldComponentUpdate } from './shouldComponentUpdate';
console.log(httpplease.name)
console.dir(httpplease)
const http = httpplease.use(ieXDomain);

const Status = {
  PENDING: 'pending',
  LOADING: 'loading',
  LOADED: 'loaded',
  FAILED: 'failed',
  UNSUPPORTED: 'unsupported'
};

const supportsInlineSVG = once(() => {
  if (!document) {
    return false;
  }

  const div = document.createElement('div');
  div.innerHTML = '<svg />';
  return div.firstChild && div.firstChild.namespaceURI === 'http://www.w3.org/2000/svg';
});

const isSupportedEnvironment = once(() =>
  (
    (typeof window !== 'undefined' && window !== null ? window.XMLHttpRequest : void 0) ||
    (typeof window !== 'undefined' && window !== null ? window.XDomainRequest : void 0)
  ) &&
  supportsInlineSVG()
);

const uniquifyIDs = (() => {
  const mkAttributePattern = (attr) => `(?:(?:\\s|\\:)${attr})`;

  const idPattern = new RegExp(`(?:(${(mkAttributePattern('id'))})="([^"]+)")|(?:(${(mkAttributePattern('href'))}|${(mkAttributePattern('role'))}|${(mkAttributePattern('arcrole'))})="\\#([^"]+)")|(?:="url\\(\\#([^\\)]+)\\)")`, 'g');

  return (svgText, svgID) => {
    const uniquifyID = (id) => `${id}___${svgID}`;

    return svgText.replace(idPattern, (m, p1, p2, p3, p4, p5) => { //eslint-disable-line consistent-return
      if (p2) {
        return `${p1}="${(uniquifyID(p2))}"`;
      }
      else if (p4) {
        return `${p3}="#${(uniquifyID(p4))}"`;
      }
      else if (p5) {
        return `="url(#${(uniquifyID(p5))})"`;
      }
    });
  };
})();

const getHash = (str) => {
  let chr;
  let hash = 0;
  let i;
  let j;
  let len;

  if (!str) {
    return hash;
  }

  for (i = 0, j = 0, len = str.length; len <= 0 ? j < len : j > len; i = len <= 0 ? ++j : --j) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash = hash & hash;
  }
  return hash;
};

class InlineSVGError extends Error {
  constructor(message) {
    super();
    this.name = 'InlineSVGError';
    this.isSupportedBrowser = true;
    this.isConfigurationError = false;
    this.isUnsupportedBrowserError = false;
    this.message = message;

    return this;
  }
}

const createError = (message, attrs) => {
  const err = new InlineSVGError(message);

  Object.keys(attrs).forEach(k => {
    err[k] = attrs[k];
  });

  return err;
};

const unsupportedBrowserError = (message) => {
  let newMessage = message;

  if (newMessage === null) {
    newMessage = 'Unsupported Browser';
  }

  return createError(newMessage, {
    isSupportedBrowser: false,
    isUnsupportedBrowserError: true
  });
};

const configurationError = (message) => createError(message, {
  isConfigurationError: true
});

export default class InlineSVG extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      status: Status.PENDING
    };

    this.handleLoad = this.handleLoad.bind(this);
  }

  static propTypes = {
    children: React.PropTypes.node,
    className: React.PropTypes.string,
    onError: React.PropTypes.func,
    onLoad: React.PropTypes.func,
    preloader: React.PropTypes.func,
    src: React.PropTypes.string.isRequired,
    supportTest: React.PropTypes.func,
    uniquifyIDs: React.PropTypes.bool,
    wrapper: React.PropTypes.func
  };

  static defaultProps = {
    wrapper: React.DOM.span,
    supportTest: isSupportedEnvironment,
    uniquifyIDs: true
  };

  shouldComponentUpdate = shouldComponentUpdate;

  componentWillMount() {
    if (this.state.status === Status.PENDING) {
      if (this.props.supportTest()) {
        if (this.props.src) {
          this.setState({
            status: Status.LOADING
          }, this.load);
        }
        else {
          this.fail(configurationError('Missing source'));
        }
      }
      else {
        this.fail(unsupportedBrowserError());
      }
    }
  }

  fail(error) {
    const status = error.isUnsupportedBrowserError ? Status.UNSUPPORTED : Status.FAILED;

    this.setState({ status }, () => {
      if (typeof this.props.onError === 'function') {
        this.props.onError(error);
      }
    });
  }

  handleLoad(err, res) {
    if (err) {
      this.fail(err);
      return;
    }
    this.setState({
      loadedText: res.text,
      status: Status.LOADED
    }, () =>
        (typeof this.props.onLoad === 'function' ? this.props.onLoad() : null)
    );
  }

  load() {
    const match = this.props.src.match(/data:image\/svg[^,]*?(;base64)?,(.*)/);
    if (match) {
      return this.handleLoad(null, {
        text: match[1] ? atob(match[2]) : decodeURIComponent(match[2])
      });
    }
    console.log(httpplease.name)
    console.log(http)

    return http.get(this.props.src, this.handleLoad);
  }

  getClassName() {
    let className = `isvg ${this.state.status}`;

    if (this.props.className) {
      className += ` ${this.props.className}`;
    }

    return className;
  }

  processSVG(svgText) {
    if (this.props.uniquifyIDs) {
      return uniquifyIDs(svgText, getHash(this.props.src));
    }

    return svgText;
  }

  renderContents() {
    switch (this.state.status) {
      case Status.UNSUPPORTED:
        return this.props.children;
      default:
        return this.props.preloader;
    }
  }

  render() {
    return this.props.wrapper({
      className: this.getClassName(),
      dangerouslySetInnerHTML: this.state.loadedText ? {
        __html: this.processSVG(this.state.loadedText)
      } : undefined
    }, this.renderContents());
  }
}
