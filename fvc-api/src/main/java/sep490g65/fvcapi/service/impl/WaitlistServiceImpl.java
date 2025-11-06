package sep490g65.fvcapi.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sep490g65.fvcapi.dto.request.AddToWaitlistRequest;
import sep490g65.fvcapi.dto.request.SubmitApplicationFormRequest;
import sep490g65.fvcapi.dto.response.BaseResponse;
import sep490g65.fvcapi.entity.ApplicationFormConfig;
import sep490g65.fvcapi.entity.User;
import sep490g65.fvcapi.entity.WaitlistEntry;
import sep490g65.fvcapi.exception.BusinessException;
import sep490g65.fvcapi.exception.custom.ResourceNotFoundException;
import sep490g65.fvcapi.repository.ApplicationFormConfigRepository;
import sep490g65.fvcapi.repository.SubmittedApplicationFormRepository;
import sep490g65.fvcapi.repository.UserRepository;
import sep490g65.fvcapi.repository.WaitlistEntryRepository;
import sep490g65.fvcapi.service.WaitlistService;
import sep490g65.fvcapi.service.SubmittedApplicationFormService;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WaitlistServiceImpl implements WaitlistService {

    private final WaitlistEntryRepository waitlistEntryRepository;
    private final ApplicationFormConfigRepository applicationFormConfigRepository;
    private final UserRepository userRepository;
    private final SubmittedApplicationFormRepository submittedApplicationFormRepository;
    private final SubmittedApplicationFormService submittedApplicationFormService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public BaseResponse<Void> addToWaitlist(AddToWaitlistRequest request) {
        log.info("🔄 [Add to Waitlist] Starting to add entry to waitlist for form: {}", request.getApplicationFormConfigId());

        // Validate form exists and is postponed
        ApplicationFormConfig formConfig = applicationFormConfigRepository.findById(request.getApplicationFormConfigId())
                .orElseThrow(() -> new ResourceNotFoundException("Form not found"));

        if (formConfig.getStatus() == null || !formConfig.getStatus().name().equals("POSTPONE")) {
            throw new BusinessException("Form is not postponed. Cannot add to waitlist.", "FORM_NOT_POSTPONED");
        }

        // Check if already in waitlist
        if (waitlistEntryRepository.existsByApplicationFormConfig_IdAndEmailIgnoreCaseAndIsProcessedFalse(
                request.getApplicationFormConfigId(), request.getEmail())) {
            throw new BusinessException("Email đã có trong danh sách chờ", "ALREADY_IN_WAITLIST");
        }

        // Check if already submitted
        if (submittedApplicationFormRepository.existsByApplicationFormConfig_IdAndEmailIgnoreCase(
                request.getApplicationFormConfigId(), request.getEmail())) {
            throw new BusinessException("Email đã đăng ký form này rồi", "ALREADY_SUBMITTED");
        }

        // Find user by email if exists (try both eduMail and personalMail)
        Optional<User> userOpt = userRepository.findByEduMailOrPersonalMail(
                request.getEmail(), request.getEmail());

        // Convert formData to JSON string
        String formDataJson;
        try {
            formDataJson = objectMapper.writeValueAsString(request.getFormData());
        } catch (Exception e) {
            log.error("Error converting formData to JSON", e);
            throw new BusinessException("Invalid form data format", "INVALID_FORM_DATA");
        }

        // Create waitlist entry
        WaitlistEntry waitlistEntry = WaitlistEntry.builder()
                .formType(formConfig.getFormType())
                .formData(formDataJson)
                .email(request.getEmail())
                .user(userOpt.orElse(null))
                .applicationFormConfig(formConfig)
                .isProcessed(false)
                .build();

        waitlistEntryRepository.save(waitlistEntry);

        log.info("✅ [Add to Waitlist] Successfully added to waitlist. Email: {}, Form: {}", 
                request.getEmail(), request.getApplicationFormConfigId());

        return BaseResponse.success("Đã thêm vào danh sách chờ thành công");
    }

    @Override
    @Transactional
    public int processWaitlistForForm(String formId) {
        log.info("🔄 [Process Waitlist] Starting to process waitlist for form: {}", formId);

        // Get all unprocessed waitlist entries for this form
        List<WaitlistEntry> waitlistEntries = waitlistEntryRepository.findByFormIdAndNotProcessed(formId);

        if (waitlistEntries.isEmpty()) {
            log.info("ℹ️ [Process Waitlist] No waitlist entries to process for form: {}", formId);
            return 0;
        }

        int processedCount = 0;
        int failedCount = 0;

        for (WaitlistEntry entry : waitlistEntries) {
            try {
                // Convert waitlist entry to SubmittedApplicationForm
                SubmitApplicationFormRequest submitRequest = new SubmitApplicationFormRequest();
                submitRequest.setFormType(entry.getFormType());
                submitRequest.setApplicationFormConfigId(formId);

                // Parse formData from JSON string to Map, then convert to SubmittedFormData
                try {
                    java.util.Map<String, Object> formDataMap = objectMapper.readValue(
                            entry.getFormData(), 
                            objectMapper.getTypeFactory().constructMapType(java.util.Map.class, String.class, Object.class));
                    
                    // Convert Map to SubmittedFormData
                    sep490g65.fvcapi.dto.request.SubmittedFormData submittedFormData = 
                            objectMapper.convertValue(formDataMap, sep490g65.fvcapi.dto.request.SubmittedFormData.class);
                    submitRequest.setFormData(submittedFormData);
                } catch (Exception e) {
                    log.error("Error parsing formData from waitlist entry: {}", entry.getId(), e);
                    failedCount++;
                    continue;
                }

                // Set user if exists
                if (entry.getUser() != null) {
                    submitRequest.setUserId(entry.getUser().getId());
                }

                // Submit the form
                submittedApplicationFormService.submit(submitRequest);

                // Mark as processed
                entry.setIsProcessed(true);
                waitlistEntryRepository.save(entry);

                processedCount++;
                log.debug("✅ [Process Waitlist] Processed waitlist entry: {}", entry.getId());

            } catch (Exception e) {
                log.error("❌ [Process Waitlist] Failed to process waitlist entry: {}", entry.getId(), e);
                failedCount++;
                // Continue processing other entries even if one fails
            }
        }

        log.info("✅ [Process Waitlist] Completed processing waitlist. Processed: {}, Failed: {}, Total: {}", 
                processedCount, failedCount, waitlistEntries.size());

        return processedCount;
    }
}

