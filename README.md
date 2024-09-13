# console-logger

A simple, customizable console logger for Node.js with terminal color support
and method chaining.

## Features

- Multiple log levels (trace, debug, verbose, info, warn, error)
- Customizable output formatting, including colors and styles
- Chainable API - `log.h1('header').info('plain text')`
- Can include elapsed time in log messages - `log.elapsed().info('Finished')`
- Mock mode for testing - `log.mock.enable = true; log.info('test');`

## Installation

```bash
npm install @epdoc/console-logger
```

## Usage

```typescript
import { Logger } from '@epdoc/console-logger';

// Declare one global logger instance and import it wherever you need to log
const log:LoggerInstance = new Logger({enableStyles:true});

log.info('Hello, world!');
```

### Type Safety for Dynamic Methods

When creating a logger instance, we recommend using:

```typescript
const log: LoggerInstance = new Logger();
```

instead of:

```typescript
const log = new Logger();
```

The `LoggerInstance` type includes all the dynamically added style methods (like
`h1`, `h2`, `text`, etc.) that are not part of the original `Logger` class
definition. These methods are added at runtime, but TypeScript needs to know
about them at compile time.

By using `LoggerInstance`, you get full type safety and autocompletion for all
logger methods, including the dynamically added ones. This approach combines the
flexibility of runtime method creation with the benefits of static typing.

Runtime loading of methods also allows for custom styles to be added, which is
demonstrated in the [Custom Styles](#custom-styles) section below.


### Changing Log Level

The default log level is `LogLevel.info`. You can change the log level in the
constructor or at any time using the `setLevel` method.

```typescript
log.setLevel(LogLevel.debug);
log.debug('Now this debug message will be shown');
```


### Using Prefixes

You can enable level and time prefixes when initializing the logger:

```typescript
const log:LoggerInstance = new Logger({ levelPrefix: true, timePrefix: 'local' });
log.info('Hello'); // Outputs: "14:30:45 [INFO] Hello"
```

The timePrefix can be one of the following values:

- `'local'` - local time
- `'utc'` - UTC time
- `'elapsed'` - elapsed time since application start
- `false` - no time prefix

### Chaining Methods

A line of output can be built up using method chaining, and is only output when
one of the methods `trace`, `debug`, `verbose`, `info` or `output` are
called.

```typescript
log.text('User:').value('John Doe').info('logged in');
```

### Using Elapsed Time Suffic

The elapsed time since application start, and the time since the last call to
elapsed() can be appended to the output.

```typescript
log.h1('Starting operation').info();
// ... some code ...
log.tab().text('Operation completed').elapsed().info();
```

### Using Indentation

```typescript
log.indent().info('This is indented by the default 2 spaces');
log.tab().text('This is also indented by 2 spaces').info();
log.indent('>>').info('This is indented by ">> "');
log.indent(4).info('This is indented by 4 spaces');
log.tab(2).text('This is also indented by 4 spaces').info();
log.tab(2).info('This is also indented by 4 spaces');
log.info('This is not indented');
```

### Using Headers

```typescript
log.h1('Big Header').info('This is a big header');
log.h2('Smaller Header').info('This is a smaller header');
```

### Lines for Testing or just because

If you want to collect lines for testing or just because, you can use the
`setKeepLines` method or initialize the logger with `keepLines: true`.

```typescript
log.setKeepLines(true);
log.info('Test message');
log.info('Test message 2');
console.log(log.lines); // ['Test message', 'Test message 2']
```

## Custom Styles

You can provide your own custom styles when initializing the logger. Here's how:

1. Define your custom styles:

```typescript
import { StyleDef, Color } from 'your-logger-package';
const customStyles: Record<string, StyleDef> = {
success: { fg: Color.green },
warning: { fg: Color.yellow },
critical: { fg: Color.red, bg: Color.white },
// Add more custom styles as needed
};
```

2. Pass the custom styles when creating a new logger instance:

```typescript
const log:LoggerInstance = new Logger({
level: LogLevel.info,
styles: customStyles
});
```

3. Use your custom styles in your logs:
```typescript
log.success('Operation completed successfully');
log.warning('Proceed with caution');
log.critical('System failure detected');
```


## API Reference

### Logger Class

- `constructor({level: LogLevel = LogLevel.info, keepLines: boolean = false, timePrefix: 'local' | 'utc' | 'elapsed' | false = 'local', levelPrefix: boolean = false})`
- `setLevel(level: LogLevel | string): this`
- `getLevel(): LogLevel`
- `isEnabledFor(level: LogLevel): boolean`
- `setStyle(style: Style): this`
- `getStyle(): Style`
- `setLevelPrefix(val: boolean): this`
- `setTimePrefix(val: TimePrefix): this`
- `setElapsed(val: Elapsed): this`
- `setKeepLines(val: boolean): this`
- `elapsed(): this`
- `clearLines(): this`
- `clearLine(): this`

#### Methods for Pre-formatted Text, using declared styles

- `text(...args: any[]): this`
- `data(arg: any): this`
- `h1(...args: any[]): this`
- `h2(...args: any[]): this`
- `h3(...args: any[]): this`
- `label(...args: any[]): this`
- `action(...args: any[]): this`
- `value(...args: any[]): this`
- `path(...args: any[]): this`
- `critical(...args: any[]): this`
- `fatal(...args: any[]): this`

#### Support methods for Pre-formatted Text, regardless of styles

- `data(arg: any): this`
- `stylize(style: StyleName | StyleDef, ...args: any[]): this`
- `tab(val: Integer = 2): this`
- `indent(n: Integer = 2): this`

#### Methods for Output

- `trace(...args: any[]): this`
- `debug(...args: any[]): this`
- `verbose(...args: any[]): this`
- `info(...args: any[]): this`
- `warn(...args: any[]): this`
- `error(...args: any[]): this`
- `output(...args: any[]): this`

### LogLevel Enum

- `trace = 1`
- `debug = 3`
- `verbose = 5`
- `info = 7`
- `warn = 8`
- `error = 9`

## License

This project is licensed under the MIT License.


