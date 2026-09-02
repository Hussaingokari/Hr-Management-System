package com.hrms.config;

import com.hrms.repository.EmployeeRepository;
import com.hrms.security.JwtAuthFilter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    // ============================================================
    // FRONTEND URL
    // ============================================================

    /*
     * Production:
     *
     * APP_FRONTEND_URL=https://hrms.saitejainfotechprivatelimited.com
     *
     * Spring maps APP_FRONTEND_URL to:
     *
     * app.frontend.url
     *
     * The default value allows production if the environment
     * variable is not explicitly supplied.
     *
     * IMPORTANT:
     * Do NOT put localhost into the production server environment.
     */

    @Value("${app.frontend.url:https://hrms.saitejainfotechprivatelimited.com}")
    private String frontendUrl;

    // ============================================================
    // PUBLIC URLS
    // ============================================================

    private static final String[] PUBLIC_URLS = {

            // Authentication
            "/api/auth/login",
            "/api/auth/refresh",

            // Login OTP
            "/api/auth/login/send-otp",
            "/api/auth/login/verify-otp",

            // Forgot Password
            "/api/auth/forgot-password",
            "/api/auth/reset-password",

            // Files
            "/api/files/**",

            // Recruitment
            "/api/recruitment/jobs",
            "/api/recruitment/jobs/*/apply",

            // Swagger / OpenAPI
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/api-docs/**",
            "/v3/api-docs/**",

            // Other public endpoints
            "/api/employees/managers",
            "/api/greeting/status",
            "/api/upload/document"
    };

    // ============================================================
    // ADMIN / HR ONLY URLS
    // ============================================================

    /*
     * Keep empty if controller/service methods already use
     * @PreAuthorize / @Secured or equivalent authorization.
     */

    private static final String[] ADMIN_HR_URLS = {
    };

    // ============================================================
    // SECURITY FILTER CHAIN
    // ============================================================

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            JwtAuthFilter jwtAuthFilter,
            AuthenticationProvider authenticationProvider) throws Exception {

        http

                // ====================================================
                // CSRF
                // ====================================================

                .csrf(csrf -> csrf.disable())

                // ====================================================
                // CORS
                // ====================================================

                .cors(cors -> cors.configurationSource(
                        corsConfigurationSource()))

                // ====================================================
                // SESSION MANAGEMENT
                // ====================================================

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS))

                // ====================================================
                // AUTHORIZATION
                // ====================================================

                .authorizeHttpRequests(auth -> auth

                        // ====================================================
                        // CORS PREFLIGHT
                        // ====================================================

                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**")
                        .permitAll()

                        // ====================================================
                        // PUBLIC ENDPOINTS
                        // ====================================================

                        .requestMatchers(PUBLIC_URLS)
                        .permitAll()

                        // ====================================================
                        // ADMIN ONLY - DELETE JOB
                        // ====================================================

                        /*
                         * HR must NOT be allowed to delete jobs.
                         *
                         * ADMIN -> allowed
                         * HR -> 403 Forbidden
                         * EMPLOYEE -> 403 Forbidden
                         */

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/recruitment/jobs/**")
                        .hasRole("ADMIN")

                        // ====================================================
                        // ADMIN / HR ENDPOINTS
                        // ====================================================

                        .requestMatchers(ADMIN_HR_URLS)
                        .hasAnyRole("ADMIN", "HR")

                        // ====================================================
                        // CHANGE PASSWORD
                        // ====================================================

                        .requestMatchers(
                                "/api/auth/change-password")
                        .authenticated()

                        // ====================================================
                        // ATTENDANCE
                        // ====================================================

                        .requestMatchers(
                                "/api/attendance/check-in")
                        .authenticated()

                        .requestMatchers(
                                "/api/attendance/check-out")
                        .authenticated()

                        .requestMatchers(
                                "/api/attendance/my")
                        .authenticated()

                        .requestMatchers(
                                "/api/attendance/my/**")
                        .authenticated()

                        // ====================================================
                        // EVERYTHING ELSE
                        // ====================================================

                        .anyRequest()
                        .authenticated())

                // ====================================================
                // AUTHENTICATION PROVIDER
                // ====================================================

                .authenticationProvider(
                        authenticationProvider)

                // ====================================================
                // JWT FILTER
                // ====================================================

                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ============================================================
    // USER DETAILS SERVICE
    // ============================================================

    @Bean
    public UserDetailsService userDetailsService(
            EmployeeRepository employeeRepository) {

        return username -> {

            String normalizedUsername =
                    username == null
                            ? ""
                            : username.trim().toLowerCase();

            return employeeRepository
                    .findByEmail(normalizedUsername)
                    .orElseThrow(() ->
                            new UsernameNotFoundException(
                                    "User not found"));
        };
    }

    // ============================================================
    // AUTHENTICATION PROVIDER
    // ============================================================

    @Bean
    public AuthenticationProvider authenticationProvider(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider();

        provider.setUserDetailsService(
                userDetailsService);

        provider.setPasswordEncoder(
                passwordEncoder);

        return provider;
    }

    // ============================================================
    // AUTHENTICATION MANAGER
    // ============================================================

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config)
            throws Exception {

        return config.getAuthenticationManager();
    }

    // ============================================================
    // PASSWORD ENCODER
    // ============================================================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }

    // ============================================================
    // CORS CONFIGURATION
    // ============================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config =
                new CorsConfiguration();

        // --------------------------------------------------------
        // Allowed frontend origins
        // --------------------------------------------------------

        /*
         * Production:
         *
         * https://hrms.saitejainfotechprivatelimited.com
         *
         * Multiple origins can also be supplied as comma-separated
         * values through app.frontend.url.
         */

        List<String> allowedOrigins =
                Arrays.stream(frontendUrl.split(","))
                        .map(String::trim)
                        .filter(origin -> !origin.isBlank())
                        .toList();

        config.setAllowedOrigins(
                allowedOrigins);

        // --------------------------------------------------------
        // Allowed HTTP methods
        // --------------------------------------------------------

        config.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"
                ));

        // --------------------------------------------------------
        // Allowed request headers
        // --------------------------------------------------------

        config.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type",
                        "Accept",
                        "Cache-Control",
                        "Pragma",
                        "Expires",
                        "X-Requested-With"
                ));

        // --------------------------------------------------------
        // Exposed response headers
        // --------------------------------------------------------

        config.setExposedHeaders(
                List.of(
                        "Authorization"
                ));

        // --------------------------------------------------------
        // Credentials
        // --------------------------------------------------------

        config.setAllowCredentials(true);

        // --------------------------------------------------------
        // Browser preflight cache
        // --------------------------------------------------------

        config.setMaxAge(3600L);

        // --------------------------------------------------------
        // Register CORS configuration
        // --------------------------------------------------------

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                config);

        return source;
    }
}
