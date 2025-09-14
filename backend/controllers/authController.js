const crypto = require('crypto');
const { getSupabase } = require('../config/database');
const bcrypt = require('bcryptjs');

// Send token response
const sendTokenResponse = (user, session, statusCode, res) => {
  res.status(statusCode).json({
    success: true,
    session,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      user_type: user.user_type,
      is_verified: user.is_verified,
      is_nafath_verified: user.is_nafath_verified,
      business_name: user.business_name,
      family_size: user.family_size,
      city: user.city,
      created_at: user.created_at
    }
  });
};

// Helper function to get user profile from database
const getUserProfile = async (userId) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

// @desc    Register customer
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, location } = req.body;
    const supabase = getSupabase();

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, phone, password'
      });
    }

    // Validate location
    if (!location || !location.city) {
      return res.status(400).json({
        success: false,
        message: 'Please provide location with city'
      });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('email, phone')
      .or(`email.eq.${email},phone.eq.${phone}`);
    
    if (existingUsers && existingUsers.length > 0) {
      const field = existingUsers[0].email === email ? 'email' : 'phone';
      return res.status(409).json({
        success: false,
        message: `User with this ${field} already exists`
      });
    }

    console.log(`Creating new customer account for: ${email}`);

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          user_type: 'customer',
          city: location.city,
          district: location.district
        }
      }
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return res.status(400).json({
        success: false,
        message: authError.message
      });
    }

    // Hash password for database storage
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user profile into database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        name,
        email,
        phone,
        password_hash: passwordHash,
        user_type: 'customer',
        city: location.city,
        district: location.district,
        latitude: location.coordinates?.latitude,
        longitude: location.coordinates?.longitude
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up auth user if database insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user profile'
      });
    }

    console.log(`Customer registration successful for: ${email}`);
    sendTokenResponse(userData, authData.session, 201, res);
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
};

// @desc    Register shop
// @route   POST /api/auth/register/shop
// @access  Public
const registerShop = async (req, res, next) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      password, 
      location, 
      businessInfo 
    } = req.body;
    const supabase = getSupabase();

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, phone, password'
      });
    }

    // Validate location
    if (!location || !location.city) {
      return res.status(400).json({
        success: false,
        message: 'Please provide location with city'
      });
    }

    // Validate business info
    if (!businessInfo || !businessInfo.businessName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide business information with business name'
      });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('email, phone')
      .or(`email.eq.${email},phone.eq.${phone}`);
    
    if (existingUsers && existingUsers.length > 0) {
      const field = existingUsers[0].email === email ? 'email' : 'phone';
      return res.status(409).json({
        success: false,
        message: `Shop with this ${field} already exists`
      });
    }

    console.log(`Creating new shop account for: ${email}`);

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          user_type: 'shop',
          city: location.city,
          district: location.district,
          business_name: businessInfo.businessName
        }
      }
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return res.status(400).json({
        success: false,
        message: authError.message
      });
    }

    // Hash password for database storage
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user profile into database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        name,
        email,
        phone,
        password_hash: passwordHash,
        user_type: 'shop',
        city: location.city,
        district: location.district,
        latitude: location.coordinates?.latitude,
        longitude: location.coordinates?.longitude,
        business_name: businessInfo.businessName,
        business_type: businessInfo.businessType,
        commercial_registration: businessInfo.commercialRegistration
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up auth user if database insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user profile'
      });
    }

    console.log(`Shop registration successful for: ${email}`);
    sendTokenResponse(userData, authData.session, 201, res);
  } catch (error) {
    console.error('Shop registration error:', error);
    next(error);
  }
};

