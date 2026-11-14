package com.rohilla.crm.security.rate_limit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class RateLimiterService {

    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();
    private final int capacity;
    private final int tokensPerMinute;

    public RateLimiterService(
            @Value("${app.rate-limit.login-capacity:5}") int capacity,
            @Value("${app.rate-limit.login-tokens-per-minute:5}") int tokensPerMinute) {
        this.capacity = capacity;
        this.tokensPerMinute = tokensPerMinute;
    }

    public boolean tryConsumeLoginAttempt(String clientKey) {
        Bucket bucket = loginBuckets.computeIfAbsent(clientKey, k -> createNewLoginBucket());
        boolean consumed = bucket.tryConsume(1);
        if (!consumed) {
            log.warn("Rate limit exceeded for clientKey: {}", clientKey);
        }
        return consumed;
    }

    private Bucket createNewLoginBucket() {
        Bandwidth limit = Bandwidth.classic(
                capacity,
                Refill.greedy(tokensPerMinute, Duration.ofMinutes(1))
        );
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    public void clearLimit(String clientKey) {
        loginBuckets.remove(clientKey);
    }
}
