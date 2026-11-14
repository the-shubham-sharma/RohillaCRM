package com.rohilla.crm.common.util;

public final class PhoneUtils {

    private PhoneUtils() {
    }

    /**
     * Cleans phone string by stripping spaces, dashes, parentheses, and leading +91 / 91 / 0 if it results in a 10-digit number.
     * Returns exactly 10 digits if valid, or the sanitized string.
     */
    public static String cleanPhoneNumber(String rawPhone) {
        if (rawPhone == null) {
            return null;
        }
        String cleaned = rawPhone.trim().replaceAll("[\\s\\-\\(\\)]", "");
        
        // If prefixed with +91 or 91 with 12 characters
        if (cleaned.startsWith("+91") && cleaned.length() == 13) {
            cleaned = cleaned.substring(3);
        } else if (cleaned.startsWith("91") && cleaned.length() == 12) {
            cleaned = cleaned.substring(2);
        } else if (cleaned.startsWith("0") && cleaned.length() == 11) {
            cleaned = cleaned.substring(1);
        }
        return cleaned;
    }

    /**
     * Validates if a phone string is a valid Indian 10-digit mobile number.
     * Contains exactly 10 digits.
     */
    public static boolean isValid10DigitPhone(String rawPhone) {
        if (rawPhone == null) {
            return false;
        }
        String cleaned = cleanPhoneNumber(rawPhone);
        return cleaned != null && cleaned.matches("^[0-9]{10}$");
    }

    /**
     * Returns formatted international WhatsApp number (e.g. "+919810001111") if valid 10 digits.
     */
    public static String toWhatsAppFormat(String rawPhone) {
        if (!isValid10DigitPhone(rawPhone)) {
            return null;
        }
        String cleaned = cleanPhoneNumber(rawPhone);
        return "+91" + cleaned;
    }
}
