import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

class AuthScreen extends StatefulWidget {
  final AuthService authService;

  const AuthScreen({super.key, required this.authService});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();

  bool _isSignUp = false;
  bool _isForgot = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an email address')),
      );
      return;
    }

    if (_isForgot) {
      final ok = await widget.authService.resetPassword(email);
      if (ok && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Password reset link sent to your email')),
        );
        setState(() => _isForgot = false);
      }
      return;
    }

    if (password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your password')),
      );
      return;
    }

    if (_isSignUp) {
      await widget.authService.signUp(
        email,
        password,
        displayName: _nameController.text.trim().isNotEmpty
            ? _nameController.text.trim()
            : null,
      );
    } else {
      await widget.authService.signIn(email, password);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.authService,
      builder: (context, _) {
        final loading = widget.authService.loading;
        final error = widget.authService.error;

        return Scaffold(
          backgroundColor: AppTheme.background,
          body: SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Logo & Branding
                      Center(
                        child: Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: AppTheme.border, width: 1.5),
                            color: AppTheme.surfaceElevated,
                          ),
                          child: ClipOval(
                            child: Image.asset(
                              'assets/logo.png',
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) =>
                                  const Icon(Icons.person, size: 36, color: Colors.white),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Mani-Annan',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Authentic Personal AI Messaging Assistant',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                      ),
                      const SizedBox(height: 28),

                      // Card Container
                      Container(
                        padding: const EdgeInsets.all(22),
                        decoration: BoxDecoration(
                          color: AppTheme.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              _isForgot
                                  ? 'Reset Password'
                                  : _isSignUp
                                      ? 'Create Owner Account'
                                      : 'Sign In to Mani',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _isForgot
                                  ? 'Enter your email to receive recovery instructions.'
                                  : _isSignUp
                                      ? 'Set up your authentic style memory and contact rules.'
                                      : 'Enter your credentials to access your assistant studio.',
                              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                            ),
                            const SizedBox(height: 20),

                            // Error Banner
                            if (error != null) ...[
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: AppTheme.roseMuted.withValues(alpha: 0.35),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: AppTheme.rose.withValues(alpha: 0.6)),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.error_outline, size: 16, color: AppTheme.rose),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        error,
                                        style: const TextStyle(fontSize: 11, color: AppTheme.rose),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 16),
                            ],

                            // Name field (Sign Up only)
                            if (_isSignUp) ...[
                              const Text('Display Name', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 6),
                              TextField(
                                controller: _nameController,
                                style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                                decoration: const InputDecoration(
                                  hintText: 'e.g. Alex',
                                  prefixIcon: Icon(Icons.badge_outlined, size: 18, color: AppTheme.textMuted),
                                ),
                              ),
                              const SizedBox(height: 14),
                            ],

                            // Email field
                            const Text('Email Address', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 6),
                            TextField(
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                              decoration: const InputDecoration(
                                hintText: 'owner@example.com',
                                prefixIcon: Icon(Icons.mail_outline, size: 18, color: AppTheme.textMuted),
                              ),
                            ),
                            const SizedBox(height: 14),

                            // Password field
                            if (!_isForgot) ...[
                              const Text('Password', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 6),
                              TextField(
                                controller: _passwordController,
                                obscureText: _obscurePassword,
                                style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                                decoration: InputDecoration(
                                  hintText: '••••••••',
                                  prefixIcon: const Icon(Icons.lock_outline, size: 18, color: AppTheme.textMuted),
                                  suffixIcon: IconButton(
                                    icon: Icon(
                                      _obscurePassword ? Icons.visibility_off : Icons.visibility,
                                      size: 18,
                                      color: AppTheme.textMuted,
                                    ),
                                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 10),
                            ],

                            // Forgot Password link
                            if (!_isSignUp && !_isForgot) ...[
                              Align(
                                alignment: Alignment.centerRight,
                                child: GestureDetector(
                                  onTap: () {
                                    widget.authService.clearError();
                                    setState(() => _isForgot = true);
                                  },
                                  child: const Text(
                                    'Forgot password?',
                                    style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 16),
                            ] else ...[
                              const SizedBox(height: 10),
                            ],

                            // Submit Button
                            ElevatedButton(
                              onPressed: loading ? null : _submit,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 13),
                              ),
                              child: loading
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                                    )
                                  : Text(
                                      _isForgot
                                          ? 'Send Reset Link'
                                          : _isSignUp
                                              ? 'Create Account'
                                              : 'Sign In',
                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                    ),
                            ),
                            const SizedBox(height: 14),

                            // Mode toggle links
                            if (_isForgot) ...[
                              Center(
                                child: TextButton(
                                  onPressed: () {
                                    widget.authService.clearError();
                                    setState(() => _isForgot = false);
                                  },
                                  child: const Text('Back to Sign In', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                                ),
                              ),
                            ] else ...[
                              Center(
                                child: GestureDetector(
                                  onTap: () {
                                    widget.authService.clearError();
                                    setState(() => _isSignUp = !_isSignUp);
                                  },
                                  child: Text.rich(
                                    TextSpan(
                                      text: _isSignUp ? 'Already have an account? ' : "Don't have an account? ",
                                      style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                                      children: [
                                        TextSpan(
                                          text: _isSignUp ? 'Sign In' : 'Sign Up',
                                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Fast Development / Offline Testing Login Box
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceElevated.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.borderSubtle),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.science_outlined, size: 14, color: AppTheme.emerald),
                                SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    'Development / Test Mode Quick Login',
                                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Bypass remote Firebase authentication during integration and static tests:',
                              style: TextStyle(fontSize: 10, color: AppTheme.textMuted),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: () {
                                      widget.authService.loginWithMockToken(
                                        uid: 'user_alpha',
                                        email: 'alpha@example.com',
                                        displayName: 'Owner Alpha',
                                      );
                                    },
                                    style: OutlinedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                      textStyle: const TextStyle(fontSize: 11),
                                    ),
                                    child: const Text('User Alpha'),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: () {
                                      widget.authService.loginWithMockToken(
                                        uid: 'user_beta',
                                        email: 'beta@example.com',
                                        displayName: 'Owner Beta',
                                      );
                                    },
                                    style: OutlinedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                      textStyle: const TextStyle(fontSize: 11),
                                    ),
                                    child: const Text('User Beta'),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
