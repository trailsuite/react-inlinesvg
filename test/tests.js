"use strict"
import {assert} from 'chai'
import testdom from 'testdom'
testdom('<html><body></body></html>') // must come before react import
global.navigator = {
  userAgent: 'node.js'
}

import atob from 'atob'
global.atob = atob

import mock from 'mock-require'

let React = require('react')
let ReactDOM = require('react-dom')
let TestUtils = require('react-addons-test-utils')
let assertContainsSvg
let span = React.DOM.span
let isvg
let svgResponse = {text: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'}

assertContainsSvg = (component, done) =>
{
  let el = ReactDOM.findDOMNode(component)

  if (el.getElementsByTagName('svg').length)
  {
    return done()
  }
  else
  {
    return done(new Error('Missing SVG'))
  }
}

describe('react-inlinesvg', () =>
{
  describe('where httpplease has been mocked out', () =>
  {
    before(() =>
    {
      let getCallCount = 0

      mock('httpplease', {
        use: (plugin) =>
        {
          return {
            get: (src, callback) =>
            {
              setTimeout(() => callback(++getCallCount > 1 ? new Error('Unexpected Second Call') : null, svgResponse), 0)
            }
          }
        }
      })

      let InlineSVG = require('../src/index')
      isvg = React.createFactory(InlineSVG)
    })

    it('should request an SVG only once when caching', done =>
    {
      let loadCallbacks = 0

      let component = TestUtils.renderIntoDocument(isvg({
            src: 'https://raw.githubusercontent.com/google/material-design-icons/master/av/svg/production/ic_play_arrow_24px.svg',
            onLoad: () => loadCallbacks++,
            cacheGetRequests: true
          }
      ))

      let secondComponent = TestUtils.renderIntoDocument(isvg({
            src: 'https://raw.githubusercontent.com/google/material-design-icons/master/av/svg/production/ic_play_arrow_24px.svg',
            onError: (err) =>
            {
              done(err)
            },
            onLoad: () =>
            {
              assert(loadCallbacks === 1)
              done()
            },
            cacheGetRequests: true
          }
      ))
    })
  })

  describe('where get returns an svg response', () =>
  {
    before(() =>
    {
      mock('httpplease', {
        use: (plugin) =>
        {
          return {
            get: (src, callback) =>
            {
              setTimeout(() => callback(null, svgResponse), 0)
            }
          }
        }
      })

      delete require.cache[require.resolve('../src/index')]

      let InlineSVG = require('../src/index')
      isvg = React.createFactory(InlineSVG)
    })

    it('should load an svg', done =>
    {
      let component = TestUtils.renderIntoDocument(isvg({
            src: 'https://raw.githubusercontent.com/google/material-design-icons/master/av/svg/production/ic_play_arrow_24px.svg',
            onError: done,
            onLoad: () =>
            {
              return assertContainsSvg(component, done)
            }
          }
      ))
    })

    it('should load a base64 data-uri', done =>
    {
      let component = TestUtils.renderIntoDocument(isvg({
        src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij4KICAgIDxwYXRoIGQ9Ik04IDV2MTRsMTEtN3oiLz4KICAgIDxwYXRoIGQ9Ik0wIDBoMjR2MjRIMHoiIGZpbGw9Im5vbmUiLz4KPC9zdmc+Cg==',
        onError: done,
        onLoad: () =>
        {
          return setTimeout((() => assertContainsSvg(component, done)), 0)
        }
      }))
    })

    it('should load a non-base64 data-uri', done =>
    {
      let component = TestUtils.renderIntoDocument(isvg({
        src: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22M8%205v14l11-7z%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M0%200h24v24H0z%22%20fill%3D%22none%22%2F%3E%0A%3C%2Fsvg%3E%0A',
        onError: done,
        onLoad: () =>
        {
          return setTimeout((() => assertContainsSvg(component, done)), 0)
        }
      }))
    })
  })

  describe('where get returns an error', () =>
  {
    before(() =>
    {
      mock('httpplease', {
        use: (plugin) =>
        {
          return {
            get: (src, callback) =>
            {
              setTimeout(() => callback({isHttpError: true, status: 404}, null), 0)
            }
          }
        }
      })

      delete require.cache[require.resolve('../src/index')]

      let InlineSVG = require('../src/index')
      isvg = React.createFactory(InlineSVG)
    })

    it('should call onError for a get failure', done =>
    {
      TestUtils.renderIntoDocument(isvg({
        src: 'DOESNOTEXIST.svg',
        onError() {
          return done()
        }
      }))
    })

    it('should should show children if loading not supported', done =>
    {
      let spanFactory = React.createFactory('span')

      let component = TestUtils.renderIntoDocument(isvg({
        src: 'DOESNOTEXIST.svg',
        supportTest() {
          return false
        },
        onError(err) {
          if (/MISSINGNO/.test(ReactDOM.findDOMNode(component).innerHTML))
          {
            return done()
          }
          else
          {
            return done(new Error('Missing fallback contents'))
          }
        }
      }, spanFactory(null, ''), spanFactory(null, 'MISSINGNO')))
    })

    it('should should NOT show children on error', done =>
    {
      let component = TestUtils.renderIntoDocument(isvg({
        src: 'DOESNOTEXIST.svg',
        onError: () =>
        {
          if (/MISSINGNO/.test(ReactDOM.findDOMNode(component).innerHTML))
          {
            return done(new Error('Children shown even though loading is supported'))
          }
          else
          {
            return done()
          }
        }
      }, span(null, 'MISSINGNO')))
    })

    it('should have a status code HTTP errors', done =>
    {
      let component = TestUtils.renderIntoDocument(isvg({
        src: 'DOESNOTEXIST.svg',
        onError: (err) =>
        {
          if (err.isHttpError && err.status === 404)
          {
            return done()
          }
          else
          {
            return done(new Error('Error missing information'))
          }
        }
      }))
    })
  })
})
