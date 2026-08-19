package com.hrms.util;

import java.util.regex.Pattern;

public class PasswordValidator {

    // Password requirements:
    // Minimum 8 characters
    // Maximum 20 characters
    // At least 1 uppercase letter
    // At least 1 lowercase letter
    // At least 1 digit
    // At least 1 special character

    private static final String PASSWORD_PATTERN =
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d\\s]).{8,20}$";

    private static final Pattern pattern =
            Pattern.compile(PASSWORD_PATTERN);

    public static boolean isValidPassword(String password) {

        if (password == null) {
            return false;
        }

        return pattern.matcher(password).matches();
    }

    public static String getPasswordRequirements() {

        return "Password must be between 8 and 20 characters " +
               "and contain at least one uppercase letter, " +
               "one lowercase letter, one number, " +
               "and one special character.";
    }
}