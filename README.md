# console-logger

A console logger for TypeScript projects.

## Features

- Multiple log levels (trace, debug, verbose, info, warn, error)
- Customizable output formatting, including colors and styles
- Elapsed time tracking
- Chainable API for easy use

## Installation

```bash
npm install @epdoc/console-logger
```

## Usage

```typescript
import { log } from '@epdoc/console-logger';

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
one of the methods `info`, `error`, `trace`, `debug`, `verbose` or `output` are
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
log.indent().info('This is indented');
log.info('This is not indented');
```

### Using Headers

```typescript
log.h1('Big Header').info('This is a big header');
log.h2('Smaller Header').info('This is a smaller header');
```

### Using Styles

```typescript
log.style('h1', 'This is a big header').info('This is a big header');
log.style('h2', 'This is a smaller header').info('This is a smaller header');
```

### Using Colors

```typescript
log.color('red', 'This is red text').info('This is red text');
log.color('green', 'This is green text').info('This is green text');
log.color('blue', 'This is blue text').info('This is blue text');
```

### Using Background Colors

```typescript
log.bgColor('red', 'This is red text').info('This is red text');
log.bgColor('green', 'This is green text').info('This is green text');
log.bgColor('blue', 'This is blue text').info('This is blue text');
```

### Using Colors

```typescript
log.color('red', 'This is red text').info('This is red text');
log.color('green', 'This is green text').info('This is green text');
log.color('blue', 'This is blue text').info('This is blue text');
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
- `isEnabledFor(level: LogLevel): boolean`
- `elapsed(): this`
- `clear(): this`
- `text(...args: any[]): this`
- `data(arg: any): this`
- `res(...args: any[]): this`
- `res2(...args: any[]): this`
- `action(...args: any[]): this`
- `h1(...args: any[]): this`
- `h2(...args: any[]): this`
- `h3(...args: any[]): this`
- `label(...args: any[]): this`
- `value(...args: any[]): this`
- `path(...args: any[]): this`
- `date(arg: any): this`
- `alert(arg: any): this`
- `warn(...args: any[]): this`
- `error(...args: any[]): this`
- `trace(...args: any[]): this`
- `debug(...args: any[]): this`
- `verbose(...args: any[]): this`
- `info(...args: any[]): this`
- `output(...args: any[]): this`
- `skip(val: any): boolean`

### LogLevel Enum

- `trace = 1`
- `debug = 3`
- `verbose = 5`
- `info = 7`
- `warn = 8`
- `error = 9`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.