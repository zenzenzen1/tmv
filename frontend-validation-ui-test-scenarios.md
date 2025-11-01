# Frontend Validation UI Test Scenarios

## Overview

This document provides step-by-step manual testing scenarios for the FVCMS frontend validation features. These tests are designed to be executed directly in the web browser to verify all validation functionality works correctly.

## Test Environment Setup

### Prerequisites
- FVCMS frontend application running locally
- Browser with developer tools enabled
- Test user accounts (admin, regular user)
- Sample data for testing

### Browser Setup
- Chrome/Edge with DevTools open
- Network tab enabled to monitor API calls
- Console tab open to check for JavaScript errors

---

## Phase 1: Core Validation UI Tests

### Test 1.1: Login Form Email Validation

**Objective:** Verify email validation in login form

**Steps:**
1. Navigate to `/login` page
2. **Test Invalid Email Formats:**
   - Enter: `invalid-email` → Should show red border and error message
   - Enter: `@domain.com` → Should show error: "Email không hợp lệ"
   - Enter: `user@` → Should show error: "Email không hợp lệ"
   - Enter: `user@.com` → Should show error: "Email không hợp lệ"
3. **Test Valid Email:**
   - Enter: `test@example.com` → Should show green border, no error
4. **Test Required Field:**
   - Clear email field → Should show error: "Email là bắt buộc"

**Expected Results:**
- Invalid emails show red border and error message
- Valid email shows green border
- Submit button disabled with invalid email
- Submit button enabled with valid email

---

### Test 1.2: Form Registration Phone Validation

**Objective:** Verify Vietnamese phone number validation

**Steps:**
1. Navigate to form registration page
2. **Test Valid Vietnamese Numbers:**
   - Enter: `0912345678` → Should accept (green border)
   - Enter: `0812345678` → Should accept (green border)
   - Enter: `0712345678` → Should accept (green border)
   - Enter: `0212345678` → Should accept (green border)
3. **Test Invalid Numbers:**
   - Enter: `123456789` → Should show error: "Số điện thoại không hợp lệ"
   - Enter: `0012345678` → Should show error
   - Enter: `abc1234567` → Should show error
4. **Test Required Field:**
   - Clear phone field → Should show error: "Số điện thoại là bắt buộc"

**Expected Results:**
- Valid Vietnamese numbers accepted
- Invalid numbers show error messages
- Submit button state reflects validation status

---

### Test 1.3: Student ID Validation

**Objective:** Verify student ID format validation

**Steps:**
1. Navigate to form registration page
2. **Test Valid Student IDs:**
   - Enter: `20123456` → Should accept (8 digits)
   - Enter: `2012345678` → Should accept (10 digits)
3. **Test Invalid Student IDs:**
   - Enter: `1234567` → Should show error: "MSSV không hợp lệ (8-10 chữ số)"
   - Enter: `201234567890` → Should show error (too long)
   - Enter: `abc123456` → Should show error (contains letters)
4. **Test Required Field:**
   - Clear student ID field → Should show error: "MSSV là bắt buộc"

**Expected Results:**
- Valid student IDs accepted
- Invalid IDs show appropriate error messages
- Form submission blocked with invalid data

---

## Phase 2: Enhanced Validation UI Tests

### Test 2.1: Real-time Validation Feedback

**Objective:** Verify immediate validation feedback

**Steps:**
1. Navigate to any form with validation (e.g., Fist Content Modal)
2. **Test Real-time Email Validation:**
   - Start typing: `test` → No error yet
   - Continue: `test@` → Should show error immediately
   - Complete: `test@example.com` → Error should disappear immediately
3. **Test Real-time Name Validation:**
   - Start typing: `Valid Name` → No error
   - Add special chars: `Valid Name@#$` → Should show error immediately
   - Remove special chars: `Valid Name` → Error should disappear immediately

**Expected Results:**
- Validation errors appear as user types
- Errors disappear when input becomes valid
- No delay in validation feedback

---

### Test 2.2: Date Validation

**Objective:** Verify date range and future date validation

**Steps:**
1. Navigate to Competition Form Page
2. **Test Future Date Validation:**
   - Select start date: Yesterday → Should show error: "Ngày bắt đầu phải là ngày trong tương lai"
   - Select start date: Tomorrow → Should accept
