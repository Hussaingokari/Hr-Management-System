package com.hrms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdatePasswordRequest {

    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Current password is required")
    private String currentPassword;

    @NotBlank(message = "New password is required")
    @Pattern(
        regexp = "^[A-Z][a-zA-Z]{7}[@#$%!&*?]\\d{3}$",
        message = "Password must be exactly 12 characters: 8 alphabets + 1 special character + 3 digits"
    )
    private String newPassword;
}