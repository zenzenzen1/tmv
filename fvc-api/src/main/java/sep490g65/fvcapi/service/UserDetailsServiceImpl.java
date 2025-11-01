package sep490g65.fvcapi.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.repository.UserRepository;

import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        final String normalizedEmail = email == null ? null : email.trim();
        log.info("[UserDetailsService] Load by email: {}", normalizedEmail);

        // Only personal mail is allowed as username
        java.util.List<User> users = userRepository.findAllByPersonalMailIgnoreCase(normalizedEmail);
        if (users.isEmpty()) {
            throw new UsernameNotFoundException("User not found with email: " + normalizedEmail);
        }
        
        User user = users.get(0); // Get first user if duplicates exist

        log.info("[UserDetailsService] Found user {}, role={}, hash_present={}",
                user.getId(), user.getSystemRole(), user.getHashPassword() != null);

        return org.springframework.security.core.userdetails.User.builder()
                .username(normalizedEmail)
                .password(user.getHashPassword())
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getSystemRole().name())))
                .build();
    }
}
