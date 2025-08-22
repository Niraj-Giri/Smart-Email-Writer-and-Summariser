package com.email.assistant.service;

import com.email.assistant.dto.EmailResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class EmailGeneratorService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate;

    // ✅ Only one constructor, Spring will autowire RestTemplateBuilder here
    public EmailGeneratorService(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    public String generateEmail(String prompt) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + "gemini-2.0-flash:generateContent?key=" + apiKey;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        EmailResponse response = restTemplate.postForObject(url, entity, EmailResponse.class);

        if (response != null &&
                response.getCandidates() != null &&
                !response.getCandidates().isEmpty()) {

            return response.getCandidates()
                    .get(0)
                    .getContent()
                    .getParts()
                    .get(0)
                    .getText();
        }

        return "No response from Gemini API";
    }
}
