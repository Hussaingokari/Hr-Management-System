package com.hrms.exception;

public class OtpLoginRequiredException extends RuntimeException {

    public OtpLoginRequiredException(String message) {
        super(message);
    }
}