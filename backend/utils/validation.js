const validator = require('validator');

/**
 * Validation utilities for user registration
 */
class ValidationUtils {
  /**
   * Validate and sanitize name input
   * @param {string} name - The name to validate
   * @returns {object} - {isValid: boolean, sanitized: string, error: string}
   */
  static validateName(name) {
    if (!name || typeof name !== 'string') {
      return { isValid: false, sanitized: null, error: 'Name is required' };
    }
    
    const sanitized = name.trim();
    
    if (sanitized.length < 2) {
      return { isValid: false, sanitized: null, error: 'Name must be at least 2 characters long' };
    }
    
    if (sanitized.length > 100) {
      return { isValid: false, sanitized: null, error: 'Name must be less than 100 characters' };
    }
    
    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\u0600-\u06FF\s'-]+$/;
    if (!nameRegex.test(sanitized)) {
      return { isValid: false, sanitized: null, error: 'Name contains invalid characters' };
    }
    
    return { isValid: true, sanitized, error: null };
  }
  
  /**
   * Validate and sanitize email input
   * @param {string} email - The email to validate
   * @returns {object} - {isValid: boolean, sanitized: string, error: string}
   */
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { isValid: false, sanitized: null, error: 'Valid email address is required' };
    }
    
    const sanitized = email.trim().toLowerCase();
    
    if (!validator.isEmail(sanitized)) {
      return { isValid: false, sanitized: null, error: 'Please provide a valid email address' };
    }
    
    // Additional email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      return { isValid: false, sanitized: null, error: 'Please provide a valid email address' };
    }
    
    return { isValid: true, sanitized, error: null };
  }
  
  /**
   * Validate and sanitize Saudi phone number
   * @param {string} phone - The phone number to validate
   * @returns {object} - {isValid: boolean, sanitized: string, error: string}
   */
  static validateSaudiPhone(phone) {
    if (!phone || typeof phone !== 'string') {
      return { isValid: false, sanitized: null, error: 'Phone number is required' };
    }
    
    // Remove all spaces and special characters except + and digits
    const cleaned = phone.replace(/[^+\d]/g, '');
    
    // Saudi phone number patterns
    const patterns = [
      /^\+9665[0-9]{8}$/, // +966 5xxxxxxxx
      /^9665[0-9]{8}$/,   // 966 5xxxxxxxx
      /^05[0-9]{8}$/,     // 05xxxxxxxx
      /^5[0-9]{8}$/       // 5xxxxxxxx
    ];
    
    const isValid = patterns.some(pattern => pattern.test(cleaned));
    
    if (!isValid) {
      return { 
        isValid: false, 
        sanitized: null, 
        error: 'Please provide a valid Saudi phone number (05xxxxxxxx)' 
      };
    }
    
    // Normalize to 05xxxxxxxx format
    let normalized;
    if (cleaned.startsWith('+9665')) {
      normalized = '0' + cleaned.substring(4);
    } else if (cleaned.startsWith('9665')) {
      normalized = '0' + cleaned.substring(3);
    } else if (cleaned.startsWith('5')) {
      normalized = '0' + cleaned;
    } else {
      normalized = cleaned;
    }
    
    return { isValid: true, sanitized: normalized, error: null };
  }
  
  /**
   * Validate password strength
   * @param {string} password - The password to validate
   * @returns {object} - {isValid: boolean, error: string, strength: string}
   */
  static validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { isValid: false, error: 'Password is required', strength: 'none' };
    }
    
    if (password.length < 6) {
      return { isValid: false, error: 'Password must be at least 6 characters long', strength: 'weak' };
    }
    
    if (password.length > 128) {
      return { isValid: false, error: 'Password must be less than 128 characters', strength: 'invalid' };
    }
    
    // Calculate password strength
    let strength = 'weak';
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    if (score >= 4) strength = 'strong';
    else if (score >= 2) strength = 'medium';
    
    return { isValid: true, error: null, strength };
  }
  
  /**
   * Validate location data
   * @param {object} location - The location object to validate
   * @returns {object} - {isValid: boolean, sanitized: object, errors: array}
   */
  static validateLocation(location) {
    const errors = [];
    
    if (!location || typeof location !== 'object') {
      return { isValid: false, sanitized: null, errors: ['Location information is required'] };
    }
    
    const sanitized = {};
    
    // Validate city
    if (!location.city || typeof location.city !== 'string' || location.city.trim().length < 2) {
      errors.push('Valid city name is required');
    } else {
      sanitized.city = location.city.trim();
    }
    
    // Validate optional district
    if (location.district) {
      if (typeof location.district !== 'string') {
        errors.push('District must be a valid string');
      } else {
        sanitized.district = location.district.trim();
      }
    }
    
    // Validate optional coordinates
    if (location.coordinates) {
      if (typeof location.coordinates !== 'object') {
        errors.push('Coordinates must be an object');
      } else {
        const { latitude, longitude } = location.coordinates;
        
        if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
          errors.push('Latitude must be a number between -90 and 90');
        }
        
        if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
          errors.push('Longitude must be a number between -180 and 180');
        }
        
        if (errors.length === 0 || !errors.some(e => e.includes('Latitude') || e.includes('Longitude'))) {
          sanitized.coordinates = { latitude, longitude };
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      sanitized: errors.length === 0 ? sanitized : null,
      errors
    };
  }
  
  /**
   * Validate business information
   * @param {object} businessInfo - The business info to validate
   * @param {boolean} required - Whether business info is required
   * @returns {object} - {isValid: boolean, sanitized: object, errors: array}
   */
  static validateBusinessInfo(businessInfo, required = true) {
    const errors = [];
    
    if (!businessInfo || typeof businessInfo !== 'object') {
      if (required) {
        return { isValid: false, sanitized: null, errors: ['Business information is required'] };
      } else {
        return { isValid: true, sanitized: null, errors: [] };
      }
    }
    
    const sanitized = {};
    
    // Validate business name
    if (!businessInfo.businessName || typeof businessInfo.businessName !== 'string') {
      if (required) {
        errors.push('Business name is required');
      }
    } else {
      const name = businessInfo.businessName.trim();
      if (name.length < 2) {
        errors.push('Business name must be at least 2 characters long');
      } else if (name.length > 200) {
        errors.push('Business name must be less than 200 characters');
      } else {
        sanitized.businessName = name;
      }
    }
    
    // Validate optional business type
    if (businessInfo.businessType) {
      if (typeof businessInfo.businessType !== 'string') {
        errors.push('Business type must be a valid string');
      } else {
        sanitized.businessType = businessInfo.businessType.trim();
      }
    }
    
    // Validate optional commercial registration
    if (businessInfo.commercialRegistration) {
      if (typeof businessInfo.commercialRegistration !== 'string') {
        errors.push('Commercial registration must be a valid string');
      } else if (businessInfo.commercialRegistration.trim().length < 5) {
        errors.push('Commercial registration must be at least 5 characters long');
      } else {
        sanitized.commercialRegistration = businessInfo.commercialRegistration.trim();
      }
    }
    
    // Validate optional description
    if (businessInfo.description) {
      if (typeof businessInfo.description !== 'string') {
        errors.push('Description must be a valid string');
      } else if (businessInfo.description.length > 1000) {
        errors.push('Description must be less than 1000 characters');
      } else {
        sanitized.description = businessInfo.description.trim();
      }
    }
    
    return {
      isValid: errors.length === 0,
      sanitized: errors.length === 0 ? sanitized : null,
      errors
    };
  }
  
  /**
   * Validate family information
   * @param {object} familyInfo - The family info to validate
   * @returns {object} - {isValid: boolean, sanitized: object, errors: array}
   */
  static validateFamilyInfo(familyInfo) {
    const errors = [];
    
    if (!familyInfo || typeof familyInfo !== 'object') {
      return { isValid: false, sanitized: null, errors: ['Family information is required'] };
    }
    
    const sanitized = {};
    
    // Validate family size
    if (!familyInfo.familySize || typeof familyInfo.familySize !== 'number') {
      errors.push('Family size is required and must be a number');
    } else if (familyInfo.familySize < 1 || familyInfo.familySize > 20) {
      errors.push('Family size must be between 1 and 20');
    } else {
      sanitized.familySize = familyInfo.familySize;
    }
    
    // Validate optional specialty
    if (familyInfo.specialty) {
      if (typeof familyInfo.specialty !== 'string') {
        errors.push('Specialty must be a valid string');
      } else {
        sanitized.specialty = familyInfo.specialty.trim();
      }
    }
    
    // Validate optional years of experience
    if (familyInfo.yearsOfExperience !== undefined) {
      if (typeof familyInfo.yearsOfExperience !== 'number' || 
          familyInfo.yearsOfExperience < 0 || 
          familyInfo.yearsOfExperience > 50) {
        errors.push('Years of experience must be a number between 0 and 50');
      } else {
        sanitized.yearsOfExperience = familyInfo.yearsOfExperience;
      }
    }
    
    return {
      isValid: errors.length === 0,
      sanitized: errors.length === 0 ? sanitized : null,
      errors
    };
  }
  
  /**
   * Sanitize string input to prevent XSS and injection attacks
   * @param {string} input - The string to sanitize
   * @returns {string} - Sanitized string
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') return '';
    
    return validator.escape(input.trim());
  }
  
  /**
   * Validate complete registration data for any user type
   * @param {object} data - Registration data
   * @param {string} userType - Type of user (customer, shop, productive_family)
   * @returns {object} - {isValid: boolean, sanitized: object, errors: array}
   */
  static validateRegistrationData(data, userType) {
    const errors = [];
    const sanitized = {};
    
    // Validate common fields
    const nameValidation = this.validateName(data.name);
    if (!nameValidation.isValid) {
      errors.push(nameValidation.error);
    } else {
      sanitized.name = nameValidation.sanitized;
    }
    
    const emailValidation = this.validateEmail(data.email);
    if (!emailValidation.isValid) {
      errors.push(emailValidation.error);
    } else {
      sanitized.email = emailValidation.sanitized;
    }
    
    const phoneValidation = this.validateSaudiPhone(data.phone);
    if (!phoneValidation.isValid) {
      errors.push(phoneValidation.error);
    } else {
      sanitized.phone = phoneValidation.sanitized;
    }
    
    const passwordValidation = this.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.push(passwordValidation.error);
    }
    
    const locationValidation = this.validateLocation(data.location);
    if (!locationValidation.isValid) {
      errors.push(...locationValidation.errors);
    } else {
      sanitized.location = locationValidation.sanitized;
    }
    
    // Validate type-specific fields
    if (userType === 'shop') {
      const businessValidation = this.validateBusinessInfo(data.businessInfo, true);
      if (!businessValidation.isValid) {
        errors.push(...businessValidation.errors);
      } else {
        sanitized.businessInfo = businessValidation.sanitized;
      }
    }
    
    if (userType === 'productive_family') {
      const familyValidation = this.validateFamilyInfo(data.familyInfo);
      if (!familyValidation.isValid) {
        errors.push(...familyValidation.errors);
      } else {
        sanitized.familyInfo = familyValidation.sanitized;
      }
      
      // Business info is optional for families
      if (data.businessInfo) {
        const businessValidation = this.validateBusinessInfo(data.businessInfo, false);
        if (!businessValidation.isValid) {
          errors.push(...businessValidation.errors);
        } else if (businessValidation.sanitized) {
          sanitized.businessInfo = businessValidation.sanitized;
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      sanitized: errors.length === 0 ? sanitized : null,
      errors
    };
  }
}

module.exports = ValidationUtils;