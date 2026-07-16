import 'package:flutter/material.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/theme/app_colors.dart';

class HomeHeroSection extends StatelessWidget {
  final String? userName;
  const HomeHeroSection({super.key, this.userName});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primaryDark, AppColors.primary, AppColors.primaryLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 48),
              Text(
                userName != null
                    ? '${AppStrings.welcome}، $userName 👋'
                    : '${AppStrings.welcome} في ${AppStrings.appName}',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: AppColors.white.withOpacity(0.85),
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                'إلى أين تريد السفر اليوم؟',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: AppColors.white,
                      fontWeight: FontWeight.w800,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
