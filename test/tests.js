"use strict"

let assert, assertContainsSvg, checkLoadCount, isvg, renderComponent, span;

assert = chai.assert;

isvg = ReactInlineSVG;

span = React.DOM.span;

renderComponent = component => {
  let div;
  div = document.createElement('div');
  div.style.display = 'none';
  document.body.appendChild(div);
  React.renderComponent(component, div);
  return div;
};

assertContainsSvg = (el, done) => {
  if ($(el).find('svg').length) {
    return done();
  } else {
    return done(new Error('Missing SVG'));
  }
};

checkLoadCount = (url, handleLoad, counter, done) => {
  counter.push('call');
  console.dir(counter);
  console.log(counter.length);
  if (counter.length > 1) {
    return done(new Error('too many calls'));
  } else {
    return handleLoad(null, '<path d="M8 5v14l11-8z"/>') && done();
  }
};

describe('react-inlinesvg', () => {
  it('should request an SVG only once when caching', done => {
    let counter, el;
    counter = [];
    el = renderComponent(isvg({
      src: 'https://raw.githubusercontent.com/google/material-design-icons/master/av/svg/production/ic_play_arrow_24px.svg',
      loadResource(url, handleLoad) {
        return checkLoadCount(url, handleLoad, counter, done);
      },
      onError: done
    }));
    return el = renderComponent(isvg({
      src: 'https://raw.githubusercontent.com/google/material-design-icons/master/av/svg/production/ic_play_arrow_24px.svg',
      loadResource(url, handleLoad) {
        return checkLoadCount(url, handleLoad, counter, done);
      },
      onError: done
    }));
  });
  it('should load an svg', done => {
    let el;
    return el = renderComponent(isvg({
      src: 'tiger.svg',
      onError: done,
      onLoad() {
        return assertContainsSvg(el, done);
      }
    }));
  });
  it('should load a base64 data-uri', done => {
    let el;
    return el = renderComponent(isvg({
      src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICAgIDxwYXRoIGQ9Ik04IDV2MTRsMTEtN3oiLz4KICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz4KPC9zdmc+Cg==',
      onError: done,
      onLoad() {
        return setTimeout((() => assertContainsSvg(el, done)), 0);
      }
    }));
  });
  it('should load a non-base64 data-uri', done => {
    let el;
    return el = renderComponent(isvg({
      src: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22M8%205v14l11-7z%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M0%200h24v24H0z%22%20fill%3D%22none%22%2F%3E%0A%3C%2Fsvg%3E%0A',
      onError: done,
      onLoad() {
        return setTimeout((() => assertContainsSvg(el, done)), 0);
      }
    }));
  });
  it('should call onError for a 404', done => renderComponent(isvg({
    src: 'DOESNOTEXIST.svg',
    onError() {
      return done();
    }
  })));
  it('should load SVGs from a CORS-enabled domain', done => {
    let el;
    return el = renderComponent(isvg({
      src: 'http://localhost:1338/test/tiger.svg',
      onError: done,
      onLoad() {
        return assertContainsSvg(el, done);
      }
    }));
  });
  it('should should show children if loading not supported', done => {
    let el;
    return el = renderComponent(isvg({
      src: 'DOESNOTEXIST.svg',
      supportTest() {
        return false;
      },
      onError(err) {
        if (/MISSINGNO/.test(el.innerHTML)) {
          return done();
        } else {
          return done(new Error('Missing fallback contents'));
        }
      }
    }, span(null, ''), span(null, 'MISSINGNO')));
  });
  it('should should NOT show children on error', done => {
    let el;
    return el = renderComponent(isvg({
      src: 'DOESNOTEXIST.svg',
      onError() {
        if (/MISSINGNO/.test(el.innerHTML)) {
          return done(new Error('Children shown even though loading is supported'));
        } else {
          return done();
        }
      }
    }, span(null, 'MISSINGNO')));
  });
  return describe('errors', () => it('should have a status code HTTP errors', done => renderComponent(isvg({
    src: 'DOESNOTEXIST.svg',
    onError(err) {
      if (err.isHttpError && err.status === 404) {
        return done();
      } else {
        return done(new Error('Error missing information'));
      }
    }
  }))));
});