3. **Test Date Range Validation:**
   - Select start date: Next week
   - Select end date: Same day as start → Should show error: "Ngày kết thúc phải sau Ngày bắt đầu"
   - Select end date: Day after start → Should accept

**Expected Results:**
- Past dates rejected with clear error messages
- End date must be after start date
- Form submission blocked with invalid dates

---

## Phase 3: Advanced Validation UI Tests

### Test 3.1: Special Character Validation in Name Fields

**Objective:** Verify special character restrictions

**Steps:**
1. Navigate to Fist Content Modal
2. **Test Name Field with Special Characters:**
   - Enter: `Song Luyện quyền 1` → Should accept (Vietnamese characters allowed)
   - Enter: `Test@#$%` → Should show error: "Nội dung Quyền không được chứa ký tự đặc biệt"
   - Enter: `Test<script>` → Should show error
   - Enter: `Test & More` → Should show error
3. **Test Valid Names:**
   - Enter: `Song Luyện quyền 1` → Should accept
   - Enter: `Đơn luyện cơ bản` → Should accept

**Expected Results:**
- Vietnamese characters and basic punctuation allowed
- Special characters like @, #, $, % rejected
- Clear error messages for invalid characters

---

### Test 3.2: Search Input Validation

**Objective:** Verify search input sanitization

**Steps:**
1. Navigate to Athlete Management Page
2. **Test Dangerous Characters in Search:**
   - Enter: `<script>alert("xss")</script>` → Should show error: "Tìm kiếm chứa ký tự không hợp lệ"
   - Enter: `Test' OR '1'='1` → Should show error
   - Enter: `Test" AND 1=1` → Should show error
3. **Test Valid Search Terms:**
   - Enter: `Nguyễn Văn A` → Should accept
   - Enter: `Trần Thị B` → Should accept
4. **Test Search Length:**
   - Enter 101 characters → Should show error: "Tìm kiếm không được vượt quá 100 ký tự"

**Expected Results:**
- Dangerous characters rejected with error messages
- Valid search terms accepted
- Length limits enforced

---

### Test 3.3: Numeric Range Validation

**Objective:** Verify numeric field range validation

**Steps:**
1. Navigate to Weight Class Modal
2. **Test Weight Range (0-200kg):**
   - Enter min weight: `-10` → Should show error: "Cân nặng tối thiểu không được âm"
   - Enter min weight: `250` → Should show error: "Cân nặng tối thiểu không được vượt quá 200kg"
   - Enter min weight: `50` → Should accept
   - Enter max weight: `45` → Should show error: "Cân nặng tối đa phải lớn hơn cân nặng tối thiểu"
3. **Test Decimal Precision:**
   - Enter: `50.123` → Should show error: "Cân nặng tối thiểu chỉ được có tối đa 1 chữ số thập phân"
   - Enter: `50.1` → Should accept

**Expected Results:**
- Negative values rejected
- Values over 200kg rejected
- Max weight must be greater than min weight
- Decimal precision limited to 1 place

---

### Test 3.4: Competition Form Numeric Validation

**Objective:** Verify competition form numeric fields

**Steps:**
1. Navigate to Competition Form Page
2. **Test Round Count (1-20):**
   - Enter: `0` → Should show error: "Số hiệp đấu phải lớn hơn 0"
   - Enter: `25` → Should show error: "Số hiệp đấu không được vượt quá 20 vòng"
   - Enter: `5` → Should accept
3. **Test Duration (1-300 minutes):**
   - Enter: `0` → Should show error: "Thời gian mỗi hiệp phải lớn hơn 0"
   - Enter: `350` → Should show error: "Thời gian mỗi hiệp không được vượt quá 300 phút"
   - Enter: `90` → Should accept
4. **Test Assessor Count (1-50):**
   - Enter: `0` → Should show error: "Số giám khảo phải lớn hơn 0"
   - Enter: `60` → Should show error: "Số giám khảo không được vượt quá 50 người"
   - Enter: `5` → Should accept

**Expected Results:**
- All numeric fields have appropriate range validation
- Clear error messages for out-of-range values
- Form submission blocked with invalid numeric data

---

