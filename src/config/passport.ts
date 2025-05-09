import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/user.model';

dotenv.config();

// JWT Strategy for token verification
const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'fallback_secret_for_dev',
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      // Validate payload
      if (!payload || !payload.id) {
        return done(null, false);
      }
      
      // Find user by ID
      const user = await User.findByPk(payload.id);
      
      if (!user) {
        return done(null, false);
      }
      
      // Return user if found
      return done(null, user);
    } catch (error) {
      console.error('JWT authentication error:', error);
      return done(error, false);
    }
  })
);

// Local Strategy for email/password login
passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email: string, password: string, done: any) => {
      try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
          return done(null, false, { message: 'User not found' });
        }

        // Check if user account is active
        if (user.active === false) {
          return done(null, false, { message: 'Your account has been deactivated. Please contact support for assistance.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('Initializing Google OAuth strategy');
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        scope: ['profile', 'email']
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          console.log('Google authentication successful for profile:', profile.id);
          
          // Check if user already exists
          let user = await User.findOne({
            where: { googleId: profile.id },
          });

          if (!user) {
            console.log('User not found by googleId, checking email');
            // Check if user with the same email exists
            if (profile.emails && profile.emails.length > 0) {
              const email = profile.emails[0].value;
              console.log('Looking up user by email:', email);
              user = await User.findOne({ where: { email } });

              if (user) {
                // Link the Google ID to the existing account
                console.log('Found existing user by email, linking Google account');
                await user.update({ 
                  googleId: profile.id,
                  // Update profile picture if not already set
                  profilePicture: user.profilePicture || profile.photos?.[0].value || ''
                });
              } else {
                // Create a new user
                console.log('Creating new user from Google profile');
                user = await User.create({
                  googleId: profile.id,
                  email: profile.emails?.[0].value || '',
                  name: profile.displayName || '',
                  profilePicture: profile.photos?.[0].value || '',
                  role: 'business',
                });
              }
            }
          } else {
            console.log('Found existing user by googleId');
          }

          return done(null, user || false);
        } catch (error) {
          console.error('Error during Google authentication:', error);
          return done(error, false);
        }
      }
    )
  );
} else {
  console.log('Google OAuth is not configured - missing API keys');
}

export default passport;