<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #111; line-height: 1.6; max-width: 520px; margin: 24px auto;">
    <h1 style="font-size: 20px; margin-bottom: 12px;">Reset your Jobix password</h1>
    <p style="margin-top: 0;">Enter a new password for your account.</p>
    <form method="POST" action="{{ url('/api/auth/reset-password') }}">
      <input type="hidden" name="token" value="{{ $token }}">
      <input type="hidden" name="email" value="{{ $email }}">
      <div style="margin-bottom: 12px;">
        <label for="password" style="display: block; font-weight: 600; margin-bottom: 4px;">New password</label>
        <input id="password" type="password" name="password" required style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
      </div>
      <div style="margin-bottom: 16px;">
        <label for="password_confirmation" style="display: block; font-weight: 600; margin-bottom: 4px;">Confirm password</label>
        <input id="password_confirmation" type="password" name="password_confirmation" required style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
      </div>
      <button type="submit" style="background: #111827; color: #fff; padding: 10px 16px; border: 0; border-radius: 4px; cursor: pointer;">
        Reset password
      </button>
    </form>
  </body>
</html>
