package sep490g65.fvcapi.service;

import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;


import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private final JavaMailSender javaMailSender;

    private final SpringTemplateEngine templateEngine;

    @Value("${spring.mail.username:}")
    private String from;
    
    public void sendNewAccountPassword(String toEmail, String toName, String password, String loginUrl) {
        try {
            // Check if mail is configured
            if (from == null || from.isEmpty()) {
                log.warn("Mail not configured. Skipping email send to {}", toEmail);
                return;
            }
            
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());

            // load template email with password
            Context context = new Context();
            context.setVariable("name", toName);
            context.setVariable("email", toEmail);
            context.setVariable("password", password);
            context.setVariable("loginUrl", loginUrl != null ? loginUrl : "#");
            String html = templateEngine.process("new-account-password", context);

            // send email
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("Tài khoản mới - FPTU Vovinam Club");
            helper.setText(html, true);
            javaMailSender.send(message);
            
            log.info("Sent new account password email to {}", toEmail);
        } catch (MessagingException e) {
            log.error("Error when sending new account password email to {}: ", toEmail, e);
        } catch (Exception e) {
            log.error("Unexpected error when sending email to {}: ", toEmail, e);
        }
    }
    
    public void sendRegistrationApproved(
            String toEmail,
            String fullName,
            String studentId,
            String club,
            String gender,
            String tournamentName,
            String competitionType,
            String category,
            boolean isTeam,
            String teamName
    ) {
        try {
            // Check if mail is configured
            if (from == null || from.isEmpty()) {
                log.warn("Mail not configured. Skipping email send to {}", toEmail);
                return;
            }
            
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());

            // load template email for registration approval
            Context context = new Context();
            context.setVariable("fullName", fullName);
            context.setVariable("email", toEmail);
            context.setVariable("studentId", studentId);
            context.setVariable("club", club);
            context.setVariable("gender", gender);
            context.setVariable("tournamentName", tournamentName);
            context.setVariable("competitionType", competitionType);
            context.setVariable("category", category);
            context.setVariable("isTeam", isTeam);
            context.setVariable("teamName", teamName);
            String html = templateEngine.process("registration-approved", context);

            // send email
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("Đăng ký tham gia giải đấu đã được duyệt - FPTU Vovinam Club");
            helper.setText(html, true);
            javaMailSender.send(message);
            
            log.info("Sent registration approval email to {}", toEmail);
        } catch (MessagingException e) {
            log.error("Error when sending registration approval email to {}: ", toEmail, e);
        } catch (Exception e) {
            log.error("Unexpected error when sending email to {}: ", toEmail, e);
        }
    }
}