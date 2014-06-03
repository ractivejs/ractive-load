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


## Using ractive-load in node.js

Many components will work in node.js environments without any changes. This allows you to render HTML from components in, for example, Express.js apps.

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
