package com.vayam.music;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

@SpringBootApplication
public class MusicApplication {

	public static void main(String[] args) {
		loadEnv();
		SpringApplication.run(MusicApplication.class, args);
	}

	private static void loadEnv() {
		File envFile = new File(".env");
		if (envFile.exists() && envFile.isFile()) {
			try {
				Files.readAllLines(envFile.toPath(), StandardCharsets.UTF_8).forEach(line -> {
					String trimmed = line.trim();
					if (!trimmed.isEmpty() && !trimmed.startsWith("#") && trimmed.contains("=")) {
						int delimiterIndex = trimmed.indexOf('=');
						String key = trimmed.substring(0, delimiterIndex).trim();
						String value = trimmed.substring(delimiterIndex + 1).trim();

						if ((value.startsWith("\"") && value.endsWith("\"")) ||
								(value.startsWith("'") && value.endsWith("'"))) {
							value = value.substring(1, value.length() - 1);
						}

						if (System.getProperty(key) == null && System.getenv(key) == null) {
							System.setProperty(key, value);
						}
					}
				});
			} catch (IOException e) {
				System.err.println("Warning: Could not read .env file: " + e.getMessage());
			}
		}
	}
}

