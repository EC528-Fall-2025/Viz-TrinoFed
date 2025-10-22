package com.trinofed.parser;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;

@SpringBootApplication
@EnableKafka
public class TrinoKafkaParserApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrinoKafkaParserApplication.class, args);
    }
}
