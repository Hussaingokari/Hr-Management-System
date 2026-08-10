package com.hrms.config;

import org.springframework.http.HttpMethod;
import com.hrms.repository.EmployeeRepository;
import com.hrms.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    // Fully public — no token needed at all
    private static final String[] PUBLIC_URLS = {
            "/api/auth/**",
            "/api/files/**",
            "/api/recruitment/jobs/*/apply",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/api-docs/**",
            "/api/employees/managers",
            "/v3/api-docs/**",
            "/api/greeting/status",
            "/api/upload/document"
    };

    private static final String[] ADMIN_HR_URLS = {
            "/api/employees/search",
            "/api/payroll/generate",
            "/api/payroll/month",
            "/api/payroll/*/mark-paid",
            "/api/payslips/generate/**",
            "/api/leaves/pending",
            "/api/leaves/pending-cancellations",
            "/api/leaves",
            "/api/leaves/*/hr-action",
            "/api/leaves/*/cancel-action",
            "/api/attendance/admin/**",
            "/api/performance",
            "/api/performance/*/update",
            "/api/trainings",
            "/api/trainings/enrollments/*/complete",
            "/api/recruitment/jobs/all",
            "/api/recruitment/jobs",
            "/api/recruitment/applications/**",
            "/api/onboarding/init/**",
            "/api/onboarding/pending",
            "/api/onboarding",

            "/api/greeting/send",
            "/api/greeting/templates",
            "/api/greeting/templates/**",
            "/api/greeting/history",
            "/api/greeting/history/**",

            "/api/greeting/send-online-interview",
            "/api/greeting/send-offline-interview",
            "/api/greeting/send-offer-letter",

            // for submission of docum req
            "/api/document-request/send",
            "/api/document-request/list",

    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
            JwtAuthFilter jwtAuthFilter,

            AuthenticationProvider authenticationProvider) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_URLS).permitAll()

                        // Recruitment
                        .requestMatchers(HttpMethod.GET, "/api/recruitment/jobs").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/recruitment/jobs/*").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/recruitment/jobs")
                        .hasAnyRole("ADMIN", "HR")
                        .requestMatchers(HttpMethod.POST, "/api/recruitment/jobs/*/refer")
                        .authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/recruitment/my-referrals")
                        .authenticated()

                        .requestMatchers("/api/employees/managers").permitAll()
                        .requestMatchers(ADMIN_HR_URLS).hasAnyRole("ADMIN", "HR")

                        // Attendance
                        .requestMatchers("/api/attendance/check-in").authenticated()
                        .requestMatchers("/api/attendance/check-out").authenticated()
                        .requestMatchers("/api/attendance/my").authenticated()
                        .requestMatchers("/api/attendance/my/**").authenticated()

                        .anyRequest().authenticated())
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService(EmployeeRepository employeeRepository) {
        return username -> employeeRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    @Bean
    public AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}