// @desc    Register productive family
// @route   POST /api/auth/register/family
// @access  Public
const registerFamily = async (req, res, next) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      password, 
      location, 
      businessInfo,
      familyInfo 
    } = req.body;
    const supabase = getSupabase();

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, phone, password'
      });
    }

    // Validate location
    if (!location || !location.city) {
      return res.status(400).json({
        success: false,
        message: 'Please provide location with city'
      });
    }

    // Validate family info
    if (!familyInfo || !familyInfo.familySize) {
      return res.status(400).json({
        success: false,
        message: 'Please provide family information with family size'
      });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('email, phone')
      .or(`email.eq.${email},phone.eq.${phone}`);
    
    if (existingUsers && existingUsers.length > 0) {
      const field = existingUsers[0].email === email ? 'email' : 'phone';
      return res.status(409).json({
        success: false,
        message: `Productive family with this ${field} already exists`
      });
    }

    console.log(`Creating new productive family account for: ${email}`);

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          user_type: 'productive_family',
          city: location.city,
          district: location.district,
          family_size: familyInfo.familySize
        }
      }
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return res.status(400).json({
        success: false,
        message: authError.message
      });
    }

    // Hash password for database storage
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user profile into database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        name,
        email,
        phone,
        password_hash: passwordHash,
        user_type: 'productive_family',
        city: location.city,
        district: location.district,
        latitude: location.coordinates?.latitude,
        longitude: location.coordinates?.longitude,
        family_size: familyInfo.familySize,
        specialty: familyInfo.specialty,
        years_of_experience: familyInfo.yearsOfExperience,
        business_name: businessInfo?.businessName
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up auth user if database insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user profile'
      });
    }

    console.log(`Productive family registration successful for: ${email}`);
    sendTokenResponse(userData, authData.session, 201, res);
  } catch (error) {
    console.error('Family registration error:', error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const supabase = getSupabase();

    // Validate input
    if (!email || !password) {
      console.log('Login attempt with missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.log(`Login attempt failed for email: ${email} - ${authError.message}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Get user profile from database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (dbError || !userData) {
      console.error('Failed to fetch user profile:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile'
      });
    }

    // Check if user is active
    if (!userData.is_active) {
      console.log(`Login attempt with deactivated account: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    console.log(`Successful login for user: ${email}`);
    sendTokenResponse(userData, authData.session, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to logout'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    
    // Get current user from Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    // Get user profile from database
    const userData = await getUserProfile(authUser.id);

    res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const supabase = getSupabase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    // Check if user exists in our database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (dbError || !userData) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Send password reset email via Supabase Auth
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (resetError) {
      console.error('Password reset error:', resetError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }

    console.log(`Password reset email sent to: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Reset password email sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { password, access_token, refresh_token } = req.body;
    const supabase = getSupabase();

    if (!password || !access_token || !refresh_token) {
      return res.status(400).json({
        success: false,
        message: 'Please provide password and tokens'
      });
    }

    // Set the session with the tokens from the reset link
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token
    });

    if (sessionError) {
      console.log('Invalid or expired reset tokens');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired tokens'
      });
    }

    // Update the password
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update password'
      });
    }

    // Get user profile
    const userData = await getUserProfile(updateData.user.id);

    console.log(`Password reset successful for user: ${updateData.user.email}`);
    sendTokenResponse(userData, sessionData.session, 200, res);
  } catch (error) {
    console.error('Reset password error:', error);
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const supabase = getSupabase();

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    // Get current user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password: currentPassword
    });

    if (verifyError) {
      console.log(`Password update failed - incorrect current password for user: ${authUser.email}`);
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update password'
      });
    }

    // Get user profile
    const userData = await getUserProfile(authUser.id);

    console.log(`Password updated successfully for user: ${authUser.email}`);
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    sendTokenResponse(userData, session, 200, res);
  } catch (error) {
    console.error('Update password error:', error);
    next(error);
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const { token_hash, type } = req.query;
    const supabase = getSupabase();

    if (!token_hash || type !== 'email') {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification parameters'
      });
    }

    // Verify the email with Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email'
    });

    if (error) {
      console.log(`Email verification failed: ${error.message}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Update user verification status in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('id', data.user.id);

    if (updateError) {
      console.error('Failed to update verification status:', updateError);
    }

    console.log(`Email verified successfully for user: ${data.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const supabase = getSupabase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    // Check if user exists and verification status
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, email, is_verified')
      .eq('email', email)
      .single();

    if (dbError || !userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (userData.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Resend verification email via Supabase Auth
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });

    if (resendError) {
      console.error('Failed to resend verification email:', resendError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }

    console.log(`Verification email resent for: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    next(error);
  }
};

// @desc    Nafath authentication
// @route   POST /api/auth/nafath/auth
// @access  Public
const nafathAuth = async (req, res, next) => {
  try {
    const { nafathId, transactionId } = req.body;
    const supabase = getSupabase();
    
    if (!nafathId || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Nafath ID and transaction ID are required'
      });
    }

    // Check if user exists with this Nafath ID
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('nafath_id', nafathId)
      .single();

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Database error during Nafath auth:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }
    
    // Nafath API integration would go here
    // For now, return a structured response for future implementation
    res.status(200).json({
      success: true,
      message: 'Nafath authentication initiated',
      data: {
        transactionId,
        status: 'pending',
        redirectUrl: `/api/auth/nafath/callback?transaction=${transactionId}`,
        userExists: !!userData
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Nafath callback
// @route   POST /api/auth/nafath/callback
// @access  Public
const nafathCallback = async (req, res, next) => {
  try {
    const { nafathId, verified, userData } = req.body;
    const supabase = getSupabase();

    if (!nafathId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Nafath ID'
      });
    }

    if (!verified) {
      console.log(`Nafath verification failed for ID: ${nafathId}`);
      return res.status(401).json({
        success: false,
        message: 'Nafath verification failed'
      });
    }

    // Find user with Nafath ID
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('nafath_id', nafathId)
      .single();

    let user;
    let session;

    if (findError && findError.code === 'PGRST116') {
      // User doesn't exist, create new user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: crypto.randomBytes(32).toString('hex'), // Generate random password
        options: {
          emailRedirectTo: `${process.env.FRONTEND_URL}/auth/callback`
        }
      });

      if (authError) {
        console.error('Failed to create auth user:', authError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create user account'
        });
      }

      // Insert user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          nafath_id: nafathId,
          is_nafath_verified: true,
          is_verified: true,
          user_type: 'customer',
          city: userData.city || 'الرياض'
        })
        .select()
        .single();

      if (profileError) {
        console.error('Failed to create user profile:', profileError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create user profile'
        });
      }

      user = profileData;
      session = authData.session;
      console.log(`New user created via Nafath: ${user.email}`);
    } else if (existingUser) {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          is_nafath_verified: true,
          is_verified: true
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update user:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Failed to update user'
        });
      }

      // Create session for existing user
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: existingUser.email
      });

      user = updatedUser;
      session = sessionData?.session;
      console.log(`Existing user verified via Nafath: ${user.email}`);
    } else {
      console.error('Database error during Nafath callback:', findError);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    sendTokenResponse(user, session, 200, res);
  } catch (error) {
    console.error('Nafath callback error:', error);
    next(error);
  }
};

module.exports = {
  register,
  registerShop,
  registerFamily,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyEmail,
  resendVerification,
  nafathAuth,
  nafathCallback
};