package com.rohilla.crm.common.util;

public final class KycMaskingUtils {

    private KycMaskingUtils() {
    }

    /**
     * Masks Aadhaar number showing only the last 4 digits (e.g., "XXXX XXXX 1234").
     */
    public static String maskAadhaar(String rawAadhaar) {
        if (rawAadhaar == null || rawAadhaar.trim().isEmpty()) {
            return null;
        }
        String clean = rawAadhaar.replaceAll("[^0-9]", "");
        if (clean.length() >= 4) {
            String last4 = clean.substring(clean.length() - 4);
            return "XXXX XXXX " + last4;
        }
        return "XXXX XXXX XXXX";
    }

    /**
     * Masks PAN number showing the first 5 characters masked, middle 4 masked, and last char visible (e.g., "XXXXX1234X" -> "XXXXX" + last 4/5 or "XXXXX1234X").
     */
    public static String maskPan(String rawPan) {
        if (rawPan == null || rawPan.trim().isEmpty()) {
            return null;
        }
        String clean = rawPan.trim().toUpperCase();
        if (clean.length() == 10) {
            return "XXXXX" + clean.substring(5);
        } else if (clean.length() > 4) {
            return "XXXXX" + clean.substring(clean.length() - 4);
        }
        return "XXXXXXXXXX";
    }
}
