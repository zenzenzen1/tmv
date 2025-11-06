package sep490g65.fvcapi.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.RequestParam;
import sep490g65.fvcapi.dto.request.SubmitApplicationFormRequest;
import sep490g65.fvcapi.dto.response.PaginationResponse;
import sep490g65.fvcapi.dto.response.SubmittedApplicationFormResponse;
import sep490g65.fvcapi.entity.ClubMember;
import sep490g65.fvcapi.entity.SubmittedApplicationForm;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.enums.ApplicationFormType;
import sep490g65.fvcapi.enums.ApplicationFormStatus;
import sep490g65.fvcapi.repository.ClubMemberRepository;
import sep490g65.fvcapi.repository.SubmittedApplicationFormRepository;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.repository.ApplicationFormConfigRepository;
import sep490g65.fvcapi.service.EmailService;
import sep490g65.fvcapi.service.SubmittedApplicationFormService;
import sep490g65.fvcapi.utils.ResponseUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import sep490g65.fvcapi.enums.SystemRole;

import java.time.LocalDate;
import java.security.SecureRandom;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SubmittedApplicationFormServiceImpl implements SubmittedApplicationFormService {

    private final SubmittedApplicationFormRepository repository;
    private final UserRepository userRepository;
    private final ApplicationFormConfigRepository applicationFormConfigRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    private static final String RANDOM_PASSWORD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    private static final int RANDOM_PASSWORD_LENGTH = 12;
    

    private SubmittedApplicationFormResponse toDto(SubmittedApplicationForm s) {
        return SubmittedApplicationFormResponse.builder()
                .id(s.getId())
                .formType(s.getFormType())
                .formData(s.getFormData())
                .status(s.getStatus())
                .reviewerNote(s.getReviewerNote())
                .userId(s.getUser() != null ? s.getUser().getId() : null)
                .applicationFormConfigId(s.getApplicationFormConfig() != null ? s.getApplicationFormConfig().getId() : null)
                .applicationFormConfigName(s.getApplicationFormConfig() != null ? s.getApplicationFormConfig().getName() : null)
                .userFullName(s.getUser() != null ? s.getUser().getFullName() : null)
                .userPersonalMail(s.getUser() != null ? s.getUser().getPersonalMail() : null)
                .userEduMail(s.getUser() != null ? s.getUser().getEduMail() : null)
                .userStudentCode(s.getUser() != null ? s.getUser().getStudentCode() : null)
                .userGender(s.getUser() != null ? s.getUser().getGender() : null)
                .createdAt(s.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaginationResponse<SubmittedApplicationFormResponse> list(RequestParam params, ApplicationFormType type) {
        Sort sort = Sort.by(params.isAscending() ? Sort.Direction.ASC : Sort.Direction.DESC, params.getSortBy());
        Pageable pageable = PageRequest.of(params.getPage(), params.getSize(), sort);
        
        // Parse status
        ApplicationFormStatus status = null;
        if (params.getStatusFilter() != null) {
            try {
                status = ApplicationFormStatus.valueOf(params.getStatusFilter().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid status, ignore
            }
        }
        
        Page<SubmittedApplicationForm> page = repository.search(
            type, 
            status, 
            pageable
        );
        return ResponseUtils.createPaginatedResponse(page.map(this::toDto));
    }
    
    @Override
    @Transactional
    public SubmittedApplicationFormResponse submit(SubmitApplicationFormRequest request) throws com.fasterxml.jackson.core.JsonProcessingException {
        // Duplicate check ONLY within submitted forms by email
        try {
            sep490g65.fvcapi.dto.FormDataDto formData = objectMapper.convertValue(request.getFormData(), sep490g65.fvcapi.dto.FormDataDto.class);
            String email = formData.getEmail();
            String formConfigId = request.getApplicationFormConfigId();

            if (email != null && !email.trim().isEmpty()) {
                boolean exists = false;
                if (formConfigId != null && !formConfigId.trim().isEmpty()) {
                    exists = repository.existsByApplicationFormConfig_IdAndEmailIgnoreCase(formConfigId, email);
                } else {
                    exists = repository.existsByEmailIgnoreCase(email);
                }
                if (exists) {
                    throw new IllegalArgumentException("Email này đã nộp đơn trước đó");
                }
            }
        } catch (IllegalArgumentException dupEx) {
            throw dupEx;
        } catch (Exception e) {
            // ignore parse issues
        }

        // Create entity. Persist structured DTO as JSON string
        SubmittedApplicationForm entity = SubmittedApplicationForm.builder()
                .formType(request.getFormType())
                .formData(toJson(request.getFormData()))
                .reviewerNote(request.getReviewerNote())
                .status(ApplicationFormStatus.PENDING)
                .build();

        // persist extracted email for fast duplicate checks later
        try {
            sep490g65.fvcapi.dto.FormDataDto formData = objectMapper.convertValue(request.getFormData(), sep490g65.fvcapi.dto.FormDataDto.class);
            if (formData.getEmail() != null && !formData.getEmail().trim().isEmpty()) {
                entity.setEmail(formData.getEmail());
            }
        } catch (Exception ignored) {
        }
        
        // Set user if provided (optional - guest can submit forms)
        if (request.getUserId() != null && !request.getUserId().trim().isEmpty()) {
            userRepository.findById(request.getUserId()).ifPresent(entity::setUser);
        }
        // If no userId provided, user remains null (guest submission)
        
        // Set application form config if provided
        if (request.getApplicationFormConfigId() != null && !request.getApplicationFormConfigId().trim().isEmpty()) {
            applicationFormConfigRepository.findById(request.getApplicationFormConfigId())
                    .ifPresent(entity::setApplicationFormConfig);
        }
        
        // Save entity
        SubmittedApplicationForm saved = repository.save(entity);
        
        // Return response
        return toDto(saved);
    }

    @Override
    @Transactional
    public void updateStatus(Long id, ApplicationFormStatus status) {
        SubmittedApplicationForm form = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Submitted form not found with id: " + id));
        form.setStatus(status);
        repository.save(form);
        
        // If form is approved, process club member creation
        if (status == ApplicationFormStatus.APPROVED) {
            try {
                processApprovedForm(form);
            } catch (Exception e) {
                log.error("Error processing approved form: {}", e.getMessage(), e);
                throw new RuntimeException("Failed to process approved form: " + e.getMessage());
            }
        }
    }
    
    private void processApprovedForm(SubmittedApplicationForm form) throws Exception {
        String formDataJson = form.getFormData();
        
        // Parse form data to DTO
        sep490g65.fvcapi.dto.FormDataDto formData = objectMapper.readValue(formDataJson, sep490g65.fvcapi.dto.FormDataDto.class);
        
        // Get email from form_data
        String email = formData.getEmail();
        if (email == null || email.trim().isEmpty()) {
            log.error("No email found in form_data");
            throw new RuntimeException("Email is required in form_data");
        }
        
        // Find user by email in edu_mail or personal_mail, or create new user if not found
        User user = userRepository.findByEduMailOrPersonalMail(email, email)
                .orElseGet(() -> {
                    log.info("User not found with email {}, creating new user", email);
                    return createUserFromFormData(formData, email);
                });
        
        // Check if club member already exists for this user
        if (clubMemberRepository.existsByUserId(user.getId())) {
            log.info("Club member already exists for user {}", user.getId());
            return;
        }
        
        // Create new club member
        ClubMember clubMember = ClubMember.builder()
                .user(user)
                .fullName(formData.getFullName() != null ? formData.getFullName() : user.getFullName())
                .email(email)
                .studentCode(formData.getStudentCodeValue())
                .phone(formData.getPhoneValue())
                .gender(formData.getGender())
                .department(formData.getDepartmentValue())
                .joinedAt(LocalDate.now())
                .status(ClubMember.MemberStatus.ACTIVE)
                .build();
        
        clubMemberRepository.save(clubMember);
        
        log.info("Created club member for user {} with email {}", user.getId(), email);
    }
    
    private User createUserFromFormData(sep490g65.fvcapi.dto.FormDataDto formData, String email) {
        // Generate random password
        String randomPassword = generateRandomPassword();
        String hashedPassword = passwordEncoder.encode(randomPassword);
        
        // Create new user
        User newUser = new User();
        newUser.setFullName(formData.getFullName());
        
        // Set email - prefer FPT email as edu_mail, otherwise use as personal_mail
        // if (email.toLowerCase().endsWith("@fpt.edu.vn") || email.toLowerCase().endsWith("@fe.edu.vn")) {
        //     newUser.setEduMail(email);
        // } else {
        //     newUser.setPersonalMail(email);
        // }
        newUser.setPersonalMail(email);
        newUser.setEduMail(email);
        
        newUser.setHashPassword(hashedPassword);
        newUser.setStudentCode(formData.getStudentCodeValue());
        newUser.setGender(formData.getGender());
        newUser.setSystemRole(SystemRole.MEMBER);
        newUser.setStatus(true);
        newUser.setIsInChallenge(false);
        
        User savedUser = userRepository.save(newUser);
        
        log.info("Created new user {} with email {} and random password", savedUser.getId(), email);
        
        // Send email with temporary password to user
        try {
            String loginUrl = "https://fvclub.fpt.edu.vn/login"; // TODO: Get from config
            emailService.sendNewAccountPassword(
                email, 
                formData.getFullName() != null ? formData.getFullName() : "Thành viên mới",
                randomPassword,
                loginUrl
            );
            log.info("Sent password email to {}", email);
        } catch (Exception e) {
            log.error("Failed to send password email to {}: {}", email, e.getMessage());
            // Don't throw exception - user creation should succeed even if email fails
        }
        
        return savedUser;
    }
    
    private String generateRandomPassword() {
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder(RANDOM_PASSWORD_LENGTH);
        
        for (int i = 0; i < RANDOM_PASSWORD_LENGTH; i++) {
            int randomIndex = random.nextInt(RANDOM_PASSWORD_CHARS.length());
            password.append(RANDOM_PASSWORD_CHARS.charAt(randomIndex));
        }
        
        return password.toString();
    }

    private String toJson(Object obj) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }
}


