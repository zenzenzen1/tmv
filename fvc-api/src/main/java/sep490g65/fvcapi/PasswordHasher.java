package sep490g65.fvcapi;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

public class PasswordHasher {
    public static void main(String[] args) {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

        String rawPassword = "user123"; // đổi thành mật khẩu bạn muốn
        String hashedPassword = passwordEncoder.encode(rawPassword);

        System.out.println("Raw password   : " + rawPassword);
        System.out.println("Hashed password: " + hashedPassword);
    }
}
