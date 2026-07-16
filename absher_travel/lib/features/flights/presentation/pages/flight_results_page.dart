import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/theme/app_colors.dart';

class FlightResultsPage extends ConsumerWidget {
  final Map<String, dynamic> searchParams;
  const FlightResultsPage({super.key, required this.searchParams});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            '${searchParams['from'] ?? ''} → ${searchParams['to'] ?? ''}',
          ),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(40),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Row(
                children: [
                  const Icon(Icons.people_outline, color: AppColors.white, size: 16),
                  const SizedBox(width: 4),
                  Text('${searchParams['adults'] ?? 1} راكب',
                      style: const TextStyle(color: AppColors.white, fontSize: 12)),
                  const SizedBox(width: 16),
                  const Icon(Icons.airline_seat_recline_normal,
                      color: AppColors.white, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    searchParams['cabinClass'] == 'business'
                        ? AppStrings.business
                        : searchParams['cabinClass'] == 'first'
                            ? AppStrings.firstClass
                            : AppStrings.economy,
                    style: const TextStyle(color: AppColors.white, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.flight_outlined, size: 80, color: AppColors.primary),
              SizedBox(height: 16),
              Text(
                'جاري البحث عن أفضل الرحلات...',
                style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
              ),
              SizedBox(height: 24),
              Text(
                'سيتم ربط هذه الصفحة بخدمة Duffel API\nلعرض الرحلات الحقيقية',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textHint, fontSize: 13),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
