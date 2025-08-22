package com.email.assistant.controller;

import com.email.assistant.dto.EmailRequest;
import com.email.assistant.service.EmailGeneratorService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // ✅ Allow extension to call backend
public class EmailGeneratorController {

    private static final Logger log = LoggerFactory.getLogger(EmailGeneratorController.class);

    private final EmailGeneratorService emailGeneratorService;

    @PostMapping("/generate")
    public ResponseEntity<Map<String, String>> generateEmail(@RequestBody EmailRequest request) {
        log.info("📥 Incoming request: {}", request);

        String emailContent = request.getEmailContent();
        String tone = request.getTone() != null ? request.getTone() : "neutral";
        String mode = request.getMode() != null ? request.getMode() : "reply";

        if (emailContent == null || emailContent.isBlank()) {
            log.error("❌ Email content is missing!");
            return ResponseEntity.badRequest().body(Map.of("error", "Email content cannot be empty"));
        }

        String prompt;
        if ("summarize".equalsIgnoreCase(mode)) {
            prompt = "Summarize this email in a clear, structured format:\n\n" + emailContent;
        } else {
            prompt = "Write a professional reply to this email in a " + tone + " tone:\n\n" + emailContent;
        }

        try {
            String result = emailGeneratorService.generateEmail(prompt);
            return ResponseEntity.ok(Map.of("result", result));
        } catch (Exception e) {
            log.error("❌ Error while generating email", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to generate email"));
        }
    }
}
