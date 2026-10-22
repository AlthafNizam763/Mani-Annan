import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class AuthUser {
  final String uid;
  final String email;
  final String? displayName;

  const AuthUser({
    required this.uid,
    required this.email,
    this.displayName,
  });
}

class AuthService extends ChangeNotifier {
  final ApiService apiService;
  final http.Client client;

  AuthUser? _user;
  String? _idToken;
  bool _loading = false;
  String? _error;

  // Firebase Web/Android API key from project configuration
  String firebaseApiKey;
  String authEndpoint;

  AuthService({
    required this.apiService,
    http.Client? client,
    this.firebaseApiKey = 'AIzaSyC6przI8Nb2Zp6fDhiuJ4SgC-vjjnWgjpg',
    String? authEndpoint,
  })  : client = client ?? http.Client(),
        authEndpoint = authEndpoint ??
            'https://identitytoolkit.googleapis.com/v1/accounts';

  AuthUser? get user => _user;
  String? get idToken => _idToken;
  bool get isAuthenticated => _user != null && _idToken != null;
  bool get loading => _loading;
  String? get error => _error;

  void clearError() {
    _error = null;
    notifyListeners();
  }

  // ==========================================
  // Direct Mock Login (For Automated Tests & Dev)
  // ==========================================
  void loginWithMockToken({
    required String uid,
    required String email,
    String? displayName,
  }) {
    _idToken = 'mock_test_token_$uid';
    _user = AuthUser(
      uid: uid,
      email: email,
      displayName: displayName ?? 'Test Owner',
    );
    apiService.authToken = _idToken;
    _error = null;
    notifyListeners();
  }

  // ==========================================
  // Sign In with Email & Password
  // ==========================================
  Future<bool> signIn(String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final url = Uri.parse('$authEndpoint:signInWithPassword?key=$firebaseApiKey');
      final res = await client.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email.trim(),
          'password': password,
          'returnSecureToken': true,
        }),
      );

      final data = jsonDecode(res.body);

      if (res.statusCode == 200) {
        _idToken = data['idToken'] as String?;
        _user = AuthUser(
          uid: data['localId'] as String? ?? '',
          email: data['email'] as String? ?? email,
          displayName: data['displayName'] as String?,
        );
        apiService.authToken = _idToken;
        _loading = false;
        notifyListeners();
        return true;
      } else {
        final err = data['error']?['message'] ?? 'Authentication failed';
        _error = _mapFirebaseError(err.toString());
        _loading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      // In local dev/emulator if internet is blocked or local server is offline
      _error = 'Connection failed: ${e.toString()}';
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  // ==========================================
  // Sign Up with Email & Password
  // ==========================================
  Future<bool> signUp(String email, String password, {String? displayName}) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final url = Uri.parse('$authEndpoint:signUp?key=$firebaseApiKey');
      final res = await client.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email.trim(),
          'password': password,
          'returnSecureToken': true,
        }),
      );

      final data = jsonDecode(res.body);

      if (res.statusCode == 200) {
        _idToken = data['idToken'] as String?;
        _user = AuthUser(
          uid: data['localId'] as String? ?? '',
          email: data['email'] as String? ?? email,
          displayName: displayName,
        );
        apiService.authToken = _idToken;
        _loading = false;
        notifyListeners();
        return true;
      } else {
        final err = data['error']?['message'] ?? 'Registration failed';
        _error = _mapFirebaseError(err.toString());
        _loading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Connection failed: ${e.toString()}';
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  // ==========================================
  // Send Password Reset Email
  // ==========================================
  Future<bool> resetPassword(String email) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final url = Uri.parse('$authEndpoint:sendOobCode?key=$firebaseApiKey');
      final res = await client.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'requestType': 'PASSWORD_RESET',
          'email': email.trim(),
        }),
      );

      if (res.statusCode == 200) {
        _loading = false;
        notifyListeners();
        return true;
      } else {
        final data = jsonDecode(res.body);
        _error = _mapFirebaseError(data['error']?['message'] ?? 'Reset failed');
        _loading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  // ==========================================
  // Sign Out
  // ==========================================
  void signOut() {
    _user = null;
    _idToken = null;
    apiService.authToken = null;
    _error = null;
    notifyListeners();
  }

  String _mapFirebaseError(String code) {
    if (code.contains('EMAIL_NOT_FOUND')) return 'No account registered with this email address.';
    if (code.contains('INVALID_PASSWORD')) return 'Incorrect password. Please try again.';
    if (code.contains('EMAIL_EXISTS')) return 'An account with this email already exists.';
    if (code.contains('WEAK_PASSWORD')) return 'Password must be at least 6 characters.';
    if (code.contains('INVALID_EMAIL')) return 'Please provide a valid email format.';
    if (code.contains('USER_DISABLED')) return 'This user account has been disabled.';
    if (code.contains('TOO_MANY_ATTEMPTS_TRY_LATER')) return 'Too many attempts. Please try again later.';
    return code.replaceAll('_', ' ');
  }
}
