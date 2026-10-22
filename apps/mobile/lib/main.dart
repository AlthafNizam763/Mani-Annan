import 'package:flutter/material.dart';
import 'screens/auth_screen.dart';
import 'screens/main_shell.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'theme/app_theme.dart';

void main() {
  final apiService = ApiService();
  final authService = AuthService(apiService: apiService);

  runApp(ProjectEchoApp(
    apiService: apiService,
    authService: authService,
  ));
}

class ProjectEchoApp extends StatelessWidget {
  final ApiService? apiService;
  final AuthService? authService;

  const ProjectEchoApp({
    super.key,
    this.apiService,
    this.authService,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveApi = apiService ?? ApiService();
    final effectiveAuth = authService ?? AuthService(apiService: effectiveApi);

    return MaterialApp(
      title: 'Mani-Annan',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: ListenableBuilder(
        listenable: effectiveAuth,
        builder: (context, _) {
          if (effectiveAuth.isAuthenticated) {
            return MainShellScreen(
              apiService: effectiveApi,
              authService: effectiveAuth,
            );
          }
          return AuthScreen(authService: effectiveAuth);
        },
      ),
    );
  }
}
