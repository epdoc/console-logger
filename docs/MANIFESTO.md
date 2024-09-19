This is a logging library to use with node.js appications. A description of the design is as follows.

There is a log manager (LogManager) that the user initializes with a set of transports and other properties. It is meant to be a singleton. For now, all the tranports are provided by this project. These include a console logger, a file logger and a buffer (string array) logger. We will later also include transports for loggly and SOS.

The LogManager returns a logger (Logger) with properties indicating the transport, whether to emit timestamp, level, colorization. Also can set what the level threshold is on a per transport basis, or inherit from log manager by default. So you may tell the LogManager what the threshold is, or you may tell the Logger. Usually it is the LogManager.

A logger will buffer log messages in memory until a tranport is set up. Normally only one Logger will be used in a project that uses this library. It's instance will be exported so that the entire project can use it.


Each logger instance can handle requests to have a line generator (LoggerLine)  with a particular id, called the request or session ID. The logger has options for whether to show this ID or not in the log messages because, in the simplest case, only one LoggerLine is needed for a CLI application. And if this is the case, there is not much reason to show the request ID (called reqId).

The log manager gets passed in an AppTimer, which is inherited down to the Logger and then the LoggerLine. Or the user of this package can set their own. You can get a new LoggerLine from the Logger each with a new AppTimer. This can be used to show start, progress and end times for a request.

In a none express or koa situation you can request a new LoggerLine per operation and thus this can be used to time operations.

You cannot nest LoggerLine for requests within requests. Instead you can request a new LoggerLine object and use a nesting notation within the request ID. Eg. ReqId.subFunction would be the reqID.

This works because output messages are not nested. They are output to the transport in a time linear fashion.

LoggerLine has options for styles: whether to output colors, which is inherited from the transport. It also has a data output method which can output an actual object to some transports, or stringify the data otherwise.

In a Koa or Express situation, you would normally set a new reqID for each request that the server handles. And so you will have different Logger objects for each request. 