### Test 3.5: File Upload Validation

**Objective:** Verify file upload validation (if file upload exists)

**Steps:**
1. Navigate to any form with file upload
2. **Test File Type Validation:**
   - Upload: `document.pdf` → Should show error: "File phải có định dạng: JPEG, PNG, GIF"
   - Upload: `image.jpg` → Should accept
3. **Test File Size Validation:**
   - Upload large file (>5MB) → Should show error: "File không được vượt quá 5MB"
   - Upload small file (<5MB) → Should accept
4. **Test File Format Validation:**
   - Upload: `image.exe` → Should show error: "File phải có định dạng: .jpg, .jpeg, .png, .gif"
   - Upload: `image.png` → Should accept

**Expected Results:**
- Only allowed file types accepted
- File size limits enforced
- Clear error messages for invalid files

---

## Cross-Browser Testing Scenarios

### Test 4.1: Browser Compatibility

**Objective:** Verify validation works across different browsers

**Browsers to Test:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Steps:**
1. Open each browser
2. Navigate to login page
3. Test email validation in each browser
4. Verify error messages display correctly
5. Check that validation styling is consistent

**Expected Results:**
- Validation works identically across all browsers
- Error messages display correctly
- Styling is consistent

---

## Mobile Responsiveness Testing

### Test 5.1: Mobile Validation

**Objective:** Verify validation works on mobile devices

**Steps:**
1. Open browser developer tools
2. Switch to mobile view (iPhone/Android)
3. Navigate to forms with validation
4. Test touch interactions with validation
5. Verify error messages are readable on small screens

**Expected Results:**
- Validation works on mobile devices
- Error messages are readable
- Touch interactions work properly

---

## Performance Testing Scenarios

### Test 6.1: Validation Performance

**Objective:** Verify validation doesn't impact performance

**Steps:**
1. Open browser DevTools → Performance tab
2. Start recording
3. Navigate to form with many validation fields
4. Type rapidly in validated fields
5. Stop recording and analyze

**Expected Results:**
- No significant performance impact
- Validation responds quickly
- No memory leaks detected

---

## Error Handling Scenarios

### Test 7.1: Network Error Handling

**Objective:** Verify validation works during network issues

**Steps:**
1. Open browser DevTools → Network tab
2. Set network to "Offline"
3. Try to submit form with validation
4. Verify validation still works
5. Restore network and test submission

**Expected Results:**
- Client-side validation works offline
- Form submission blocked until network restored
- No JavaScript errors during network issues

---

## Accessibility Testing Scenarios

### Test 8.1: Screen Reader Compatibility

**Objective:** Verify validation is accessible

**Steps:**
1. Enable screen reader (if available)
2. Navigate to forms with validation
3. Tab through form fields
4. Verify error messages are announced
5. Test with keyboard navigation only

**Expected Results:**
- Error messages announced by screen reader
- Keyboard navigation works
- Focus management is proper

---

## Test Data Reference

### Valid Test Data
```
Email: test@example.com
Phone: 0912345678
Student ID: 20123456
Name: Nguyễn Văn A
Weight: 75.5
Duration: 90
Rounds: 5
Assessors: 3
```

### Invalid Test Data
```
Email: invalid-email
Phone: 123456789
Student ID: 1234567
Name: Test@#$%
Weight: 250
Duration: 0
Rounds: 25
Assessors: 0
```

---

## Test Execution Checklist

### Pre-Test Checklist
- [ ] Application running locally
- [ ] Browser DevTools open
- [ ] Test data prepared
- [ ] Test scenarios printed/available

### Post-Test Checklist
- [ ] All scenarios executed
- [ ] Results documented
- [ ] Issues reported
- [ ] Test data cleaned up

---

## Issue Reporting Template

### Bug Report Format
```
**Issue Title:** [Brief description]

**Steps to Reproduce:**
1. Navigate to [page]
2. Enter [invalid data]
3. Observe [unexpected behavior]

**Expected Result:** [What should happen]

**Actual Result:** [What actually happened]

**Browser:** [Chrome/Firefox/Safari/Edge]
**Version:** [Browser version]
**Screenshot:** [If applicable]
```

---

*Last Updated: [Current Date]*
*Version: 1.0*
