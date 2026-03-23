import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env';
import { findOrCreateGoogleUser } from '../models/user/user.model';

passport.use(
  new GoogleStrategy(
    {
      clientID:     env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL:  env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const avatar = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error('No email found in Google profile'), undefined);
        }

        // Find or create user in our DB
        const user = await findOrCreateGoogleUser({
          name:     profile.displayName,
          email,
          googleId: profile.id,
          avatar,
        });

        return done(null, user);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);

// Required by passport even if we don't use sessions
passport.serializeUser((user: any, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

export default passport;