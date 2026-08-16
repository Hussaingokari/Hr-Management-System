package com.hrms.util;

import java.util.regex.Pattern;

public class PasswordValidator {
    
    // Pattern: 8 alphabets (first uppercase) + 1 special char + 3 digits
    // Example: Hussainb@123
    private static final String PASSWORD_PATTERN = 
        "^[A-Z][a-zA-Z]{7}[@#$%!&*?]\\d{3}$";
    
    private static final Pattern pattern = Pattern.compile(PASSWORD_PATTERN);
    
    public static boolean isValidPassword(String password) {
        if (password == null) {
            return false;
        }
        return pattern.matcher(password).matches();
    }
    
    public static String getPasswordRequirements() {
        return "Password must be exactly 12 characters: " +
               "8 alphabets (first letter UPPERCASE) + " +
               "1 special character (@#$%!&*?) + " +
               "3 digits. Example: Hussainb@123";
               
    }
}