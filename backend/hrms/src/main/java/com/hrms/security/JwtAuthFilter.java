package com.hrms.security;

import com.hrms.service.SessionActivityService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final SessionActivityService sessionActivityService;

    @Autowired
    public JwtAuthFilter(
            JwtUtil jwtUtil,
            @Lazy UserDetailsService userDetailsService,
            SessionActivityService sessionActivityService) {

        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.sessionActivityService = sessionActivityService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain)
            throws ServletException, IOException {

        String token = extractToken(request);

        if (StringUtils.hasText(token) && jwtUtil.validateToken(token)) {

            try {
                String email = jwtUtil.extractEmail(token);

                /*
                 * Check whether the user has been inactive
                 * for the configured timeout period.
                 */
                if (sessionActivityService.isSessionExpired(email)) {

                    SecurityContextHolder.clearContext();

                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");

                    response.getWriter().write(
                            "{\"success\":false,\"message\":\"Session expired due to inactivity. Please login again.\"}"
                    );

                    return;
                }

                UserDetails user =
                        userDetailsService.loadUserByUsername(email);

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                user,
                                null,
                                user.getAuthorities()
                        );

                auth.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request)
                );

                SecurityContextHolder
                        .getContext()
                        .setAuthentication(auth);

                /*
                 * The authenticated request itself represents
                 * activity on the HRMS portal.
                 *
                 * Therefore the 5-minute inactivity timer
                 * starts again from this request.
                 */
                sessionActivityService.recordActivity(email);

            } catch (Exception e) {

                SecurityContextHolder.clearContext();

                /*
                 * If the exception was caused by the session
                 * inactivity check, the response has already
                 * been handled above.
                 */
                if (!response.isCommitted()) {
                    response.setStatus(
                            HttpServletResponse.SC_UNAUTHORIZED
                    );
                }

                return;
            }
        }

        chain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {

        String header = request.getHeader("Authorization");

        if (StringUtils.hasText(header)
                && header.startsWith("Bearer ")) {

            return header.substring(7);
        }

        return null;
    }
}