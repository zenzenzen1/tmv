package nl.altindag.log;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public final class LogCaptor implements AutoCloseable {

	private final Logger logger;
	private final Level originalLevel;
	private final ListAppender<ILoggingEvent> listAppender;

	private LogCaptor(Class<?> targetClass) {
		LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();
		this.logger = (Logger) LoggerFactory.getLogger(targetClass);
		this.originalLevel = logger.getLevel();

		this.listAppender = new ListAppender<>();
		this.listAppender.setContext(context);
		this.listAppender.start();
		this.logger.addAppender(this.listAppender);
	}

	public static LogCaptor forClass(Class<?> targetClass) {
		return new LogCaptor(Objects.requireNonNull(targetClass));
	}

	public void setLogLevelToInfo() {
		logger.setLevel(Level.INFO);
	}

	public List<String> getInfoLogs() {
		return getLogsByLevel(Level.INFO);
	}

	public List<String> getWarnLogs() {
		return getLogsByLevel(Level.WARN);
	}

	public List<String> getErrorLogs() {
		return getLogsByLevel(Level.ERROR);
	}

	private List<String> getLogsByLevel(Level level) {
		List<ILoggingEvent> events = new ArrayList<>(listAppender.list);
		return events.stream()
			.filter(e -> e.getLevel() != null && e.getLevel().isGreaterOrEqual(level) && e.getLevel().equals(level))
			.map(ILoggingEvent::getFormattedMessage)
			.collect(Collectors.toList());
	}

	@Override
	public void close() {
		try {
			logger.detachAppender(this.listAppender);
		} finally {
			logger.setLevel(originalLevel);
			this.listAppender.stop();
		}
	}
}


