# console-logger

A console logger with color support and method chaining.

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
const log:LoggerInstance = new Logger();
// Enable color output
log.style.enable(true);

log.info('Hello, world!');
```

### Changing Log Level

The default log level is `LogLevel.info`. You can change the log level at any time using the `setLevel` method.

```typescript
log.setLevel(LogLevel.debug);
log.debug('Now this debug message will be shown');
```

### Chaining Methods

A line of output can be built up using method chaining, and is only output when
one of the methods `trace`, `debug`, `verbose`, `info` or `output` are
called.

```typescript
log.text('User:').value('John Doe').info('logged in');
```

### Using Elapsed Time

The elapsed time since application start, and the time since the last call to
elapsed() are appended to the output.

```typescript
log.h1('Starting operation').info();
// ... some code ...
log.res('Operation completed').elapsed().info();
```

### Using Indentation

```typescript
log.indent().info('This is indented by the default 2 spaces');
log.res('This is also indented by 2 spaces').info();
log.indent('>>').info('This is indented by ">> "');
log.indent(4).info('This is indented by 4 spaces');
log.res2('This is also indented by 4 spaces').info();
log.res2().info('This is also indented by 4 spaces');
log.info('This is not indented');
```

### Using Headers

```typescript
log.h1('Big Header').info('This is a big header');
log.h2('Smaller Header').info('This is a smaller header');
```

### Mock Mode for Testing

```typescript
log.mock.enable = true;
log.info('Test message');
console.log(log.mock.value); // ['Test message']
```

## API Reference

### Logger Class

- `constructor(level: LogLevel = LogLevel.info)`
- `setLevel(level: LogLevel | string): this`
- `getLevel(): LogLevel`
- `style: Style` (setter and getter)
- `isEnabledFor(level: LogLevel): boolean`
- `elapsed(): this`
- `clear(): this`

#### Methods for Pre-formatted Text

- `text(...args: any[]): this`
- `data(arg: any): this`
- `h1(...args: any[]): this`
- `h2(...args: any[]): this`
- `h3(...args: any[]): this`
- `label(...args: any[]): this`
- `action(...args: any[]): this`
- `value(...args: any[]): this`
- `path(...args: any[]): this`
- `date(arg: any): this`
- `alert(arg: any): this`
- `warn(...args: any[]): this`
- `error(...args: any[]): this`
- `stylize(style: StyleName | StyleDef, ...args: any[]): this`
- `res(...args: any[]): this`
- `res2(...args: any[]): this`
- `indent(n: Integer = 2): this`

#### Methods for Output

- `trace(...args: any[]): this`
- `debug(...args: any[]): this`
- `verbose(...args: any[]): this`
- `info(...args: any[]): this`
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
const log = new Logger({
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
Custom styles will be merged with default styles, overwriting any conflicts.

