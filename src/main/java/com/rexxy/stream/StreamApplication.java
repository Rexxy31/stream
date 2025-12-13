package com.rexxy.stream;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.util.TimeZone;

@SpringBootApplication
public class StreamApplication {

	public static void main(String[] args) {
		// Use UTC for database compatibility - display timezone handled by Jackson
		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
		SpringApplication.run(StreamApplication.class, args);
	}

}
