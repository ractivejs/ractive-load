# Ractive.js load plugin

*Find more Ractive.js plugins at [ractivejs.org/plugins](http://ractivejs.org/plugins)*

[See the demo here.](http://ractivejs.github.io/ractive-load/)


## Installation

This plugin works as an AMD module, as a CommonJS module, or as a regular script (it will be exposed as `Ractive.load`).

Include [ractive-load.js](https://raw.githubusercontent.com/ractivejs/ractive-load/master/ractive-load.js) on your page below Ractive, e.g:

```html
<script src='lib/ractive.js'></script>
<script src='lib/ractive-load.js'></script>
```

You can also fetch it with bower:

```
$ bower i ractive-load
```


## Usage

*TODO explain what Ractive components are...*

To load a component, along with any sub-components it depends on:

```js
Ractive.load( 'my-components/foo.html' ).then( function ( FooComponent ) {
  var ractive = new FooComponent({
    el: 'body',
    data: { ... }
  });
}).catch( handleError );
```

If all your components are located in a single folder, you can set the `baseUrl` property and the plugin will look for them there:

```js
Ractive.load.baseUrl = 'my-components/';
Ractive.load( 'foo.html' ).then( function ( FooComponent ) {
  // use component
}).catch( handleError );
```

*TODO loading multiple components*


## Defining module dependencies

Ideally, components should not care what environment they're being used in - an AMD app, node.js, or a standard browser environment without module loaders.

So if a component has external dependencies, there's a standard way to use them. Suppose you have some app config that sits outside your component:

```html
<p>foo: {{config.foo}}</p>

<script>
  var config = require( 'config' );
  component.exports = {
    data: { config: config }
  };
</script>
```

Here, we're importing the app config with `require('config')`. If this component was being used in an AMD app, or if it was being transformed by browserify, it would defer to the AMD or browserify implementation of `require`.

But outside of AMD, browserify and node, `require` doesn't mean anything. So, inside a component, ractive-load provides a specialised `require` function. Using our `config` example, `require` will first look for `Ractive.load.modules.config`, then for `window.config` (if we're in a browser), and then will fall back to using an existing `require` implementation (e.g. if we're in node.js).

In other words, this is the easiest way to make `config` available to a component:

```js
Ractive.load.modules.config = myConfig;
```

## Using ractive-load in node.js

Many components will work in node.js environments without any changes. This allows you to render HTML from components using the same templates and data as you use on the client.

Install it in the usual way:

```
$ npm i ractive-load
```

Then, in your app, use it in the normal way:

```js
var load = require( 'ractive-load' );
load( 'my-components/foo.html' ).then( function ( FooComponent ) {
  var ractive = new FooComponent({
    data: { ... }
  });

  // generate some HTML so that we can save it, or serve to a client
  var renderedHTML = ractive.toHTML();
}).catch( handleError );
```


## License

Copyright (c) 2014 Rich Harris. Licensed MIT

Created with the [Ractive.js plugin template](https://github.com/ractivejs/plugin-template) for Grunt.
