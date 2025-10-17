// Supabase auth with email verification for Vercel
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate random token
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Send verification email
async function sendVerificationEmail(email, token) {
  const verificationUrl = `https://www.nav-ai.co.uk/verify.html?token=${token}&email=${encodeURIComponent(email)}`;
  
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Verify your NavAI account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to NavAI! 🎨</h2>
          <p>Please verify your email address to start generating AI images.</p>
          <p>You'll get <strong>10 free credits</strong> to start with!</p>
          <a href="${verificationUrl}" style="background: #00bfff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
            Verify Email Address
          </a>
          <p>Or copy this link:</p>
          <p>${verificationUrl}</p>
          <p>If you didn't create this account, you can safely ignore this email.</p>
        </div>
      `
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

// Send password reset email
async function sendPasswordResetEmail(email, token) {
  const resetUrl = `https://www.nav-ai.co.uk/reset-password.html?token=${token}&email=${encodeURIComponent(email)}`;
  
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Reset your NavAI password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>Click the link below to reset your NavAI password:</p>
          <a href="${resetUrl}" style="background: #00bfff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
            Reset Password
          </a>
          <p>Or copy this link:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
      `
    });
    return true;
  } catch (error) {
    console.error('Password reset email error:', error);
    return false;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = '';
    req.on('data', chunk => body += chunk);
    await new Promise((resolve) => req.on('end', resolve));
    
    const { action, email, password, token, newPassword } = JSON.parse(body);
    
    if (action === 'signup') {
      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      // Check if user already exists
      const { data: existingUser, error: lookupError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.json({ success: false, message: 'Email already exists' });
      }

      // Create new user with verification token
      const userId = 'user_' + Date.now();
      const verificationToken = generateToken();
      
      const userData = {
        id: userId,
        email: email,
        password: password,
        credits: 10,
        email_verified: false,
        verification_token: verificationToken,
        created_at: new Date().toISOString()
      };

      // Insert user into Supabase
      const { data, error } = await supabase
        .from('users')
        .insert([userData]);

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: 'Failed to create user' });
      }

      // Send verification email
      const emailSent = await sendVerificationEmail(email, verificationToken);
      
      res.json({ 
        success: true, 
        message: emailSent ? 
          'Account created! Check your email for verification link.' : 
          'Account created! Please check your email for verification (if not received, check spam).',
        credits: 10,
        userId: userId,
        needsVerification: true
      });
      
    } else if (action === 'login') {
      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      // Find user and validate password
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return res.json({ success: false, message: 'Invalid email or password' });
      }
      
      if (user.password !== password) {
        return res.json({ success: false, message: 'Invalid email or password' });
      }

      // Check if email is verified
      if (!user.email_verified) {
        return res.json({ 
          success: false, 
          message: 'Please verify your email before logging in. Check your inbox for the verification link.',
          needsVerification: true
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Login successful',
        credits: user.credits,
        userId: user.id
      });

    } else if (action === 'verify-email') {
      if (!email || !token) {
        return res.status(400).json({ error: 'Missing email or token' });
      }

      // Find user and verify token
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('verification_token', token)
        .single();

      if (error || !user) {
        return res.json({ success: false, message: 'Invalid verification link' });
      }

      // Mark email as verified and clear token
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          email_verified: true,
          verification_token: null
        })
        .eq('email', email);

      if (updateError) {
        return res.status(500).json({ error: 'Verification failed' });
      }

      res.json({ 
        success: true, 
        message: 'Email verified successfully! You can now log in.'
      });

    } else if (action === 'forgot-password') {
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Find user
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (user) {
        // Generate reset token (valid for 1 hour)
        const resetToken = generateToken();
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        // Save reset token
        await supabase
          .from('users')
          .update({ 
            reset_token: resetToken,
            reset_token_expires: resetExpires
          })
          .eq('email', email);

        // Send reset email
        await sendPasswordResetEmail(email, resetToken);
      }

      // Always return success to prevent email enumeration
      res.json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent.'
      });

    } else if (action === 'reset-password') {
      if (!email || !token || !newPassword) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Find user and validate reset token
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('reset_token', token)
        .gt('reset_token_expires', new Date().toISOString())
        .single();

      if (error || !user) {
        return res.json({ success: false, message: 'Invalid or expired reset link' });
      }

      // Update password and clear reset token
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password: newPassword,
          reset_token: null,
          reset_token_expires: null
        })
        .eq('email', email);

      if (updateError) {
        return res.status(500).json({ error: 'Password reset failed' });
      }

      res.json({ 
        success: true, 
        message: 'Password reset successfully! You can now log in with your new password.'
      });

    } else {
      res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
