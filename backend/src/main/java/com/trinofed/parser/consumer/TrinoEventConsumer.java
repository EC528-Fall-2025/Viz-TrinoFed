package com.trinofed.parser.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trinofed.parser.model.QueryEvent;
import com.trinofed.parser.model.TrinoEventWrapper;
import com.trinofed.parser.service.QueryEventService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class TrinoEventConsumer {

    private final ObjectMapper objectMapper;
    private final QueryEventService queryEventService;

    @Autowired
    public TrinoEventConsumer(ObjectMapper objectMapper, QueryEventService queryEventService) {
        this.objectMapper = objectMapper;
        this.queryEventService = queryEventService;
    }

    @KafkaListener(topics = "${trino.kafka.topic}", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(String message) {
        try {
            log.debug("Received Kafka message: {}", message);

            // Parse the nested Trino event structure
            TrinoEventWrapper wrapper = objectMapper.readValue(message, TrinoEventWrapper.class);

            // Convert to QueryEvent for processing
            QueryEvent event = wrapper.toQueryEvent();

            if (event == null) {
                log.warn("Failed to convert Trino event to QueryEvent - missing metadata");
                return;
            }

            log.info("Parsed query event: queryId={}, eventType={}, state={}, query={}",
                    event.getQueryId(), event.getEventType(), event.getState(),
                    event.getQuery() != null ? event.getQuery().substring(0, Math.min(50, event.getQuery().length())) : "null");

            queryEventService.processEvent(event);

        } catch (JsonProcessingException e) {
            log.error("Failed to parse Kafka message: {}", message, e);
        } catch (Exception e) {
            log.error("Error processing event", e);
        }
    }
}
