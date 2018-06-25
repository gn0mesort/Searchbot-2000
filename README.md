# `searchbot-2000`

`searchbot-2000` performs programmatic searches on many popular search engines.

## Installing

```sh
npm install -g gutfuckllc/searchbot-2000
```

## Running

`searchbot-2000` can be invoked either using a global or local install. To simply start the daemon with the default configuration you may use `npm start`. From a global install you may invoke it with the following options:

```txt
  Usage: searchbot-2000 [options]

  searchbot-2000 performs programmatic searches on many popular search engines.

  Options:

    -V, --version             output the version number
    -c, --config <path>       A configuration file to use in place of the configuration file in your home directory
    -q, --queries <path>      A list of search terms to pass to handlers. If no list is provided a default list is used
    -v, --verbose [loglevel]  Display verbose output. Log level will default to 'verbose'
    -l, --loop                Run in a loop even if the process is not a daemon
    -d, --daemonize           Run in the background as a daemon. Handlers will run periodically based on the 'jitter' setting
    -h, --help                output usage information
```

`searchbot-2000` requires access to an X server in UNIX-like environments. This is a limitation of [`nightmare`](https://github.com/segmentio/nightmare). In server environments it may be necessary to use [`xvfb`](https://www.x.org/archive/X11R7.6/doc/man/man1/Xvfb.1.xhtml) or similar. If no compatible server exists `searchbot-2000` may fail silently.

You may stop `searchbot-2000` by invoking `npm stop`, or `kill-searchbot-2000`.

## Configuration

`searchbot-2000` maybe configured either using the `config.json` file found in its directory or the `.searchbot-2000` file found in the current user's home directory. Using the home directory configuration file is preferred as it will override the default configuration without altering the default `config.json` file.

There are generally two levels of configuration in `searchbot-2000`. The application level configuration defines standard options that are passed to all handlers and the locations of handler files. Handler level configurations define options that are only relevant to the specific handler it is paired with. The default handlers all take the same configuration options but this is not a strict limitation. Third-party handlers may require other configuration options that are not documented here.

### Application Level Configuration Properties

`maxHandlers`

> This is the maximum number of handlers to run concurrently. Handlers each contain their own instance of nightmare and therefore do not depend on each other. Each nightmare instance comes with its own memory footprint though so when in doubt keep this low. Defaults to 2.

`jitter`

> The maximum amount of time (in minutes) to wait between runs of `searchbot-2000`. This option only applies when running in loop or daemon modes. Defaults to 10.

`handlers`

> An object containing information about the names and locations of `searchbot-2000` handlers. Each object should be of the following format:

```json
"<handler_name>": {
	"handler": "<absolute_path_to_script_file>",
	"config": "<absolute_path_to_config_file>"
}
```

> In general, it is best to use absolute paths. Relative paths are assumed to be relative to the `handlers` directory within `searchbot-2000`'s directory.

### Standard Handler Level Configuration Properties

`jitter`

> The maximum amount of time (in seconds) to wait when `waitJitter()` is called.

`maxDepth`

> The number of pages deep that the handler should search before stopping. Not all handlers use this property.

`minClicks`

> The minimum number of clicks that a handler should perform. In handlers that respect the `maxDepth` property, this is the minimum number of clicks per page.

`minConsoleLevel`

> The minimum log level that a message should have to be displayed in output console.

`nightmareConfig`

> An object containing objects to be passed to the handler's nightmare instance. For more information see the nightmare documentation.

`userAgent`

> The userAgent string to use for this handler. In general, you should use a common browser userAgent or you will increase your chances of being filtered.

## Queries

`searchbot-2000` comes with a default `queries.list` text file. This file is a simple line-by-line list of search terms to pass to handlers. The default list is available [here](http://www.mieliestronk.com/corncob_lowercase.txt). If you have specific queries that you wish to use you may replace the text of `queries.list` or use the `--queries` command line option.

## Extending `searchbot-2000`

`searchbot-2000` handlers are `nodejs` modules which accept an options object and an instance of [`nightmare`](https://www.npmjs.com/package/nightmare). All handlers are expected to return an integer. The simplest possible handler looks like this:

```js
module.exports = async function(opt, nightmare) {
  return 0;
}
```

There are not strict restrictions on what exactly a handler does. You should be careful about installing third-party handlers because they may run any arbitrary `nodejs` code. However, a handler is generally expected to define some set of operations to perform against a website.

### Handler Parameters

`opt`

> An object containing any options found in the handler configuration and various application level configuration options passed to the handler by `searchbot-2000`.

`nightmare`

> An instance of the nightmare browser object.

### Additional Handler Options

On top of the options found in the JSON configuration of each handler the following options are always passed by `searchbot-2000`:

`id`

> A valid `uuid` for this handler. This is generally used to identify the handler.

`name`

> The name of the handler. This is assumed to also be the property name of the handler object in the application configuration

`logLevel`

> The a desired minimum log level as passed by the application to each handler.

`logger`

> A default logger object for the handler.

`query`

> A query string to use in searches. This is a random string from `queries.list`.